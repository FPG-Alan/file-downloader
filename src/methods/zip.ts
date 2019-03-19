import Crc32 from '../utils/crc32';
import Int64 from '../utils/Int64';
import SavvyFile from '../file';
import Transfer from '../transfer';

export class ZipWriter {
  public async add(currentFile: SavvyFile, transfer: Transfer, _buffer: ArrayBuffer, isLast: boolean): Promise<undefined> {
    // part of the current file.
    let buffer: Uint8Array = new Uint8Array(_buffer);

    let crc: number = Crc32(buffer, currentFile.crc || 0, buffer.byteLength);
    let ziper: ZIPClass = new ZIPClass(transfer.fileSize);

    let fileName: string = unescape(encodeURIComponent(currentFile.name));
    currentFile.bufferAcc += buffer.byteLength;
    currentFile.crc = crc;

    if (currentFile.offset === 0) {
      // begin set header
      currentFile.headerPos = transfer.offset;
      let ebuf: any = ezBuffer(1 + 4 + 4 + fileName.length);
      ebuf.i16(zipUtf8ExtraId);
      ebuf.i16(5 + fileName.length); // size
      ebuf.i8(1); // version
      ebuf.i32(Crc32(fileName));
      ebuf.appendBytes(fileName);

      let header: Uint8Array = ziper.ZipHeader(fileName, currentFile.fileSize /* TO-DO: add file date */, ebuf.getArray());

      let d = new Uint8Array(header.byteLength + buffer.byteLength);
      d.set(header, 0);
      d.set(buffer, header.byteLength);

      buffer = d;
      // console.log('add header');
    }

    // begin set central directory
    if (currentFile.bufferAcc === currentFile.fileSize) {
      let centralDir = ziper.ZipCentralDirectory(fileName, currentFile.fileSize, currentFile.fileSize, crc, false, currentFile.headerPos);
      // zipFile.dirData.push(centralDir.dirRecord);
      let centralDirBuffer: Uint8Array = centralDir.dataDescriptor;

      let d = new Uint8Array(buffer.byteLength + centralDirBuffer.byteLength);
      d.set(buffer, 0);
      d.set(centralDirBuffer, buffer.byteLength);

      buffer = d;
    } else {
      currentFile.offset += buffer.byteLength;
    }

    if (isLast) {
      let end = ziper.ZipSuffix(buffer.byteLength + transfer.offset, []);

      // console.log('this file is the last to be added to this zip, add end.');

      let dirData: any[] = transfer.files.map(
        (file: SavvyFile) => ziper.ZipCentralDirectory(unescape(encodeURIComponent(file.name)), file.fileSize, file.fileSize, file.crc, false, file.headerPos).dirRecord
      );

      let tmpSize: number = 0,
        tmpOffset: number = buffer.byteLength,
        tmpBuf: Uint8Array;

      for (let i in dirData) {
        tmpSize += dirData[i].byteLength;
      }

      tmpBuf = new Uint8Array(buffer.byteLength + tmpSize + end.byteLength);

      tmpBuf.set(buffer, 0);

      for (let i in dirData) {
        // console.log(this.dirData[i], tmpOffset);
        tmpBuf.set(dirData[i], tmpOffset);
        tmpOffset += dirData[i].byteLength;
      }

      tmpBuf.set(end, tmpOffset);

      buffer = tmpBuf;
    }

    transfer.offset += buffer.byteLength;

    // console.log('get a finalliy buffer, length: ' + buffer.byteLength);
    return new Promise((resolve: Function, reject: Function) => {
      let tmpWrite: FileWriter = transfer.fileWriter;
      tmpWrite.onwriteend = (e: ProgressEvent) => {
        resolve();
      };
      tmpWrite.onerror = () => {
        reject();
      };
      tmpWrite.write(new Blob([buffer]));
    });
  }
}
export class BlobReader {
  private file: File;
  public size: number;
  constructor(_file: File) {
    this.file = _file;
    this.size = _file.size;
  }

  public readUint8Array(): Promise<Uint8Array> {
    return new Promise((resolve: Function, reject: Function) => {
      let reader: FileReader = new FileReader();
      // TO-DO: may be wrong
      reader.onload = (e: any): void => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };

      reader.onerror = (): void => {
        reject();
      };

      try {
        reader.readAsArrayBuffer(this.file);
      } catch (e) {
        reject();
      }
    });
  }
}
export function createZipWriter(): ZipWriter {
  return new ZipWriter();
}

const fileHeaderLen: number = 30;
const noCompression: number = 0;
const defaultFlags: number = 0x808; /* UTF-8 */
const i32max: number = 0xffffffff;
const i16max: number = 0xffff;
const zip64ExtraId: number = 0x0001;
const zipUtf8ExtraId: number = 0x7075;
const directory64LocLen: number = 20;
const directory64EndLen: number = 56;
const directoryEndLen: number = 22;
const fileHeaderSignature: number = 0x04034b50;
const directory64LocSignature: number = 0x07064b50;
const directory64EndSignature: number = 0x06064b50;
const directoryEndSignature: number = 0x06054b50;
const dataDescriptorSignature: number = 0x08074b50; // de-facto standard; required by OS X Finder
const directoryHeaderSignature: number = 0x02014b50;
const dataDescriptorLen: number = 16;
const dataDescriptor64Len: number = 24;
const directoryHeaderLen: number = 46;

class ZIPClass {
  private maxZipSize: number = Math.pow(2, 31) * 0.9;
  private isZip64: boolean = false;
  private zipVersion: number = 20;

  constructor(totalSize: number) {
    this.isZip64 = totalSize > this.maxZipSize || localStorage.zip64 === 1;
    this.zipVersion = this.isZip64 ? 45 : 20;
  }

  ZipHeader(fileName: string, fileSize: number, extra: number[]) {
    let readerVersion: number = this.zipVersion,
      Flags: number = defaultFlags,
      Method: number = noCompression,
      date: number = 0,
      crc32: number = 0,
      unsize: number = 0;

    let buf = ezBuffer(fileHeaderLen + fileName.length + extra.length);
    buf.i32(fileHeaderSignature);
    buf.i16(readerVersion);
    buf.i16(Flags);
    buf.i16(Method);
    DosDateTime(date, buf);
    buf.i32(crc32); // crc32
    buf.i32(fileSize); // compress size
    buf.i32(unsize); // uncompress size
    buf.i16(fileName.length);
    buf.i16(extra.length);
    buf.appendBytes(fileName);
    buf.appendBytes(extra);

    return buf.getBytes();
  }
  /**
   * @param {number} size compressed size
   * @param {number} unsize uncompress size
   * @param {number} crc32
   * @param {boolean} directory
   * @param {number} headerpos header position
   */

  ZipCentralDirectory(filename: string, size: number, unsize: number, crc32: number, directory: boolean, headerpos: number) {
    let creatorVersion: number = this.zipVersion;
    let readerVersion: number = this.zipVersion;
    let Flags: number = defaultFlags;
    let Method: number = noCompression;
    let date: number = 0;
    let externalAttr: number = directory ? 1 : 0;

    let extra: number[] = [],
      ebuf: any;

    if (this.isZip64) {
      ebuf = ezBuffer(28); // 2xi16 + 3xi64
      ebuf.i16(zip64ExtraId);
      ebuf.i16(24);
      ebuf.i64(size);
      ebuf.i64(unsize);
      ebuf.i64(headerpos);
      extra = extra.concat(ebuf.getArray());
    }

    var centralDirectoryBuf = ezBuffer(directoryHeaderLen + filename.length + extra.length);
    centralDirectoryBuf.i32(directoryHeaderSignature);
    centralDirectoryBuf.i16(creatorVersion);
    centralDirectoryBuf.i16(readerVersion);
    centralDirectoryBuf.i16(Flags);
    centralDirectoryBuf.i16(Method);
    DosDateTime(date, centralDirectoryBuf);
    centralDirectoryBuf.i32(crc32);
    centralDirectoryBuf.i32(this.isZip64 ? i32max : size);
    centralDirectoryBuf.i32(this.isZip64 ? i32max : unsize);
    centralDirectoryBuf.i16(filename.length);
    centralDirectoryBuf.i16(extra.length);
    centralDirectoryBuf.i16(0); // no comments
    centralDirectoryBuf.i32(0); // disk number
    centralDirectoryBuf.i32(externalAttr);
    centralDirectoryBuf.i32(this.isZip64 ? i32max : headerpos);
    centralDirectoryBuf.appendBytes(filename);
    centralDirectoryBuf.appendBytes(extra);

    var dataDescriptorBuf = ezBuffer(this.isZip64 ? dataDescriptor64Len : dataDescriptorLen);
    dataDescriptorBuf.i32(dataDescriptorSignature);
    dataDescriptorBuf.i32(crc32);
    if (this.isZip64) {
      dataDescriptorBuf.i64(size);
      dataDescriptorBuf.i64(unsize);
    } else {
      dataDescriptorBuf.i32(size);
      dataDescriptorBuf.i32(unsize);
    }

    return {
      dirRecord: centralDirectoryBuf.getBytes(),
      dataDescriptor: dataDescriptorBuf.getBytes()
    };
  }

  ZipSuffix(pos: number, dirData: Uint8Array[]) {
    var dirDatalength = 0;
    for (var i in dirData) {
      dirDatalength += dirData[i].length;
    }

    var buf = ezBuffer(22);
    if (this.isZip64) {
      var xbuf = ezBuffer(directory64EndLen + directory64LocLen);
      xbuf.i32(directory64EndSignature);
      // directory64EndLen - 4 bytes - 8 bytes
      xbuf.i64(directory64EndLen - 4 - 8);
      xbuf.i16(this.zipVersion);
      xbuf.i16(this.zipVersion);
      xbuf.i32(0); // disk number
      xbuf.i32(0); // number of the disk with the start of the central directory
      xbuf.i64(dirData.length);
      xbuf.i64(dirData.length);
      xbuf.i64(dirDatalength);
      xbuf.i64(pos);

      xbuf.i32(directory64LocSignature);
      xbuf.i32(0);
      xbuf.i64(pos + dirDatalength);
      xbuf.i32(1); // total number of disks
      buf.resize(22 + xbuf.getBytes().length);
      buf.appendBytes(xbuf.getBytes());
    }

    buf.i32(directoryEndSignature);
    buf.i32(0); // skip
    buf.i16(this.isZip64 ? i16max : dirData.length);
    buf.i16(this.isZip64 ? i16max : dirData.length);
    buf.i32(this.isZip64 ? i32max : dirDatalength);
    buf.i32(this.isZip64 ? i32max : pos);
    buf.i16(0); // no comments

    return buf.getBytes();
  }
}

function ezBuffer(size: number) {
  var obj = new Uint8Array(size),
    buffer = new DataView(obj.buffer),
    offset = 0;
  return {
    debug: function() {
      console.error(['DEBUG', offset, obj.length]);
    },
    getArray: function(): number[] {
      let bytes: number[] = [];
      obj.map(
        (val: number, i: number, array: Uint8Array): number => {
          bytes.push(val);

          return val;
        }
      );
      return bytes;
    },
    getBytes: function() {
      return obj;
    },
    appendBytes: function(text: number[] | Uint8Array | string) {
      var isArray = typeof text != 'string';
      for (var i = text.length; i--; ) {
        if (isArray) {
          obj[offset + i] = (text as number[] | Uint8Array)[i];
        } else {
          // We assume it is an string
          obj[offset + i] = (text as string).charCodeAt(i);
        }
      }
      offset += text.length;
    },
    i64: function(number: number, bigendian?: boolean) {
      var buffer = new Int64(number, null).buffer;
      if (!bigendian) {
        // swap the by orders
        var nbuffer = new Uint8Array(buffer.length),
          len = buffer.length - 1;
        for (var i = len; i >= 0; i--) {
          nbuffer[i] = buffer[len - i];
        }
        buffer = nbuffer;
      }
      // append the buffer
      this.appendBytes(buffer);
    },
    i32: function(number: number, bigendian?: boolean) {
      buffer.setInt32(offset, number, !bigendian);
      offset += 4;
    },
    i16: function(number: number, bigendian?: boolean) {
      buffer.setInt16(offset, number, !bigendian);
      offset += 2;
    },
    i8: function(number: number, bigendian?: boolean) {
      buffer.setInt8(offset, number);
      offset += 1;
    },
    resize: function(newsize: number) {
      let zobj = new Uint8Array(newsize);
      zobj.set(obj, 0);
      obj = zobj;
      buffer = new DataView(obj.buffer);
      return obj;
    },
    /**
     *  Check if the current bytestream has enough
     *  size to add "size" more bytes. If it doesn't have
     *  we return a new bytestream object
     */
    resizeIfNeeded: function(size: number) {
      if (obj.length < size + offset) {
        return this.resize(size + offset);
      }
      return obj;
    }
  };
}

/**
 *  Set an unix time (or now if missing) in the zip
 *  expected format
 */
function DosDateTime(sec: number, buf: any) {
  var date = new Date(),
    dosTime,
    dosDate;

  if (sec) {
    date = new Date(sec * 1000);
  }

  dosTime = date.getHours();
  dosTime = dosTime << 6;
  dosTime = dosTime | date.getMinutes();
  dosTime = dosTime << 5;
  dosTime = dosTime | (date.getSeconds() / 2);

  dosDate = date.getFullYear() - 1980;
  dosDate = dosDate << 4;
  dosDate = dosDate | (date.getMonth() + 1);
  dosDate = dosDate << 5;
  dosDate = dosDate | date.getDate();

  buf.i16(dosTime);
  buf.i16(dosDate);
}
