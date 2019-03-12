import { TChunk, TStatus } from './interface';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import { filetype } from './utils';

export default class SavvyFile {
  public id: number;
  public isZip: boolean = false;
  public chunklist: TChunk[] = [];
  public status: TStatus;
  public filePath: string;
  public name: string;
  public fileSize: number;
  public chunkSize: number;

  public fileWriter: any;
  public fileEntry: any;

  public remainSize: number;
  // measure unit is byte per second
  public speed: number = 0;

  public nowChunkIndex: number = 0;
  private IO: FilesystemIO | MemoryIO;

  private startTime: number = 0;

  public offset: number = 0;
  public crc: number = 0;

  public headerPos: number = 0;
  public bufferAcc: number = 0;

  public fileType: string = 'File';

  private progressHandle: Function;

  public lock: boolean = false;

  constructor(path: string, name: string, fileSize: number, chunkSize: number, IO_instance: FilesystemIO | MemoryIO, progressHandle: Function, buffacc?: number, offset?: number) {
    this.status = 'initializing';
    this.filePath = path;
    this.name = name;
    this.fileSize = fileSize;
    this.chunkSize = chunkSize;
    this.IO = IO_instance;

    this.remainSize = fileSize;

    this.bufferAcc = buffacc || 0;
    this.offset = offset || 0;

    this.progressHandle = progressHandle;
    this.fileType = filetype(this.name);

    this.id = new Date().getTime();

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

          console.log(result.fileWriter.position);

          if (this.status !== 'abort') {
            this.status = 'inited';
          }

          resolve();
        },
        reject
      );
    });
  };

  public getStatus = (): TStatus => {
    return this.status;
  };

  public update = (length: number) => {
    if (this.status === 'inited') {
      this.status = 'downloading';
    }
    let duration: number = new Date().getTime() - this.startTime;

    this.speed = (length / duration) * 1000;
    this.remainSize -= length;

    this.progressHandle && this.progressHandle(this.id, this.speed, this.remainSize, this.status);
  };

  public nextChunk(): TChunk {
    // make sure next chunk is available when status not chunk_empty
    this.startTime = new Date().getTime();
    if (!this.chunklist[this.nowChunkIndex + 1]) {
      this.status = 'chunk_empty';
    }
    return this.chunklist[this.nowChunkIndex++];
  }

  public resumePreChunk(): void {
    if (this.status === 'chunk_empty') {
      this.status = 'inited';
    }

    this.nowChunkIndex -= 1;
  }
}
