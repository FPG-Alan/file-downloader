import { TChunk, TStatus } from './interface';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';

export default class SavvyFile {
  public chunklist: TChunk[] = [];
  public status: TStatus;
  public filePath: string;
  public name: string;
  public fileSize: number;
  public chunkSize: number;

  public fileWriter: any;
  public fileEntry: any;

  private nowChunkIndex: number = 0;
  private IO: FilesystemIO | MemoryIO;

  constructor(path: string, name: string, fileSize: number, chunkSize: number, IO_instance: FilesystemIO | MemoryIO) {
    this.status = 'initializing';
    this.filePath = path;
    this.name = name;
    this.fileSize = fileSize;
    this.chunkSize = chunkSize;
    this.IO = IO_instance;

    let tmpStart: number = 0,
      tmpEnd: number = 0;
    while (tmpEnd < this.fileSize) {
      tmpEnd = tmpStart + this.chunkSize;
      tmpEnd = tmpEnd > this.fileSize ? this.fileSize : tmpEnd;
      this.chunklist.push({
        start: tmpStart,
        end: tmpEnd
      });

      tmpStart = tmpEnd + 1;
    }
  }
  public init = (): Promise<undefined> => {
    return new Promise((resolve: Function, reject: Function) => {
      this.IO.getFileWriter(
        this,
        (result: { fileEntry: FileEntry; fileWriter: FileWriter }) => {
          this.fileWriter = result.fileWriter;
          this.fileEntry = result.fileEntry;

          this.status = 'inited';
          resolve();
        },
        reject
      );
    });
  };

  public nextChunk(): TChunk {
    // make sure next chunk is available when status not chunk_empty
    if (!this.chunklist[this.nowChunkIndex + 1]) {
      this.status = 'chunk_empty';
    }
    console.log(this.chunklist, this.nowChunkIndex);
    return this.chunklist[this.nowChunkIndex++];
  }
}
