import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk, TResumeData, TResumeFile } from './interface';
import SavvyZipFile from './zip_file';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
const DEV: boolean = false;
class SavvyTransfer {
  static SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  static CHUNK_SIZE: number = 1024 * 1024 * 10;
  static HTTP_NUM: number = 5;
  public IO: FilesystemIO | MemoryIO;
  public IO_IS_FS: boolean = false;
  public progressHandle: Function;
  public running: boolean = false;
  public freeze: boolean = false;

  public files: Array<SavvyFile | SavvyZipFile> = [];

  public schedulingFiles: Array<SavvyFile | SavvyZipFile> = [];

  public processers: Processer[] = [];

  constructor(onProgress: Function) {
    if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IO = new FilesystemIO();
      this.IO_IS_FS = true;
    } else {
      this.IO = new MemoryIO();
    }
    this.progressHandle = onProgress;

    if (DEV && this.IO_IS_FS) {
      (this.IO as FilesystemIO).removeAll();
    }

    this.processers = new Array(SavvyTransfer.HTTP_NUM).fill('').map((_: number) => new Processer());
  }

  /**
   * resumeData: []{
   *  id: number,
   *  name: string,
   *  type: string = 'zip',
   *  files: []{
   *    name: string,
   *    path: string,
   *    size: number
   *  },
   *  chunkIndex: number,
   *  tag: number //0: downloading, 1: complete
   * }
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
                    new SavvyFile(
                      _file.path,
                      _file.name,
                      _file.size,
                      SavvyTransfer.CHUNK_SIZE,
                      this.IO,
                      this.progressHandle,
                      (this.IO_IS_FS && _file.bufferAcc) || 0,
                      (this.IO_IS_FS && _file.offset) || 0
                    )
                ),
                data.name,
                this.IO,
                this.progressHandle,

                (this.IO_IS_FS && data.chunkIndex) || 0,
                data.id,
                (this.IO_IS_FS && data.offset) || 0,
                true
              );
            } else {
              return new SavvyFile(data.path!, data.name, data.size!, SavvyTransfer.CHUNK_SIZE, this.IO, this.progressHandle);
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
   * @param {SavvyZipFile} fileForUpdate
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
      let tmpFile: SavvyFile | undefined = await this._addFile(files[i].path, files[i].name, asZip);

      if (tmpFile) {
        tmpFiles.push(tmpFile);
      }
    }

    let tmpZipFile: SavvyZipFile;
    if (asZip) {
      // create a zip file
      tmpZipFile = new SavvyZipFile(tmpFiles, `Archive-${generateId(4)}.zip`, this.IO, this.progressHandle);
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
  /**
   * pause all process
   */
  public pause(): boolean {
    if (this.running) {
      this.freeze = true;

      return true;
    }
    return false;
  }
  public resume() {
    this.freeze = false;

    // this.schedule();

    this.distributeToProcessers();
  }
  public removeFile(id: number): SavvyFile | SavvyZipFile | undefined {
    this.pause();

    let tmpFile: SavvyFile | SavvyZipFile | undefined = this.files.find((file: SavvyFile | SavvyZipFile) => file.id === id);

    if (tmpFile) {
      tmpFile.status = 'abort';
      this.deleteFileFromStore(tmpFile);
    }

    this.resume();

    return tmpFile;
  }
  private async _addFile(path: string, name: string, asZip: boolean = false): Promise<SavvyFile | undefined> {
    if (!path) {
      console.log('file path invalid.');
      return;
    }

    // get file size
    let response: Response = await fetch(path, { method: 'GET', headers: { Range: 'bytes=0-1' } });
    if (!response.headers.get('content-range')) {
      console.log('can not get file size, check file path or contact service provider.');

      return;
    }
    // calculate whether the size limit is exceeded
    let fileSize: number = parseInt(response.headers.get('content-range')!.split('/')[1]);
    /*if (fileSize > SavvyTransfer.SIZE_LIMIT || fileSize + this.size > SavvyTransfer.SIZE_LIMIT) {
      console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');

      return;
    } */
    // create new file
    let tmpFile: SavvyFile = new SavvyFile(path, name, fileSize, SavvyTransfer.CHUNK_SIZE, this.IO, this.progressHandle);
    // ensure each file get it's writer from IO
    // `asZip` flag indicate this SavvyFile where belong another SavvyFile which will actually being download as a zip file
    //  in other word, this savvyfile does not need a writer(init);
    if (!asZip) {
      this.files.push(tmpFile);
    }

    await new Promise((resolve, reject) => {
      setTimeout(resolve, 1);
    });
    return tmpFile;
  }

  public schedule = (ids?: Array<number>): void => {
    // fill into schedulingFiles
    let tmpIds: Array<number> = ids || this.files.map((file: SavvyFile | SavvyZipFile) => file.id);
    let nonRepeatIds: Array<number> = Array.from(new Set(tmpIds));

    for (let i = 0, l = nonRepeatIds.length; i < l; i++) {
      let tmpSavvyFile: SavvyFile | SavvyZipFile | undefined = this.files.find((_file: SavvyFile | SavvyZipFile) => _file.id === nonRepeatIds[i]);

      if (tmpSavvyFile && this.schedulingFiles.filter((file: SavvyFile | SavvyZipFile) => file.id === nonRepeatIds[i]).length <= 0) {
        this.schedulingFiles.push(tmpSavvyFile);
      }
    }

    this.distributeToProcessers();
  };

  public distributeToProcessers() {
    if (this.schedulingFiles.length > 0) {
      this.running = true;
      for (let i: number = 0, l = this.processers.length; i < l; i++) {
        if (this.processers[i].idle) {
          let currentFile: SavvyFile | SavvyZipFile | undefined = this.schedulingFiles.find(
            (file: SavvyFile | SavvyZipFile) => (file && file!.status !== 'abort' && file!.status !== 'complete' && !file.lock) || false
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
  /**
   * use @function getStatus() to get file's current status instead of accessing it directly
   * so this is done to avoid errors during ts static checking
   * @ref https://github.com/Microsoft/TypeScript/issues/29155
   */
  public run(file: SavvyFile | SavvyZipFile, scheduler: SavvyTransfer) {
    if (!scheduler.freeze) {
      this.process(file, scheduler);
    } else {
      this.idle = true;
      file.lock = false;
    }
  }
  public process = async (file: SavvyFile | SavvyZipFile, scheduler: SavvyTransfer): Promise<undefined> => {
    if (!scheduler.freeze) {
      this.idle = false;
      file.lock = true;
      if (file.getStatus() === 'abort') {
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_file: SavvyFile | SavvyZipFile) => _file.id === file.id), 1);

        this.idle = true;
        file.lock = false;
        scheduler.distributeToProcessers();
        return;
      }
      // no more chunk need be download, should
      if (file.getStatus() === 'chunk_empty') {
        scheduler.IO.download([file]);

        file.status = 'complete';

        scheduler.storeFileForResume(file);
        scheduler.IO.deleteFile(file);

        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_file: SavvyFile | SavvyZipFile) => _file.id === file.id), 1);

        this.idle = true;
        file.lock = false;
        scheduler.distributeToProcessers();
        return;
      }

      // need init to get a filewriter
      if (file.getStatus() === 'initializing') {
        console.log('need init');
        await file.init();

        this.run(file, scheduler);
        return;
      }

      // file.status should be inited
      let nextChunk: TChunk = file.nextChunk();
      let response: Response = await fetch(nextChunk.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

      console.log(file.name + ' get chunk' + (file.nowChunkIndex - 1));
      if (scheduler.freeze) {
        // throw this chunk
        file.resumePreChunk();
        this.idle = true;
        file.lock = false;
        return;
      }
      let buffer: ArrayBuffer = await response.arrayBuffer();

      if (scheduler.freeze) {
        // throw this chunk
        file.resumePreChunk();
        this.idle = true;
        file.lock = false;
        return;
      }
      if (file.getStatus() !== 'abort') {
        await scheduler.IO.write(file, buffer);
        file.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

        console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);
        scheduler.storeFileForResume(file);

        this.run(file, scheduler);
        // this.run(file, scheduler);
      }
      return;
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
