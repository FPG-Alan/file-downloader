import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk } from './interface';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
class SavvyTransfer {
  static SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  static CHUNK_SIZE: number = 1024 * 1024 * 16;
  private IO: FilesystemIO | MemoryIO;
  private size: number = 0;

  private fileInited: number = 0;
  private fileAllAdded: boolean = false;
  private readyForDownload: boolean = false;
  private waitReadyAndDownload: boolean = false;

  public files: SavvyFile[] = [];
  constructor() {
    // this.setIOMethod();
    // this.IOMethod = MemoryIO;
    this.IO = new FilesystemIO();
  }

  private setIOMethod() {
    /* if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IOMethod = new filesystemIO();
    } else {
      this.IOMethod = new memoryIO();
    } */
    // this.IOMethod = MemoryIO;
  }

  public async addFiles(files: { path: string; name: string }[]): Promise<SavvyFile[]> {
    let savvyFiles: SavvyFile[] = [];
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      let tmpFile: SavvyFile | undefined = await this._addFile(files[i].path, files[i].name);

      if (tmpFile) {
        savvyFiles.push(tmpFile);
      }
    }

    this.readyForDownload = true;

    if (this.waitReadyAndDownload) {
      this.waitReadyAndDownload = false;
      this.scheduleDownload();
    }
    return savvyFiles;
  }
  public async addFile(path: string, name: string): Promise<SavvyFile | undefined> {
    let tmpFile: SavvyFile | undefined = await this._addFile(path, name);

    this.readyForDownload = true;
    if (this.waitReadyAndDownload) {
      this.waitReadyAndDownload = false;
      this.scheduleDownload();
    }

    return tmpFile;
  }

  public async addZipFiles(files: { path: string; name: string }[]): Promise<undefined> {
    console.log('add zip files...');
    return;
  }
  public showFiles() {
    console.log('show files');
  }
  private async _addFile(path: string, name: string): Promise<SavvyFile | undefined> {
    console.log('begin download: ' + path);
    if (!path) {
      console.log('file path invalid.');
      return;
    }

    // get file size
    let response: Response = await fetch(path, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    if (!response.headers.get('content-range')) {
      console.log('can not get file size, check file path or contact service provider.');

      return;
    }
    // calculate whether the size limit is exceeded
    let fileSize: number = parseInt(response.headers.get('content-range')!.split('/')[1]);
    /*if (fileSize > SavvyTransfer.SIZE_LIMIT || fileSize + this.size > SavvyTransfer.SIZE_LIMIT) {
      console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');

      return;
    } */
    // create new file
    let tmpFile: SavvyFile = new SavvyFile(path, name, fileSize, SavvyTransfer.CHUNK_SIZE, this.IO);
    // ensure each file get it's writer from IO
    await tmpFile.init();

    this.files.push(tmpFile);
    return tmpFile;
  }

  // add file 之后手动调用, 此时如果files还没有准备好, 则设置变量等待.
  public scheduleDownload = (filesForZip?: SavvyFile[]) => {
    if (this.readyForDownload) {
      console.log('start download...', this.files);
      if (filesForZip) {
        // download all file in filesForZip, and store as a single zip file.
        if (filesForZip.length > 0) {
          let nextFile: SavvyFile | undefined = filesForZip.find((file: SavvyFile) => file.status === 'inited');

          // 还有等待下载的文件
          if (nextFile) {
            this.fetchData(nextFile);
          } else {
            this.IO.download(filesForZip.filter((file: SavvyFile) => file.status === 'chunk_empty'));
          }
        }
      } else {
        // normal download, as sperate files.
        if (this.files.length > 0) {
          let nextFile: SavvyFile | undefined = this.files.find((file: SavvyFile) => file.status === 'inited');

          // 还有等待下载的文件
          if (nextFile) {
            this.fetchData(nextFile);
          } else {
            this.IO.download(this.files.filter((file: SavvyFile) => file.status === 'chunk_empty'), true);
          }
        }
      }
    } else {
      this.waitReadyAndDownload = true;
    }
  };
  private fetchData = async (file: SavvyFile): Promise<undefined> => {
    // here must be an unprocessed block, cos file.status is not 'chunk_empty'
    let nextChunk: TChunk = file.nextChunk();
    console.log(file.name + ' downloading chunk: ' + nextChunk.start + '-' + nextChunk.end);
    let response: Response = await fetch(file.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });
    let buffer: ArrayBuffer = await response.arrayBuffer();
    await this.IO.write(file, buffer);

    this.scheduleDownload();

    return;
  };

  public upload(name: string): void {
    console.log('upload');
  }
}

export default SavvyTransfer;
