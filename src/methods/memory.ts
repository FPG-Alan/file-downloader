import IO from './IO';
import { filemime } from '../utils/index';

const MSIE: boolean = typeof MSBlobBuilder === 'function';
export default class MemoryIO extends IO {
  private blobList: MSBlobBuilder | Blob[];
  private size: number;
  private downloadSize: number = 0;

  constructor(fileSize: number) {
    super();
    this.size = fileSize;
    if (MSIE) {
      this.blobList = new MSBlobBuilder();
    } else {
      this.blobList = [];
    }
  }
  public write(buffer: ArrayBuffer): boolean {
    console.log('memory write');
    try {
      if (MSIE) {
        (this.blobList as MSBlobBuilder).append(buffer);
      } else {
        (this.blobList as Blob[]).push(new Blob([buffer]));
      }
    } catch (e) {
      console.log(e);
    }
    this.downloadSize += buffer.byteLength;
    console.log(this.downloadSize);
    if (this.downloadSize === this.size) {
      return true;
    } else {
      return false;
    }
  }

  public download(name: string): void {
    let blob: Blob = this.getBlob(name);
    let blob_url: string = '';
    if (MSIE) {
      navigator.msSaveOrOpenBlob(blob, name);
    } else {
      blob_url = window.URL.createObjectURL(blob);

      let dlLinkNode: HTMLAnchorElement = document.createElement('a');
      dlLinkNode.download = name;
      dlLinkNode.href = blob_url;

      // this click may triggers beforeunload...
      dlLinkNode.click();
    }
  }

  private getBlob(name: string): Blob {
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
}
