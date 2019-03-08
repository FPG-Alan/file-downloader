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
  private IO: FilesystemIO | MemoryIO;
  private progressHandle: Function;
  private running: boolean = false;
  private freeze: boolean = false;

  public files: Array<SavvyFile | SavvyZipFile> = [];

  private schedulingFiles: Array<SavvyFile | SavvyZipFile | undefined> = [];

  constructor(onProgress: Function) {
    if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IO = new FilesystemIO();
    } else {
      this.IO = new MemoryIO();
    }
    this.progressHandle = onProgress;

    if (DEV) {
      if (this.IO instanceof FilesystemIO) {
        this.IO.removeAll();
      }
    }
    /* this.files = new Proxy(this.files, {
      set: (target: any, property: any, value: any, receiver: any): boolean => {
        target[property] = value;
        if (property === 'length' && value > 0 && !this.running) {
          this.schedule();
        }
        return true;
      }
    }); */
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
              return new SavvyZipFile(
                data.files.map((_file: TResumeFile) => new SavvyFile(_file.path, _file.name, _file.size, SavvyTransfer.CHUNK_SIZE, this.IO, this.progressHandle, _file.bufferAcc, _file.offset)),
                data.name,
                this.IO,
                this.progressHandle,

                data.chunkIndex,
                data.id,
                data.offset
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

    return this.files;
  }
  /**
   * resumeData@type TResumeData
   */
  private storeFileForResume(): void {
    let tmpResumeData: TResumeData[] = [];
    this.files.forEach((file: SavvyFile | SavvyZipFile) => {
      if (file.status !== 'abort' && file.status !== 'complete') {
        tmpResumeData.push({
          id: file.id,
          name: file.name,
          type: 'zip',
          chunkIndex: file.nowChunkIndex,
          tag: file.nowChunkIndex === file.chunklist.length ? 1 : 0,
          offset: file.offset,
          dirData: (file as SavvyZipFile).dirData,
          files: (file as SavvyZipFile).files.map((_file: SavvyFile) => ({
            name: _file.name,
            path: _file.filePath,
            size: _file.fileSize,

            bufferAcc: _file.bufferAcc,
            offset: _file.offset
          }))
        });
      }
    });

    window.localStorage.setItem('savvy_transfers', JSON.stringify(tmpResumeData));
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
      this.storeFileForResume();

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

    this.schedule();
  }
  public removeFile(id: number): SavvyFile | SavvyZipFile | undefined {
    this.pause();

    let tmpFile: SavvyFile | SavvyZipFile | undefined = this.files.find((file: SavvyFile | SavvyZipFile) => file.id === id);

    if (tmpFile) {
      tmpFile.status = 'abort';
    }

    this.storeFileForResume();
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
    if (!this.freeze) {
      if (!this.running) {
        this.running = true;

        if (this.schedulingFiles.length <= 0) {
          if (ids) {
            this.schedulingFiles = ids.map(id => this.files.find((file: SavvyFile | SavvyZipFile) => file.id === id));
          } else {
            this.schedulingFiles = this.files;
          }
        }
        let currentFile: SavvyFile | SavvyZipFile | undefined = this.schedulingFiles.find(
          (file: SavvyFile | SavvyZipFile | undefined) => (file && file!.status !== 'complete' && file!.status !== 'abort') || false
        );

        if (currentFile) {
          this.processCurrentFile(currentFile);
        } else {
          console.log('all files are in complete state, transfer stop.');
          this.schedulingFiles = [];
          this.running = false;
        }
      } else if (ids) {
        this.schedulingFiles.push(...ids.map(id => this.files.find((file: SavvyFile | SavvyZipFile) => file.id === id)));
      }
    }
  };
  /**
   * use @function getStatus() to get file's current status instead of accessing it directly
   * so this is done to avoid errors during ts static checking
   * @ref https://github.com/Microsoft/TypeScript/issues/29155
   */
  private processCurrentFile = async (file: SavvyFile | SavvyZipFile): Promise<undefined> => {
    if (!this.freeze) {
      if (file.getStatus() === 'abort') {
        this.running = false;
        this.schedule();
        return;
      }
      // need init to get a filewriter
      if (file.getStatus() === 'initializing') {
        console.log('need init');
        await file.init();
        this.running = false;
        this.schedule();
        return;
      }

      // no more chunk need be download, should
      if (file.getStatus() === 'chunk_empty') {
        this.IO.download([file]);

        file.status = 'complete';

        this.storeFileForResume();
        this.running = false;
        // start download next file
        this.schedule();
        // this place may also need a update.
        // file.update()
        return;
      }

      // file.status should be inited
      let nextChunk: TChunk = file.nextChunk();
      let response: Response = await fetch(nextChunk.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

      if (this.freeze) {
        // throw this chunk
        file.resumePreChunk();
        this.running = false;
        return;
      }
      let buffer: ArrayBuffer = await response.arrayBuffer();

      if (this.freeze) {
        // throw this chunk
        file.resumePreChunk();
        this.running = false;
        return;
      }
      if (file.getStatus() !== 'abort') {
        await this.IO.write(file, buffer);
        file.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

        console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);
        this.storeFileForResume();

        this.running = false;
        this.schedule();
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
