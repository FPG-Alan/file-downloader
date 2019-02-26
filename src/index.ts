import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk } from './interface';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
class SavvyTransfer {
  static SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  static CHUNK_SIZE: number = 1024 * 1024 * 16;
  private IOMethod: any;
  private size: number = 0;

  public files: SavvyFile[] = [];
  constructor() {
    // this.setIOMethod();
    // this.IOMethod = MemoryIO;
    this.IOMethod = FilesystemIO;
  }

  private setIOMethod() {
    /* if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IOMethod = new filesystemIO();
    } else {
      this.IOMethod = new memoryIO();
    } */
    // this.IOMethod = MemoryIO;
  }

  public async addFile(path: string, name: string): Promise<SavvyFile | undefined> {
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
    let tmpFile: SavvyFile = new SavvyFile(path, name, fileSize, SavvyTransfer.CHUNK_SIZE, this.IOMethod!);
    this.files.push(tmpFile);

    this.ScheduleDownload();
    return tmpFile;
  }

  private ScheduleDownload() {
    console.log('ScheduleDownload', this.files);
    if (this.files.length > 0) {
      let nextFile: SavvyFile | undefined = this.files.find((file: SavvyFile) => file.status === 'inited');

      if (nextFile) {
        this.fetchData(nextFile);
      } else {
        // this.downloadFile(this.files.filter((file: SavvyFile) => file.status === 'chunk_empty'));
      }
    }
  }
  private async fetchData(file: SavvyFile): Promise<undefined> {
    console.log('fetchData');
    let nextChunk: TChunk = file.nextChunk();
    if (nextChunk) {
      console.log('downloading chunk: ' + nextChunk.start + '-' + nextChunk.end);
      let response: Response = await fetch(file.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

      await file.write(response);
    }
    this.ScheduleDownload();

    return;
  }
  private downloadFile(files: SavvyFile[]): void {
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      files[i].download();
    }
  }
  public upload(name: string): void {
    console.log('upload');
  }
}

export default SavvyTransfer;
