import { TChunk, TStatus } from './interface';
import filesystemIO from './methods/filesystem';
import memoryIO from './methods/memory';

export default class SavvyFile {
  public chunklist: TChunk[] = [];
  public status: TStatus;
  public filePath: string;

  private nowChunkIndex: number = 0;
  private IO: filesystemIO | memoryIO;

  constructor(path: string, fileSize: number, chunkSize: number, IOMethod: filesystemIO | memoryIO) {
    this.status = 'initializing';
    this.filePath = path;
    this.IO = IOMethod;

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

    this.status = 'ready';
  }

  public nextChunk(): TChunk {
    // make sure next chunk is available when status not chunk_empty
    if (!this.chunklist[this.nowChunkIndex + 1]) {
      this.status = 'chunk_empty';
    }
    return this.chunklist[this.nowChunkIndex++];
  }
  public write(response: Response): void {
    this.IO.write();
  }
}
