import { TChunk } from './interface';

export default class SavvyFile {
  public chunkList: TChunk[] = [];

  public filePath: string;
  public name: string;
  public fileSize: number;

  public offset: number = 0;
  public crc: number = 0;
  public headerPos: number = 0;
  public bufferAcc: number = 0;

  constructor(path: string, name: string, fileSize: number, chunkSize: number, buffacc?: number, offset?: number) {
    this.filePath = path;
    this.name = name;
    this.fileSize = fileSize;

    this.bufferAcc = buffacc || 0;
    this.offset = offset || 0;

    let tmpStart: number = 0,
      tmpEnd: number = 0;
    while (tmpEnd < this.fileSize) {
      tmpEnd = tmpStart + chunkSize;
      tmpEnd = tmpEnd > this.fileSize ? this.fileSize : tmpEnd;
      this.chunkList.push({
        filePath: this.filePath,
        start: tmpStart,
        end: tmpEnd
      });
      tmpStart = tmpEnd + 1;
    }
  }
}
