import { TChunk, TStatus } from './interface';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';

import { filetype } from './utils';
import SavvyTransfer from '.';

export default class SavvyZipFile {
  public id: number;
  public chunklist: TChunk[] = [];
  public status: TStatus;

  public isZip: boolean = true;

  public fileWriter: any;
  public fileEntry: any;

  public name: string;
  public fileSize: number = 0;
  public totalSize: number;

  public files: SavvyFile[];
  public nowChunkIndex: number = 0;
  private IO: FilesystemIO | MemoryIO;

  public offset: number = 0;
  public dirData: Uint8Array[] = [];

  public remainSize: number;
  // measure unit is byte per second
  public speed: number = 0;

  private startTime: number = 0;
  private progressHandle: Function;

  public fileType: string = 'File';

  public resumed: boolean = false;

  public lock: boolean = false;

  constructor(files: SavvyFile[], name: string, IO_instance: FilesystemIO | MemoryIO, progressHandle: Function, chunkIndex: number = 0, id?: number, offset?: number, resumed?: boolean) {
    this.status = 'initializing';
    this.IO = IO_instance;
    this.name = name;
    this.files = files;

    this.fileType = filetype(this.name);

    this.id = id || new Date().getTime();
    this.offset = offset || 0;

    this.totalSize = files.reduce((prev: number, cur: SavvyFile) => prev + cur.fileSize, 0);
    this.progressHandle = progressHandle;

    this.nowChunkIndex = chunkIndex;

    for (let i: number = 0, l: number = files.length; i < l; i++) {
      this.fileSize += files[i].fileSize + 30 + 9 + 2 * files[i].name.length /* header */ + 46 + files[i].name.length /* dirRecord */;
    }

    // extra bytes for each ZipCentralDirectory
    this.fileSize += files.length * 28;
    // extra bytes for each dataDescriptor
    this.fileSize += files.length * 24;
    // final bytes
    this.fileSize += 98;

    this.chunklist = files.reduce((pre: TChunk[], file: SavvyFile) => pre.concat(file.chunklist), []);

    this.resumed = resumed || false;

    if (chunkIndex === this.chunklist.length) {
      this.remainSize = 0;
    } else if (chunkIndex !== 0) {
      this.remainSize =
        this.totalSize -
        this.chunklist.reduce((acc: number, cur: TChunk, index: number) => {
          if (index < chunkIndex) {
            acc += cur.end - (cur.start === 0 ? 0 : cur.start - 1);
          } else {
            acc += 0;
          }

          return acc;
        }, 0);
    } else {
      this.remainSize = this.totalSize;
    }
  }
  public init = (): Promise<undefined> => {
    return new Promise((resolve: Function, reject: Function) => {
      this.IO.getFileWriter(
        this,
        (result: { fileEntry: FileEntry; fileWriter: FileWriter }) => {
          this.fileWriter = result.fileWriter;
          this.fileEntry = result.fileEntry;
          console.log('fileWriter position' + result.fileWriter.position);
          if (this.status !== 'abort') {
            this.status = 'inited';
          }
          resolve();
        },
        reject
      );
    });
  };

  public abortAllResumeData() {
    this.nowChunkIndex = 0;
    this.remainSize = this.totalSize;
    this.offset = 0;
    this.files.forEach((file: SavvyFile) => {
      file.offset = file.bufferAcc = 0;
    });
  }

  public get currentFile(): SavvyFile {
    let tmpNowChunkIndex = this.nowChunkIndex - 1;
    let numChunks: number = 0;
    let tmpNowFile: SavvyFile = this.files[0];

    for (let i = 0, l = this.files.length; i < l; i++) {
      numChunks += this.files[i].chunklist.length;
      if (tmpNowChunkIndex < numChunks) {
        tmpNowFile = this.files[i];
        break;
      }
    }
    return tmpNowFile;
  }
  public getStatus = (): TStatus => {
    return this.status;
  };
  public update = (length: number) => {
    if (this.status === 'inited') {
      this.status = 'downloading';
    }

    let tmpEndTime: number = new Date().getTime();
    let duration: number = tmpEndTime - this.startTime;

    // console.log('chunk ' + this.chunklist[this.nowChunkIndex - 1].start + '-' + this.chunklist[this.nowChunkIndex - 1].end + ' request complete at ' + tmpEndTime);
    this.speed = (length / duration) * 1000;
    this.remainSize -= length;

    this.progressHandle && this.progressHandle(this.id, this.speed, this.remainSize, this.status);
  };
  public nextChunk(): TChunk {
    this.startTime = new Date().getTime();
    // make sure next chunk is available when status not chunk_empty
    if (!this.chunklist[this.nowChunkIndex + 1]) {
      this.status = 'chunk_empty';
    }

    // console.log('request chunk: ' + this.chunklist[this.nowChunkIndex].start + '-' + this.chunklist[this.nowChunkIndex].end + ' at ' + this.startTime);
    return this.chunklist[this.nowChunkIndex++];
  }

  public resumePreChunk(): void {
    if (this.status === 'chunk_empty') {
      this.status = 'downloading';
    }

    this.nowChunkIndex -= 1;
  }
}
