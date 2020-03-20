import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TResumeData, TResumeFile } from './interface';
// import SavvyZipFile from './zip_file';
import Transfer from './transfer';
import TransferProcesser from './processer';
import { generateId } from './utils';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
const DEV: boolean = false;
export default class SavvyTransfer {
  private SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  private CHUNK_SIZE: number = 1024 * 1024 * 1;
  private HTTP_NUM: number = 5;

  public totalSize: number = 0;
  public IO: FilesystemIO | MemoryIO;
  public IO_IS_FS: boolean = false;
  public progressHandle: Function;
  public statusUpdateHandle: Function;
  public running: boolean = false;

  // public files: Array<SavvyFile | SavvyZipFile> = [];
  public transfers: Transfer[] = [];
  public schedulingFiles: Transfer[] = [];
  public processers: TransferProcesser[] = [];

  constructor(onProgress: Function, onStatusUpdate: Function) {
    if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IO = new FilesystemIO();
      this.IO_IS_FS = true;
      // fs has a largeeeee size limit, up to 200GB
      this.SIZE_LIMIT = 1024 * 1024 * 1024 * 200;
      // this.SIZE_LIMIT = 1024 * 1024 * 250;
    } else {
      this.IO = new MemoryIO();
    }
    this.progressHandle = onProgress;
    this.statusUpdateHandle = onStatusUpdate;
    if (DEV && this.IO_IS_FS) {
      (this.IO as FilesystemIO).removeAll();
    }

    this.processers = new Array(this.HTTP_NUM).fill('').map((_: number) => new TransferProcesser());
  }

  /**
   * resumeData@type TResumeData
   */
  public retrieveFilesFromLocalStorage(): Array<Transfer> {
    let rawResumeData: string | null = window.localStorage.getItem('savvy_transfers');
    if (rawResumeData) {
      let resumeData: TResumeData[];
      try {
        resumeData = JSON.parse(rawResumeData);

        this.transfers.push(
          ...resumeData.map((data: TResumeData) => {
            return new Transfer(
              data.files.map((_file: TResumeFile) => new SavvyFile(_file.path, _file.name, _file.size, this.CHUNK_SIZE, _file.bufferAcc, _file.offset, _file.crc)),
              data.name,
              this.IO,
              this.progressHandle,
              this.statusUpdateHandle,
              true,
              data.chunkIndex,
              data.id,
              data.offset,
              true
            );
          })
        );
      } catch (e) {
        console.log(e);
      }
    }

    if (this.IO_IS_FS) {
      (this.IO as FilesystemIO).freeSpace(this.transfers);
    }
    return this.transfers;
  }
  /**
   * resumeData@type TResumeData
   * @param {Transfer} transferForUpdate
   */
  public storeFileForResume(transferForUpdate: Transfer): void {
    if (transferForUpdate.status === 'complete') {
      this.deleteFileFromStore(transferForUpdate);

      return;
    }

    let resumeDataForFile: TResumeData = {
      id: transferForUpdate.id,
      name: transferForUpdate.name,
      type: transferForUpdate.zip ? 'zip' : 'normal',
      chunkIndex: transferForUpdate.chunkIndex,
      tag: transferForUpdate.chunkIndex === transferForUpdate.chunkList.length ? 1 : 0,
      offset: transferForUpdate.offset,
      files: transferForUpdate.files.map((_file: SavvyFile) => ({
        name: _file.name,
        path: _file.filePath,
        size: _file.fileSize,

        bufferAcc: _file.bufferAcc,
        offset: _file.offset,
        crc: _file.crc
      }))
    };
    let rawResumeData: string | null = window.localStorage.getItem('savvy_transfers');
    let newResumeData: TResumeData[] = [];
    if (rawResumeData) {
      let tmpResumeData: TResumeData[];
      try {
        tmpResumeData = JSON.parse(rawResumeData);
        let index: number = tmpResumeData.findIndex((data: TResumeData) => data.id === resumeDataForFile.id);
        if (index !== -1) {
          tmpResumeData.splice(index, 1, resumeDataForFile);
          newResumeData.push(...tmpResumeData);
        } else {
          newResumeData.push(...tmpResumeData, resumeDataForFile);
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      newResumeData.push(resumeDataForFile);
    }

    window.localStorage.setItem('savvy_transfers', JSON.stringify(newResumeData));
  }
  /**
   * resumeData@type TResumeData
   * @param {Transfer} transferNeedDelete
   */
  public deleteFileFromStore(transferNeedDelete: Transfer): void {
    let rawResumeData: string | null = window.localStorage.getItem('savvy_transfers');
    if (rawResumeData) {
      let tmpResumeData: TResumeData[];
      try {
        tmpResumeData = JSON.parse(rawResumeData);
        let index: number = tmpResumeData.findIndex((data: TResumeData) => data.id === transferNeedDelete.id);
        if (index !== -1) {
          tmpResumeData.splice(index, 1);
        }

        window.localStorage.setItem('savvy_transfers', JSON.stringify(tmpResumeData));
      } catch (e) {
        console.log(e);
      }
    }
  }
  // temporary just on type - zip
  public async addFiles(files: { path: string; name: string }[], asZip: boolean = false, zipName: string): Promise<Transfer | Array<Transfer>> {
    let tmpFiles: SavvyFile[] = [];
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      try {
        let tmpFile: SavvyFile | undefined | string = await this.addFile(files[i].path, files[i].name);
        if (tmpFile && typeof tmpFile !== 'string') {
          tmpFiles.push(tmpFile);
        }
      } catch (e) {
        throw e;
      }
    }

    let tmpTransfer: Transfer;
    if (asZip) {
      // create a zip file
      tmpTransfer = new Transfer(tmpFiles, zipName, this.IO, this.progressHandle, this.statusUpdateHandle, true);
      this.transfers.push(tmpTransfer);

      // store in locastorage for resume
      this.storeFileForResume(tmpTransfer);

      return tmpTransfer;
    } else {
      return tmpFiles.map((file: SavvyFile) => new Transfer([file], file.name, this.IO, this.progressHandle, this.statusUpdateHandle, false));
    }
  }
  private async addFile(path: string, name: string): Promise<SavvyFile | undefined> {
    if (!path) {
      console.log('file path invalid.');
      throw new Error('Invalid file path');
      // return;
    }

    // get file size
    let response: Response = await fetch(path, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    console.log(response.headers.forEach((value, key) => console.log(`${key}: ${value}`)));
    if (!response.headers.get('content-range')) {
      console.log('can not get file size, check file path or contact service provider.');
      // let message = 'can not get file size, check file path or contact service provider.';
      throw new Error('Can not get file size, check file path or contact service provider.');
      // return;
    }
    // calculate whether the size limit is exceeded
    let fileSize: number = parseInt(response.headers.get('content-range')!.split('/')[1]);
    console.log(fileSize);
    if (fileSize > this.SIZE_LIMIT || fileSize + this.totalSize > this.SIZE_LIMIT) {
      console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');
      // let message = 'The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.';
      throw new Error('exceed');
      // return;
    }
    // create new file
    let tmpFile: SavvyFile = new SavvyFile(path, name, fileSize, this.CHUNK_SIZE);
    // ensure each file get it's writer from IO
    // `asZip` flag indicate this SavvyFile where belong another SavvyFile which will actually being download as a zip file
    //  in other word, this savvyfile does not need a writer(init);
    /* if (!asZip) {
      this.files.push(tmpFile);
    } */

    this.totalSize += tmpFile.fileSize;
    await new Promise((resolve, reject) => {
      setTimeout(resolve, 1);
    });
    return tmpFile;
  }
  /**
   * @param {Array<Transfer>[]} transfers
   * pause files' processers which id within ids
   */
  public pause(transfers: Array<Transfer>): boolean {
    if (this.running) {
      transfers.map((transfer: Transfer) => {
        // some file in ids may had being resumed.
        // we just need care about those files which have freezed processors.
        if (transfer.processer) {
          // tmpFile.processer.freeze = true;
          transfer.paused = true;
        } else {
          /**
           * two possible conditions:
           * 1. current transfer is not in queue.
           * 2. in queue, waiting for distribute.
           * */

          transfer.paused = true;
          transfer.status = 'paused';
        }
      });
      return true;
    }
    return false;
  }
  /**
   * @param {Array<Transfer>[]} transfers
   * resume files' processers which id within ids.
   */
  public resume(transfers: Array<Transfer>) {
    transfers.map((transfer: Transfer) => {
      transfer.paused = false;
      this.schedule([transfer.id]);
    });
  }

  /**
   * @param {Transfer} transfer
   * @returns SavvyFile | SavvyZipFile | undefined
   * remove file
   * 1. pause its processor if there has one.
   * 2. release the processor resource.
   * 3. delete its record in LocalStorage.
   */
  public removeFile(transfer: Transfer): Transfer | undefined {
    if (transfer && transfer.status !== 'abort') {
      transfer.paused = true;
      transfer.status = 'abort';
      this.totalSize -= transfer.fileSize;
      this.IO.deleteFile(transfer);

      this.deleteFileFromStore(transfer);
    }
    return transfer;
  }
  /**
   * @param {number[]?} ids
   * get files which id within ids, deduplication and then push into <schedulingFiles>
   */
  public schedule = (ids?: Array<number>): void => {
    // fill into schedulingFiles
    let tmpIds: Array<number> = ids || this.transfers.map((transfer: Transfer) => transfer.id);
    let nonRepeatIds: Array<number> = Array.from(new Set(tmpIds));

    for (let i = 0, l = nonRepeatIds.length; i < l; i++) {
      let tmpTransfer: Transfer | undefined = this.transfers.find((transfer: Transfer) => transfer.id === nonRepeatIds[i]);

      if (tmpTransfer && this.schedulingFiles.filter((transfer: Transfer) => transfer.id === nonRepeatIds[i]).length <= 0) {
        tmpTransfer.status = 'queue';
        this.schedulingFiles.push(tmpTransfer);
      }
    }

    this.distributeToProcessers();
  };

  /**
   * query the current idle state of all processors
   * distribute a file which is **not complete** and **not abort** and **not locked**
   * to a processor in idle state.
   */
  public distributeToProcessers() {
    if (this.schedulingFiles.length > 0) {
      this.running = true;
      for (let i: number = 0, l = this.processers.length; i < l; i++) {
        if (this.processers[i].idle) {
          let currentTransfer: Transfer | undefined = this.schedulingFiles.find(
            (transfer: Transfer) => (transfer && transfer!.status !== 'abort' && transfer!.status !== 'complete' && !transfer.lock && !transfer.paused) || false
          );

          if (currentTransfer) {
            this.processers[i].run(currentTransfer, this);
          }
        }
      }
    } else {
      this.running = false;
      console.log('all files are in complete state, transfer stop.');
    }
  }
}
