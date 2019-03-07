import FilesystemIO from './methods/filesystem';
import MemoryIO from './methods/memory';
import SavvyFile from './file';
import { TChunk } from './interface';
import SavvyZipFile from './zip_file';

const IS64BIT: boolean = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);
class SavvyTransfer {
  static SIZE_LIMIT: number = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
  static CHUNK_SIZE: number = 1024 * 1024 * 10;
  private IO: FilesystemIO | MemoryIO;
  private progressHandle: Function;
  private running: boolean = false;
  private freeze: boolean = false;

  public files: Array<SavvyFile | SavvyZipFile> = [];

  constructor(onProgress: Function) {
    if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
      this.IO = new FilesystemIO();
    } else {
      this.IO = new MemoryIO();
    }
    this.progressHandle = onProgress;

    this.files = new Proxy(this.files, {
      set: (target: any, property: any, value: any, receiver: any): boolean => {
        target[property] = value;
        if (property === 'length' && value > 0 && !this.running) {
          this.schedule();
        }
        return true;
      }
    });
  }

  public async addFiles(files: { path: string; name: string }[], asZip: boolean = false): Promise<Array<SavvyFile | SavvyZipFile>> {
    let tmpFiles: SavvyFile[] = [];
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      let tmpFile: SavvyFile | undefined = await this._addFile(files[i].path, files[i].name, asZip);

      if (tmpFile) {
        tmpFiles.push(tmpFile);
      }
    }
    if (asZip) {
      // create a zip file
      let tmpZipFile: SavvyZipFile = new SavvyZipFile(tmpFiles, `Archive-${generateId(4)}.zip`, this.IO, this.progressHandle);
      this.files.push(tmpZipFile);
    }

    return this.files;
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
    if (this.running) {
      this.freeze = false;

      this.schedule();
    }
  }
  public removeFile(id: number): SavvyFile | SavvyZipFile | undefined {
    this.pause();

    let tmpFile: SavvyFile | SavvyZipFile | undefined = this.files.find((file: SavvyFile | SavvyZipFile) => file.id === id);

    if (tmpFile) {
      tmpFile.status = 'abort';
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

  private schedule = (): void => {
    if (!this.freeze) {
      this.running = true;
      let currentFile: SavvyFile | SavvyZipFile | undefined = this.files.find((file: SavvyFile | SavvyZipFile) => file.status !== 'complete' && file.status !== 'abort');

      if (currentFile) {
        this.processCurrentFile(currentFile);
      } else {
        console.log('all files are in complete state, transfer stop.');
        this.running = false;
      }
    }
  };

  private processCurrentFile = async (file: SavvyFile | SavvyZipFile): Promise<undefined> => {
    if (!this.freeze) {
      if (file.status === 'abort') {
        this.schedule();
        return;
      }
      // need init to get a filewriter
      if (file.status === 'initializing') {
        await file.init();

        this.schedule();
        return;
      }

      // no more chunk need be download, should
      if (file.status === 'chunk_empty') {
        this.IO.download([file]);

        file.status = 'complete';

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

        return;
      }
      let buffer: ArrayBuffer = await response.arrayBuffer();

      if (this.freeze) {
        // throw this chunk
        file.resumePreChunk();

        return;
      }
      if (file.status !== 'abort') {
        await this.IO.write(file, buffer);
        file.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

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
