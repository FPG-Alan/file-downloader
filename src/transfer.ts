import SavvyFile from './file';
import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import { TStatus, TChunk } from './interface';
import TransferProcesser from './processer';
import { filetype } from './utils';

export default class Transfer {
  public files: SavvyFile[];
  public name: string;
  public fileType: string = 'File';
  public IO: FilesystemIO | MemoryIO;
  public _status: TStatus = 'initializing';
  public zip: boolean;

  public id: number;
  public offset: number;
  public chunkIndex: number;
  public chunkList: TChunk[];
  public totalSize: number;
  public fileSize: number; //include
  public remainSize: number;

  public fileWriter: any;
  public fileEntry: any;
  public progressHandle: Function;
  public statusUpdateHandle: Function;

  public processer: TransferProcesser | null = null;
  public lock: boolean = false;
  public paused: boolean = false;

  public speed: number = 0;
  public startTime: number = 0;

  constructor(
    files: SavvyFile[],
    name: string,
    IO: FilesystemIO | MemoryIO,
    progressHandle: Function,
    statusUpdateHandle: Function,
    zip: boolean,
    chunkIndex?: number,
    id?: number,
    offset?: number,
    resumed?: boolean
  ) {
    this.files = files;
    this.name = name;
    this.fileType = filetype(this.name);
    this.IO = IO;
    this.id = id || new Date().getTime();
    this.zip = zip;

    // set file size
    // -----------------------------------------------------------------\
    this.totalSize = files.reduce((prev: number, cur: SavvyFile) => prev + cur.fileSize, 0);
    this.fileSize = 0;
    if (zip) {
      for (let i: number = 0, l: number = files.length; i < l; i++) {
        this.fileSize += files[i].fileSize + 30 + 9 + 2 * files[i].name.length /* header */ + 46 + files[i].name.length /* dirRecord */;
      }
      // extra bytes for each ZipCentralDirectory
      this.fileSize += files.length * 28;
      // extra bytes for each dataDescriptor
      this.fileSize += files.length * 24;
      // final bytes
      this.fileSize += 98;
    } else {
      this.fileSize = this.totalSize;
    }

    // -----------------------------------------------------------------
    this.chunkList = files.reduce((pre: TChunk[], file: SavvyFile) => pre.concat(file.chunkList), []);
    this.offset = offset || 0;
    this.chunkIndex = chunkIndex || 0;
    if (this.chunkIndex === this.chunkList.length) {
      this.remainSize = 0;
    } else if (this.chunkIndex !== 0) {
      this.remainSize =
        this.totalSize -
        this.chunkList.reduce((acc: number, cur: TChunk, index: number) => {
          if (index < this.chunkIndex) {
            acc += cur.end - (cur.start === 0 ? 0 : cur.start - 1);
          } else {
            acc += 0;
          }

          return acc;
        }, 0);
    } else {
      this.remainSize = this.totalSize;
    }

    this.progressHandle = progressHandle;
    this.statusUpdateHandle = statusUpdateHandle;
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
    this.chunkIndex = 0;
    this.remainSize = this.totalSize;
    this.offset = 0;
    this.files.forEach((file: SavvyFile) => {
      file.offset = file.bufferAcc = 0;
    });
  }

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
    if (!this.chunkList[this.chunkIndex + 1]) {
      this.status = 'chunk_empty';
    }

    // console.log('request chunk: ' + this.chunklist[this.nowChunkIndex].start + '-' + this.chunklist[this.nowChunkIndex].end + ' at ' + this.startTime);
    return this.chunkList[this.chunkIndex++];
  }
  public resumePreChunk(): void {
    if (this.status === 'chunk_empty') {
      this.status = 'downloading';
    }

    this.chunkIndex -= 1;
  }

  public get status(): TStatus {
    return this._status;
  }
  public set status(new_status: TStatus) {
    this._status = new_status;
    this.statusUpdateHandle && this.statusUpdateHandle(this.id, new_status);
  }
  /**
   * use @function getStatus() to get file's current status instead of accessing it directly
   * so this is done to avoid errors during ts static checking
   * @ref https://github.com/Microsoft/TypeScript/issues/29155
   */
  public getStatus = (): TStatus => {
    return this._status;
  };

  public get currentFile(): SavvyFile {
    let tmpNowChunkIndex = this.chunkIndex - 1;
    let numChunks: number = 0;
    let tmpNowFile: SavvyFile = this.files[0];

    for (let i = 0, l = this.files.length; i < l; i++) {
      numChunks += this.files[i].chunkList.length;
      if (tmpNowChunkIndex < numChunks) {
        tmpNowFile = this.files[i];
        break;
      }
    }
    return tmpNowFile;
  }
}
