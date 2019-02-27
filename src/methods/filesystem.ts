import IO from './IO';
import { filemime } from '../utils/index';

const customWindow: any = window;
const TEMPORARY: number = 0;
const PERSISTENT: number = 1;

export default class FilesystemIO extends IO {
  private size: number;
  private downloadSize: number = 0;
  private fileName: string;

  private fileWriter: FileWriter | null = null;
  private fileEntry: FileEntry | null = null;
  // private bufferCache: ArrayBuffer[] = [];

  private writing: boolean = false;

  private writeEndResolve: Function | null = null;
  private writeEndReject: Function | null = null;

  constructor(fileSize: number, name: string, initedCallback: Function) {
    super();
    this.size = fileSize;
    this.fileName = name;
    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem;
    // 创建文件系统, 临时空间会被浏览器自行判断, 在需要时删除, 永久空间不会, 但申请时需要用户允许.
    // window.requestFileSystem(type, size, successCallback[, errorCallback]);
    customWindow.requestFileSystem(TEMPORARY, fileSize, (fs: FileSystem) => {
      fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
        let dirReader: DirectoryReader = directoryEntry.createReader();

        dirReader.readEntries((entries: Entry[]) => {
          console.log(entries);

          // TO-DO: can not just simply clear all old files, need to keep files which are not completely downloaded.
          /* entries.map((entry: Entry) => {
            entry.remove(() => {
              console.log('remove file [' + entry.name + '] from filesystem successful.');
            });
          }); */
        });

        fs.root.getFile('savvy/' + this.fileName, { create: true }, (fileEntry: FileEntry) => {
          this.fileEntry = fileEntry;
          fileEntry.createWriter((fw: FileWriter) => {
            this.fileWriter = fw;
            this.fileWriter.onwritestart = this.handleFileWriteStart;
            this.fileWriter.onprogress = this.handleFileWriteProgress;
            this.fileWriter.onerror = this.handleFileWriteError;
            this.fileWriter.onwriteend = this.handleFileWriteEnd;

            initedCallback && initedCallback();
          });
        });
      });
    });
  }

  private handleFileWriteStart = (event: ProgressEvent): void => {
    console.log(event);

    this.writing = true;
  };
  private handleFileWriteProgress = (event: ProgressEvent): void => {
    console.log(event);
  };
  private handleFileWriteError = (event: ProgressEvent): void => {
    console.log(event);

    this.writing = false;
  };
  private handleFileWriteEnd = (event: ProgressEvent): void => {
    console.log(event);
    console.log(this.fileWriter!.position);
    this.writing = false;

    if (this.writeEndResolve) {
      this.writeEndResolve();

      this.writeEndReject = null;
      this.writeEndResolve = null;
    }
  };
  // Try to free space before starting the download.
  // 需要考虑是否存在当前有文件正在从沙盒环境写入本地文件系统, 在这个过程中不能删除这个空间.
  private free_space(callback: Function, ms: number, delta: any): void {}
  public write(buffer: ArrayBuffer): Promise<any> {
    console.log('filesystem write');
    // has requested fs and get a file writer...
    if (this.fileWriter) {
      try {
        this.fileWriter!.write(new Blob([buffer]));

        return new Promise((resolve, reject) => {
          this.writeEndResolve = resolve;
          this.writeEndReject = reject;
        });
      } catch (e) {
        console.log(e);

        return new Promise((resolve, reject) => {
          reject(e);
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        reject('no file writer.');
      });
    }
  }

  public download(name: string): void {
    console.log('filesystem download');

    if (typeof this.fileEntry!.file === 'function') {
      try {
        this.fileEntry!.file(this.saveFile, this.saveLink);
      } catch (e) {
        console.log(e);
      }
    } else {
      this.saveLink();
    }
  }

  private saveLink = (err?: DOMError, objectURL?: string) => {
    let link: string | false = typeof objectURL === 'string' && objectURL;
    let dlLinkNode: HTMLAnchorElement = document.createElement('a');

    dlLinkNode.download = this.fileName;
    dlLinkNode.href = link || this.fileEntry!.toURL();

    dlLinkNode.click();
  };

  private saveFile = (file: File) => {
    try {
      let _file: File = new File([file], this.fileName, {
        type: filemime(this.fileName)
      });

      this.saveLink(undefined, window.URL.createObjectURL(_file));
    } catch (ex) {
      console.log(ex);
      this.saveLink();
    }
  };
}
