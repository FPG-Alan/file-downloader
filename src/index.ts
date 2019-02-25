import filesystemIO from './methods/filesystem';
import memoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk } from './interface';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
class SavvyTransfer {
  static SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  static CHUNK_SIZE: number = 1024 * 1024 * 16;
  private IOMethod: filesystemIO | memoryIO | null = null;
  private size: number = 0;

  public files: SavvyFile[] = [];
  constructor() {
    this.setIOMethod();
  }

  private setIOMethod() {
    if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IOMethod = new filesystemIO();
    } else {
      this.IOMethod = new memoryIO();
    }
  }

  public async addFile(path: string): Promise<SavvyFile | undefined> {
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
    if (fileSize > SavvyTransfer.SIZE_LIMIT || fileSize + this.size > SavvyTransfer.SIZE_LIMIT) {
      console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');

      return;
    }
    // create new file
    let tmpFile: SavvyFile = new SavvyFile(path, fileSize, SavvyTransfer.CHUNK_SIZE);
    this.files.push(tmpFile);

    this.ScheduleDownload();
    return tmpFile;
  }

  private ScheduleDownload() {
    if (this.files.length > 0) {
      let nextFile: SavvyFile | undefined = this.files.find((file: SavvyFile) => file.status === 'ready');

      if (nextFile) {
        this.download(nextFile);
      }
    }
  }
  private async download(file: SavvyFile): Promise<undefined> {
    console.log(file);
    let nextChunk: TChunk = file.nextChunk();
    console.log('downloading chunk: ' + nextChunk.start + '-' + nextChunk.end);
    let response: Response = await fetch(file.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

    file.write(response);

    this.ScheduleDownload();
    return;
  }
  public upload(name: string): void {
    console.log('upload');
  }
}

export default SavvyTransfer;
