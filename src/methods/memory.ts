import SavvyIO from './IO';
import { filemime } from '../utils/index';
import SavvyFile from '../file';
import SavvyZipFile from '../zip_file';
import { ZipWriter, createZipWriter } from './zip';
import Transfer from '../transfer';

const MSIE: boolean = typeof MSBlobBuilder === 'function';
export default class MemoryIO extends SavvyIO {
  // private size: number;
  private downloadSize: number = 0;

  constructor() {
    super();

    console.log('memory download init...');
  }
  public getFileWriter(transfer: Transfer, successCallback: Function, errorCallback: Function): void {
    successCallback({
      fileEntry: null,
      fileWriter: new MemoryWrite()
    });
  }
  public write(transfer: Transfer, buffer: ArrayBuffer): Promise<undefined> {
    return new Promise((resolve: Function, reject: Function) => {
      console.log('memory write');
      if (transfer.zip) {
        // let tmpZipFile: SavvyZipFile = file as SavvyZipFile;
        let zipWriter: ZipWriter = createZipWriter();
        let currentFile: SavvyFile = transfer.currentFile;

        zipWriter.add(currentFile, transfer, buffer, transfer.chunkIndex === transfer.chunkList.length).then(() => {
          resolve();
        });
      } else {
        transfer.fileWriter.onwriteend = () => {
          resolve();
        };
        transfer.fileWriter.onerror = (e: Error) => {
          reject();
        };

        transfer.fileWriter.write(new Blob([buffer]));
      }
    });
  }
  public deleteFile(transfer: Transfer): void {
    transfer.fileWriter.clear();
    transfer.fileWriter = null;
  }
  public download(transfers: Array<Transfer>): void {
    for (let i: number = 0, l: number = transfers.length; i < l; i++) {
      let blob: Blob = transfers[i].fileWriter.getBlob(transfers[i].name);
      let blob_url: string = '';
      if (MSIE) {
        navigator.msSaveOrOpenBlob(blob, name);
      } else {
        blob_url = window.URL.createObjectURL(blob);
        let dlLinkNode: HTMLAnchorElement = document.createElement('a');
        dlLinkNode.download = transfers[i].name;
        dlLinkNode.href = blob_url;

        console.log(dlLinkNode);
        document.body.appendChild(dlLinkNode);

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

  public position: number = 0;
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

  public clear() {
    this.blobList = [];
  }
}
