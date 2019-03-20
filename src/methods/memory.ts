import SavvyIO from './IO';
import { filemime } from '../utils/index';
import Transfer from '../transfer';
import { zipBuffer } from './zip';

const MSIE: boolean = typeof MSBlobBuilder === 'function';
export default class MemoryIO extends SavvyIO {
  public getFileWriter(transfer: Transfer, successCallback: Function, errorCallback: Function): void {
    successCallback({
      fileEntry: null,
      fileWriter: new MemoryWrite()
    });
  }
  /**
   * write buffer to memory (just simply push to an array)
   * @param {Transfer} transfer
   * @param {ArrayBuffer} buffer
   */
  public write(transfer: Transfer, buffer: ArrayBuffer): Promise<undefined> {
    return new Promise((resolve: Function, reject: Function) => {
      let fileWriter: MemoryWrite = transfer.fileWriter as MemoryWrite;
      if (transfer.zip) {
        zipBuffer(transfer.currentFile, transfer, buffer, transfer.chunkIndex === transfer.chunkList.length).then((zipBuffer: ArrayBuffer) => {
          try {
            fileWriter.onwriteend = (e: ProgressEvent) => {
              resolve();
            };
            fileWriter.write(new Blob([zipBuffer]));
          } catch (e) {
            console.log(e);
            reject();
          }
        });
      } else {
        fileWriter.onwriteend = () => {
          resolve();
        };
        fileWriter.onerror = (e: Error) => {
          reject();
        };

        fileWriter.write(new Blob([buffer]));
      }
    });
  }
  /**
   * empty buffer array.
   * @param {Transfer} transfer
   */
  public deleteFile(transfer: Transfer): void {
    (transfer.fileWriter as MemoryWrite).clear();
    transfer.fileWriter = null;
  }
  /**
   * 1. get Blob from buffer array
   * 2. generate an `<a>` tag and trigger click event to download Blob as file.
   * @param {Array<Transfer>} transfers
   */
  public download(transfers: Array<Transfer>): void {
    for (let i: number = 0, l: number = transfers.length; i < l; i++) {
      let blob: Blob = (transfers[i].fileWriter as MemoryWrite).getBlob(transfers[i].name);
      let blob_url: string = '';
      if (MSIE) {
        navigator.msSaveOrOpenBlob(blob, name);
      } else {
        blob_url = window.URL.createObjectURL(blob);
        let dlLinkNode: HTMLAnchorElement = document.createElement('a');
        dlLinkNode.download = transfers[i].name;
        dlLinkNode.href = blob_url;
        document.body.appendChild(dlLinkNode);

        // this click may triggers beforeunload...
        dlLinkNode.click();
      }
    }
  }
}

export class MemoryWrite {
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
