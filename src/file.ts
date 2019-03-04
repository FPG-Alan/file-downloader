import { TChunk, TStatus } from './interface';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';

export default class SavvyFile {
  public isZip: boolean = false;
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

  public offset: number = 0;
  public crc: number = 0;

  public headerPos: number = 0;
  public bufferAcc: number = 0;

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
        filePath: this.filePath,
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
    return this.chunklist[this.nowChunkIndex++];
  }
}
