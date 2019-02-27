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

  constructor(path: string, name: string, fileSize: number, chunkSize: number, IOMethod: typeof FilesystemIO | typeof MemoryIO, initedCallback: Function) {
    this.status = 'initializing';
    this.filePath = path;
    this.name = name;

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

    this.IO = new IOMethod(fileSize, name, initedCallback);
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
    await this.IO.write(buffer);
    console.log('file write complete');
    return;
  }

  public download(): void {
    this.status = 'downloading';
    this.IO.download(this.name);
    this.status = 'complete';
  }
}
