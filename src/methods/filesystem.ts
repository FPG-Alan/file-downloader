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
  private bufferCache: ArrayBuffer[] = [];

  private fullyDownloadCallback: Function | null;

  private writing: boolean = false;

  constructor(fileSize: number, name: string, fd_cb: Function) {
    super();
    this.size = fileSize;
    this.fileName = name;
    this.fullyDownloadCallback = fd_cb;
    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem;
    // 创建文件系统, 临时空间会被浏览器自行判断, 在需要时删除, 永久空间不会, 但申请时需要用户允许.
    // window.requestFileSystem(type, size, successCallback[, errorCallback]);
    customWindow.requestFileSystem(TEMPORARY, fileSize, this.handleFileSystemRequestSuccess);
  }
  private handleFileSystemRequestSuccess = (fs: FileSystem): void => {
    fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
      let dirReader: DirectoryReader = directoryEntry.createReader();

      dirReader.readEntries((entries: Entry[]) => {
        console.log(entries);
        // 在这里执行一些清除任务.
      });

      fs.root.getFile('savvy/' + this.fileName, { create: true }, (fileEntry: FileEntry) => {
        this.fileEntry = fileEntry;
        fileEntry.createWriter((fw: FileWriter) => {
          this.fileWriter = fw;
          this.fileWriter.onwritestart = this.handleFileWriteStart;
          this.fileWriter.onprogress = this.handleFileWriteProgress;
          this.fileWriter.onerror = this.handleFileWriteError;
          this.fileWriter.onwriteend = this.handleFileWriteEnd;
          if (this.bufferCache.length > 0) {
            this.write(this.bufferCache.shift()!);
          }
        });
      });
    });
  };

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

    console.log(this.bufferCache);
    if (this.bufferCache.length > 0) {
      this.write(this.bufferCache.shift()!);
    }

    if (this.fileWriter!.position === this.size) {
      if (this.fullyDownloadCallback) {
        this.fullyDownloadCallback();
      }

      this.download('');
    }
  };
  // Try to free space before starting the download.
  // 需要考虑是否存在当前有文件正在从沙盒环境写入本地文件系统, 在这个过程中不能删除这个空间.
  private free_space(callback: Function, ms: number, delta: any): void {}
  public write(buffer: ArrayBuffer): void {
    console.log('filesystem write');
    if (this.fileWriter && !this.writing) {
      try {
        this.fileWriter!.write(new Blob([buffer]));
      } catch (e) {
        console.log(e);
      }
    } else {
      this.bufferCache.push(buffer);
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
