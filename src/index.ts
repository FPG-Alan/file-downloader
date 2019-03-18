import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk, TResumeData, TResumeFile } from './interface';
import SavvyZipFile from './zip_file';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
const DEV: boolean = false;
class SavvyTransfer {
  private SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  private CHUNK_SIZE: number = 1024 * 1024 * 10;
  private HTTP_NUM: number = 5;

  public totalSize: number = 0;
  public IO: FilesystemIO | MemoryIO;
  public IO_IS_FS: boolean = false;
  public progressHandle: Function;
  public statusUpdateHandle: Function;
  public running: boolean = false;

  public files: Array<SavvyFile | SavvyZipFile> = [];
  public schedulingFiles: Array<SavvyFile | SavvyZipFile> = [];
  public processers: Processer[] = [];

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

    this.processers = new Array(this.HTTP_NUM).fill('').map((_: number) => new Processer());
  }

  /**
   * resumeData@type TResumeData
   */
  public retrieveFilesFromLocalStorage(): Array<SavvyFile | SavvyZipFile> {
    let rawResumeData: string | null = window.localStorage.getItem('savvy_transfers');
    if (rawResumeData) {
      let resumeData: TResumeData[];
      try {
        resumeData = JSON.parse(rawResumeData);

        this.files.push(
          ...resumeData.map((data: TResumeData) => {
            if (data.type === 'zip') {
              // files: SavvyFile[], name: string, IO_instance: FilesystemIO | MemoryIO, progressHandle: Function, chunkIndex: number = 0, id?: number, offset?: number, resumed?: boolean
              return new SavvyZipFile(
                data.files.map(
                  (_file: TResumeFile) =>
                    new SavvyFile(_file.path, _file.name, _file.size, this.CHUNK_SIZE, this.IO, this.progressHandle, (this.IO_IS_FS && _file.bufferAcc) || 0, (this.IO_IS_FS && _file.offset) || 0)
                ),
                data.name,
                this.IO,
                this.progressHandle,
                this.statusUpdateHandle,
                (this.IO_IS_FS && data.chunkIndex) || 0,
                data.id,
                (this.IO_IS_FS && data.offset) || 0,
                true
              );
            } else {
              return new SavvyFile(data.path!, data.name, data.size!, this.CHUNK_SIZE, this.IO, this.progressHandle);
            }
          })
        );
      } catch (e) {
        console.log(e);
      }
    }

    if (this.IO_IS_FS) {
      (this.IO as FilesystemIO).freeSpace(this.files);
    }
    return this.files;
  }
  /**
   * resumeData@type TResumeData
   * @param {SavvyZipFile | SavvyFile} fileForUpdate
   */
  public storeFileForResume(fileForUpdate: SavvyZipFile | SavvyFile): void {
    // temporarily support {SavvyZipFile} only.
    fileForUpdate = fileForUpdate as SavvyZipFile;

    if (fileForUpdate.status === 'complete') {
      this.deleteFileFromStore(fileForUpdate);

      return;
    }

    let resumeDataForFile: TResumeData = {
      id: fileForUpdate.id,
      name: fileForUpdate.name,
      type: 'zip',
      chunkIndex: fileForUpdate.nowChunkIndex,
      tag: fileForUpdate.nowChunkIndex === fileForUpdate.chunklist.length ? 1 : 0,
      offset: fileForUpdate.offset,
      dirData: fileForUpdate.dirData,
      files: fileForUpdate.files.map((_file: SavvyFile) => ({
        name: _file.name,
        path: _file.filePath,
        size: _file.fileSize,

        bufferAcc: _file.bufferAcc,
        offset: _file.offset
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
   * @param {SavvyZipFile | SavvyFile} fileNeedDelete
   */
  public deleteFileFromStore(fileNeedDelete: SavvyZipFile | SavvyFile): void {
    let rawResumeData: string | null = window.localStorage.getItem('savvy_transfers');
    if (rawResumeData) {
      let tmpResumeData: TResumeData[];
      try {
        tmpResumeData = JSON.parse(rawResumeData);
        let index: number = tmpResumeData.findIndex((data: TResumeData) => data.id === fileNeedDelete.id);
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
  public async addFiles(files: { path: string; name: string }[], asZip: boolean = false): Promise<SavvyZipFile | Array<SavvyFile>> {
    let tmpFiles: SavvyFile[] = [];
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      try {
        let tmpFile: SavvyFile | undefined | string = await this._addFile(files[i].path, files[i].name, asZip);
        if (tmpFile && typeof tmpFile !== 'string') {
          tmpFiles.push(tmpFile);
        }
      } catch (e) {
        throw e;
      }
    }

    let tmpZipFile: SavvyZipFile;
    if (asZip) {
      // create a zip file
      tmpZipFile = new SavvyZipFile(tmpFiles, `Archive-${generateId(4)}.zip`, this.IO, this.progressHandle, this.statusUpdateHandle);
      this.files.push(tmpZipFile);

      // store in locastorage for resume
      this.storeFileForResume(tmpZipFile);

      return tmpZipFile;
    } else {
      return tmpFiles;
    }
  }
  public async addFile(path: string, name: string): Promise<Array<SavvyFile | SavvyZipFile>> {
    await this._addFile(path, name);
    return this.files;
  }
  private async _addFile(path: string, name: string, asZip: boolean = false): Promise<SavvyFile | undefined> {
    if (!path) {
      console.log('file path invalid.');
      throw new Error('Invalid file path');
      // return;
    }

    // get file size
    let response: Response = await fetch(path, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    if (!response.headers.get('content-range')) {
      console.log('can not get file size, check file path or contact service provider.');
      // let message = 'can not get file size, check file path or contact service provider.';
      throw new Error('Can not get file size, check file path or contact service provider.');
      // return;
    }
    // calculate whether the size limit is exceeded
    let fileSize: number = parseInt(response.headers.get('content-range')!.split('/')[1]);
    if (fileSize > this.SIZE_LIMIT || fileSize + this.totalSize > this.SIZE_LIMIT) {
      console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');
      // let message = 'The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.';
      throw new Error('exceed');
      // return;
    }
    // create new file
    let tmpFile: SavvyFile = new SavvyFile(path, name, fileSize, this.CHUNK_SIZE, this.IO, this.progressHandle);
    // ensure each file get it's writer from IO
    // `asZip` flag indicate this SavvyFile where belong another SavvyFile which will actually being download as a zip file
    //  in other word, this savvyfile does not need a writer(init);
    if (!asZip) {
      this.files.push(tmpFile);
    }

    this.totalSize += tmpFile.fileSize;
    await new Promise((resolve, reject) => {
      setTimeout(resolve, 1);
    });
    return tmpFile;
  }
  /**
   * @param {Array<SavvyFile | SavvyZipFile>[]} files
   * pause files' processers which id within ids
   */
  public pause(files: Array<SavvyFile | SavvyZipFile>): boolean {
    if (this.running) {
      files.map((file: SavvyFile | SavvyZipFile) => {
        // some file in ids may had being resumed.
        // we just need care about those files which have freezed processors.
        if (file.processer && !file.processer.freeze) {
          // tmpFile.processer.freeze = true;
          file.paused = true;
        } else if (!file.processer) {
          file.paused = true;

          // 有两种情况: 1. 当前file在待处理队列中, 但还没有分配处理单元  2. 不在队列中

          file.status = 'paused';
        }
      });
      return true;
    }
    return false;
  }
  /**
   * @param {Array<SavvyFile | SavvyZipFile>[]} files
   * resume files' processers which id within ids.
   */
  public resume(files: Array<SavvyFile | SavvyZipFile>) {
    files.map((file: SavvyFile | SavvyZipFile) => {
      file.paused = false;
      this.schedule([file.id]);
    });
  }

  /**
   * @param {SavvyFile | SavvyZipFile} file
   * @returns SavvyFile | SavvyZipFile | undefined
   * remove file
   * 1. pause its processor if there has one.
   * 2. release the processor resource.
   * 3. delete its record in LocalStorage.
   */
  public removeFile(file: SavvyFile | SavvyZipFile): SavvyFile | SavvyZipFile | undefined {
    if (file && file.status !== 'abort') {
      file.paused = true;
      file.status = 'abort';
      this.totalSize -= file.fileSize;
      this.IO.deleteFile(file);

      this.deleteFileFromStore(file);
    }
    return file;
  }
  /**
   * @param {number[]?} ids
   * get files which id within ids, deduplication and then push into <schedulingFiles>
   */
  public schedule = (ids?: Array<number>): void => {
    // fill into schedulingFiles
    let tmpIds: Array<number> = ids || this.files.map((file: SavvyFile | SavvyZipFile) => file.id);
    let nonRepeatIds: Array<number> = Array.from(new Set(tmpIds));

    for (let i = 0, l = nonRepeatIds.length; i < l; i++) {
      let tmpSavvyFile: SavvyFile | SavvyZipFile | undefined = this.files.find((_file: SavvyFile | SavvyZipFile) => _file.id === nonRepeatIds[i]);

      if (tmpSavvyFile && this.schedulingFiles.filter((file: SavvyFile | SavvyZipFile) => file.id === nonRepeatIds[i]).length <= 0) {
        tmpSavvyFile.status = 'queue';
        this.schedulingFiles.push(tmpSavvyFile);
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
          let currentFile: SavvyFile | SavvyZipFile | undefined = this.schedulingFiles.find(
            (file: SavvyFile | SavvyZipFile) => (file && file!.status !== 'abort' && file!.status !== 'complete' && !file.lock && !file.paused) || false
          );

          if (currentFile) {
            this.processers[i].run(currentFile, this);
          }
        }
      }
    } else {
      this.running = false;
      console.log('all files are in complete state, transfer stop.');
    }
  }
}

class Processer {
  public idle: boolean = true;
  public file: SavvyFile | SavvyZipFile | null = null;
  /**
   * use @function getStatus() to get file's current status instead of accessing it directly
   * so this is done to avoid errors during ts static checking
   * @ref https://github.com/Microsoft/TypeScript/issues/29155
   */
  public run(file: SavvyFile | SavvyZipFile, scheduler: SavvyTransfer) {
    file.processer = this;
    this.file = file;
    this.idle = false;

    if (!file.lock) {
      file.lock = true;
    }

    if (!file.paused) {
      file.status = 'downloading';
      this.process(file, scheduler);
    } else {
      file.lock = false;
      file.processer = null;
      this.idle = true;
      if (file.status !== 'abort') {
        file.status = 'paused';
      }
    }
  }
  public process = async (file: SavvyFile | SavvyZipFile, scheduler: SavvyTransfer): Promise<undefined> => {
    if (!file.paused) {
      if (file.getStatus() === 'abort') {
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_file: SavvyFile | SavvyZipFile) => _file.id === file.id), 1);

        this.idle = true;
        this.file = null;
        file.lock = false;
        file.processer = null;

        scheduler.distributeToProcessers();
        return;
      }
      // no more chunk need be download, should
      if (file.nowChunkIndex >= file.chunklist.length) {
        scheduler.IO.download([file]);

        file.status = 'complete';

        scheduler.storeFileForResume(file);
        scheduler.IO.deleteFile(file);
        scheduler.totalSize -= file.fileSize;
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_file: SavvyFile | SavvyZipFile) => _file.id === file.id), 1);

        this.idle = true;
        this.file = null;
        file.lock = false;
        file.processer = null;

        scheduler.distributeToProcessers();
        return;
      }

      // need init to get a filewriter
      if (!file.fileWriter) {
        await file.init();
        this.run(file, scheduler);
        return;
      }

      // file.status should be inited
      let nextChunk: TChunk = file.nextChunk();
      let response: Response = await fetch(nextChunk.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

      if (file.paused) {
        // throw this chunk
        file.resumePreChunk();

        file.lock = false;
        file.processer = null;
        this.idle = true;
        if (file.status !== 'abort') {
          file.status = 'paused';
        }
        return;
      }
      let buffer: ArrayBuffer = await response.arrayBuffer();

      if (file.paused) {
        // throw this chunk
        file.resumePreChunk();
        file.paused = true;
        file.lock = false;
        file.processer = null;
        this.idle = true;
        if (file.status !== 'abort') {
          file.status = 'paused';
        }
        return;
      }

      await scheduler.IO.write(file, buffer);
      if (file.getStatus() === 'abort') {
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_file: SavvyFile | SavvyZipFile) => _file.id === file.id), 1);

        this.idle = true;
        this.file = null;
        file.lock = false;
        file.processer = null;

        scheduler.distributeToProcessers();
        return;
      }
      file.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

      // console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);
      scheduler.storeFileForResume(file);

      this.run(file, scheduler);
      return;
    } else {
      if (file.status !== 'abort') {
        file.status = 'paused';
      }
      file.processer = null;
      file.lock = false;
      this.idle = true;
    }
  };
}

function dec2hex(dec: number) {
  return ('0' + dec.toString(16)).substr(-2);
}

function generateId(len: number) {
  var arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
}

export default SavvyTransfer;
