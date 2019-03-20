// Type definitions for Savvy-Transfer 0.0.1
// Project: Savvy-Transfer
// Definitions by: Alan.Yang <http://fpg-alan.github.io>

export = SavvyTransfer;

declare class SavvyTransfer {
  constructor(onProgress: Function, onStatusUpdate: Function);
  public totalSize: number;
  public IO: FilesystemIO | MemoryIO;
  public IO_IS_FS: boolean;
  public progressHandle: Function;
  public statusUpdateHandle: Function;
  public running: boolean;

  // public files: Array<SavvyFile | SavvyZipFile> = [];
  public transfers: Transfer[];
  public schedulingFiles: Transfer[];
  public processers: TransferProcesser[];

  retrieveFilesFromLocalStorage(): Array<Transfer>;
  storeFileForResume(transferForUpdate: Transfer): void;
  deleteFileFromStore(): Array<Transfer>;
  addFiles(files: { path: string; name: string }[], asZip: boolean): Promise<Transfer | Array<Transfer>>;
  removeFile(transfer: Transfer): Transfer | undefined;
  pause(transfers: Array<Transfer>): boolean;
  resume(transfers: Array<Transfer>): void;
  schedule(ids?: Array<number>): void;
  distributeToProcessers(): void;
}

declare class SavvyFile {
  public chunkList: TChunk[];

  public filePath: string;
  public name: string;
  public fileSize: number;

  public offset: number;
  public crc: number;
  public headerPos: number;
  public bufferAcc: number;
  constructor(path: string, name: string, fileSize: number, chunkSize: number, buffacc?: number, offset?: number);
}

declare class Transfer {
  public files: SavvyFile[];
  public name: string;
  public fileType: string;
  public IO: FilesystemIO | MemoryIO;
  public _status: TStatus;
  public zip: boolean;

  public id: number;
  public offset: number;
  public chunkIndex: number;
  public chunkList: TChunk[];
  public totalSize: number;
  public fileSize: number; //include
  public remainSize: number;

  public fileWriter: FileWriter | MemoryWrite | null;
  public fileEntry: any;
  public progressHandle: Function;
  public statusUpdateHandle: Function;

  public processer: TransferProcesser | null;
  public lock: boolean;
  public paused: boolean;

  public speed: number;
  public startTime: number;
  public status: TStatus;
  public readonly currentFile: SavvyFile;

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
  );

  init(): Promise<undefined>;
  abortAllResumeData(): void;
  update(length: number): void;
  nextChunk(): TChunk;
  resumePreChunk(): void;
}

declare class TransferProcesser {
  public idle: boolean;
  public transfer: Transfer | null;

  run(transfer: Transfer, scheduler: SavvyTransfer): void;
}

declare class FilesystemIO {
  removeFile(transfer: Transfer): Promise<undefined>;
  removeAll(): void;
  getFileWriter(transfer: Transfer, successCallback: Function, errorCallback: Function): void;
  write(transfer: Transfer, buffer: ArrayBuffer): Promise<any>;
  deleteFile(transfer: Transfer): void;
  download(transfers: Array<Transfer>): void;
}

declare class MemoryIO {
  getFileWriter(transfer: Transfer, successCallback: Function, errorCallback: Function): void;
  write(transfer: Transfer, buffer: ArrayBuffer): Promise<undefined>;
  deleteFile(transfer: Transfer): void;
  download(transfers: Array<Transfer>): void;
}
declare class MemoryWrite {
  private blobList: MSBlobBuilder | Blob[];
  public onwriteend: Function | null;
  public onerror: Function | null;

  public position: number;

  getBlob(name: string): Blob;
  write(buffer: Blob): void;
  clear(): void;
}

type TChunk = { filePath: string; start: number; end: number };
type TStatus = 'initializing' | 'inited' | 'queue' | 'paused' | 'downloading' | 'chunk_empty' | 'complete' | 'abort';

type TResumeData = {
  id: number;
  name: string;
  type: 'zip' | 'normal';
  chunkIndex: number;
  tag: 0 | 1; // 0: not complete, 1: complete

  path?: string; // in case of the type is not zip, temporary not that possible
  size?: number; // in case of the type is not zip, temporary not that possibleoffset
  offset: number;
  files: TResumeFile[];
};

type TResumeFile = {
  name: string;
  path: string;
  size: number;
  bufferAcc: number;
  offset: number;
};
