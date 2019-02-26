import { TChunk, TStatus } from './interface';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';

export default class SavvyFile {
  public chunklist: TChunk[] = [];
  public status: TStatus;
  public filePath: string;
  public name: string;

  private nowChunkIndex: number = 0;
  private IO: FilesystemIO | MemoryIO;

  constructor(
    path: string,
    name: string,
    fileSize: number,
    chunkSize: number,
    IOMethod: (new (fileSize: number) => MemoryIO) | (new (fileSize: number, name: string, fd_cb: Function) => FilesystemIO)
  ) {
    this.status = 'initializing';
    this.filePath = path;
    this.name = name;
    this.IO = new IOMethod(fileSize, name, this.fullyDownloadCallback);

    let tmpStart: number = 0,
      tmpEnd: number = 0;
    while (tmpEnd < fileSize) {
      tmpEnd = tmpStart + chunkSize;
      tmpEnd = tmpEnd > fileSize ? fileSize : tmpEnd;
      this.chunklist.push({
        start: tmpStart,
        end: tmpEnd
      });

      tmpStart = tmpEnd + 1;
    }

    this.status = 'inited';
  }

  public nextChunk(): TChunk {
    // make sure next chunk is available when status not chunk_empty
    if (!this.chunklist[this.nowChunkIndex + 1]) {
      this.status = 'chunk_empty';
    }
    console.log(this.chunklist, this.nowChunkIndex);
    return this.chunklist[this.nowChunkIndex++];
  }
  public async write(response: Response): Promise<any> {
    let buffer: ArrayBuffer = await response.arrayBuffer();
    let fullyDownload: boolean = this.IO.write(buffer);

    if (fullyDownload) {
      this.status = 'chunk_empty';
    }
  }
  private fullyDownloadCallback() {
    this.status = 'chunk_empty';
  }

  public download(): void {
    this.status = 'downloading';
    this.IO.download(this.name);
    this.status = 'complete';
  }
}
