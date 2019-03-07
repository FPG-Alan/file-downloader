import IO from './IO';
import { filemime } from '../utils/index';
import SavvyFile from '../file';
import SavvyZipFile from '../zip_file';
import { ZipWriter, createZipWriter } from './zip';

const MSIE: boolean = typeof MSBlobBuilder === 'function';
export default class MemoryIO extends IO {
  // private size: number;
  private downloadSize: number = 0;

  constructor() {
    super();
  }
  public getFileWriter(file: SavvyFile | SavvyZipFile, successCallback: Function, errorCallback: Function): void {
    successCallback({
      fileEntry: null,
      fileWriter: new MemoryWrite()
    });
  }
  public write(file: SavvyFile | SavvyZipFile, buffer: ArrayBuffer): Promise<undefined> {
    return new Promise((resolve: Function, reject: Function) => {
      console.log('memory write');
      if (file.isZip) {
        let tmpZipFile: SavvyZipFile = file as SavvyZipFile;
        let zipWriter: ZipWriter = createZipWriter();
        let currentFile: SavvyFile = tmpZipFile.currentFile;

        zipWriter.add(currentFile, tmpZipFile, buffer, tmpZipFile.nowChunkIndex === tmpZipFile.chunklist.length).then(() => {
          resolve();
        });
      } else {
        file.fileWriter.onwriteend = () => {
          resolve();
        };
        file.fileWriter.onerror = (e: Error) => {
          reject();
        };

        file.fileWriter.write(new Blob([buffer]));
      }
    });
  }

  public download(files: Array<SavvyFile | SavvyZipFile>): void {
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      let blob: Blob = files[i].fileWriter.getBlob(files[i].name);
      let blob_url: string = '';
      if (MSIE) {
        navigator.msSaveOrOpenBlob(blob, name);
      } else {
        blob_url = window.URL.createObjectURL(blob);

        let dlLinkNode: HTMLAnchorElement = document.createElement('a');
        dlLinkNode.download = files[i].name;
        dlLinkNode.href = blob_url;

        // this click may triggers beforeunload...
        dlLinkNode.click();
      }
    }
  }
}

class MemoryWrite {
  private blobList: MSBlobBuilder | Blob[];
  public onwriteend: Function | null;
  public onerror: Function | null;
  constructor() {
    if (MSIE) {
      this.blobList = new MSBlobBuilder();
    } else {
      this.blobList = [];
    }

    this.onwriteend = null;
    this.onerror = null;
  }

  public getBlob(name: string): Blob {
    if (MSIE) {
      return (this.blobList as MSBlobBuilder).getBlob();
    }
    try {
      return new File(this.blobList as Blob[], name, { type: filemime(name) });
    } catch (ex) {
      console.log(ex);
    }
    return new Blob((this.blobList as Blob[]) || [], { type: filemime(name) });
  }

  public write(buffer: Blob) {
    try {
      if (MSIE) {
        (this.blobList as MSBlobBuilder).append(buffer);
      } else {
        (this.blobList as Blob[]).push(buffer);
      }

      this.onwriteend && this.onwriteend();
    } catch (e) {
      console.log(e);
      this.onerror && this.onerror(e);
    }
  }
}
