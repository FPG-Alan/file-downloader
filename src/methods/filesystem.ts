import SavvyIO from './IO';
import { filemime } from '../utils/index';
import SavvyFile from '../file';
import { createZipWriter, ZipWriter } from './zip';
import Transfer from '../transfer';

const customWindow: any = window;
const TEMPORARY: number = 0;
const PERSISTENT: number = 1;

export default class FilesystemIO extends SavvyIO {
  private freeSpaceRequest: boolean = false;
  private entrtiesReaded: boolean = false;
  private allEntries: Entry[] = [];
  private allResumeFiles: Array<Transfer> = [];
  constructor() {
    super();
    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem;
    // 创建文件系统, 临时空间会被浏览器自行判断, 在需要时删除, 永久空间不会, 但申请时需要用户允许.
    // window.requestFileSystem(type, size, successCallback[, errorCallback]);
    customWindow.requestFileSystem(TEMPORARY, 0x10000, (fs: FileSystem) => {
      // free space....
      fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
        let dirReader: DirectoryReader = directoryEntry.createReader();

        dirReader.readEntries((entries: Entry[]) => {
          // TO-DO: can not just simply clear all old files, need to keep files which are not completely downloaded.
          console.log(entries);
          this.allEntries = entries;
          this.entrtiesReaded = true;
          if (this.freeSpaceRequest) {
            this.freeSpace(this.allResumeFiles);
          }
          /* entries.map((entry: Entry) => {
            entry.remove(() => {
              console.log('remove file [' + entry.name + '] from filesystem successful.');
            });
          }); */
        });
      });
    });
  }
  public removeFile(transfer: Transfer): Promise<undefined> {
    return new Promise((resolve: Function, reject: Function) => {
      customWindow.requestFileSystem(TEMPORARY, 0x10000, (fs: FileSystem) => {
        fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
          let dirReader: DirectoryReader = directoryEntry.createReader();

          dirReader.readEntries((entries: Entry[]) => {
            entries.forEach((entry: Entry) => {
              // TO-DO: need check if this file is being write to filesystem...
              if (entry.name === transfer.name + transfer.id) {
                entry.remove(() => {
                  console.log('remove file [' + entry.name + '] from filesystem successful.');

                  resolve();
                });
              }
            });
          });
        });
      });
    });
  }

  public removeAll() {
    customWindow.requestFileSystem(TEMPORARY, 0x10000, (fs: FileSystem) => {
      // free space....
      fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
        let dirReader: DirectoryReader = directoryEntry.createReader();

        dirReader.readEntries((entries: Entry[]) => {
          // TO-DO: can not just simply clear all old files, need to keep files which are not completely downloaded.
          entries.map((entry: Entry) => {
            entry.remove(() => {
              console.log('remove file [' + entry.name + '] from filesystem successful.');
            });
          });
        });
      });
    });
  }
  /**
   * @param {SavvyFile} file
   * @param {Function} successCallback
   * @param {Function} errorCallback
   */
  public getFileWriter(transfer: Transfer, successCallback: Function, errorCallback: Function): void {
    customWindow.requestFileSystem(TEMPORARY, transfer.fileSize, (fs: FileSystem) => {
      fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
        fs.root.getFile('savvy/' + transfer.name + transfer.id, { create: true }, (fileEntry: FileEntry) => {
          fileEntry.getMetadata((metadata: Metadata) => {
            // console.log(metadata);
            fileEntry.createWriter((fw: FileWriter) => {
              if (metadata.size && metadata.size !== 0) {
                // set offset as file size, the plus op may not effective
                if (transfer.offset === metadata.size) {
                  // console.log(file.offset, metadata.size);
                  fw.seek(transfer.offset + 1);
                } else if (transfer.offset < metadata.size) {
                  // console.log(file.offset + ' ,' + metadata.size + ' - finally find u!');
                  fw.onwriteend = () => {
                    fw.seek(transfer.offset + 1);
                    successCallback({
                      fileEntry: fileEntry,
                      fileWriter: fw
                    });

                    return;
                  };

                  fw.truncate(transfer.offset);
                } else {
                  fw.seek(0);

                  transfer.abortAllResumeData();
                }
              }
              successCallback({
                fileEntry: fileEntry,
                fileWriter: fw
              });
            });
          });
        });
      });
    });
  }
  public freeSpace(transfers: Transfer[]): void {
    if (this.entrtiesReaded) {
      this.freeSpaceRequest = false;
      this.allEntries.forEach((entry: Entry) => {
        let tmpTransfer: Transfer | undefined = transfers.find((transfer: Transfer) => transfer.name + transfer.id === entry.name);
        // this file need be remove.
        if (tmpTransfer === undefined) {
          entry.remove(
            () => {
              console.log(entry.name + ' removed.');
            },
            (err: DOMError) => {}
          );
        }
      });
    } else {
      this.allResumeFiles = transfers;
      this.freeSpaceRequest = true;
    }
  }
  /**
   * @param {SavvyFile} file
   * @param {ArrayBuffer} buffer
   */
  public write(transfer: Transfer, buffer: ArrayBuffer): Promise<any> {
    return new Promise((resolve, reject) => {
      if (transfer.fileWriter) {
        let fileWriter: FileWriter = transfer.fileWriter as FileWriter;
        if (transfer.zip) {
          let zipWriter: ZipWriter = createZipWriter();
          let currentFile: SavvyFile = transfer.currentFile;
          zipWriter.add(currentFile, transfer, buffer, transfer.chunkIndex === transfer.chunkList.length).then(() => {
            resolve();
          });
        } else {
          try {
            fileWriter.onwriteend = (e: ProgressEvent) => {
              resolve();
            };
            fileWriter.write(new Blob([buffer]));
          } catch (e) {
            console.log(e);
            reject();
          }
        }
      } else {
        console.log('file has no file writer');
        reject();
      }
    });
  }
  /**
   * do not delete file while it's being copied from FS to DL folder
   * conservative assumption that a file is being written at 1024 bytes per ms
   * add 30000 ms margin
   */
  public deleteFile(transfer: Transfer): void {
    // let assume
    if (transfer.fileEntry) {
      let _file = transfer.fileEntry as FileEntry;
      if (_file.isFile) {
        _file.getMetadata(
          (metadata: Metadata) => {
            let delTime: number = metadata.size / 1024 + 30000;
            setTimeout(() => {
              _file.remove(() => {
                console.log('file ' + transfer.name + ' being removed from filesystem...');
              });
            }, delTime);
          },
          (err: DOMError) => {
            console.log(err);
          }
        );
      }
      /* (file.fileEntry as FileEntry).file((_file: File) =>{
        _file.get
      }, (err: DOMError) =>{
        console.log(err);
      }) */
    }
  }

  /**
   * @param {Transfer[]}transfers
   * @public
   */
  public download(transfers: Array<Transfer>): void {
    for (let i: number = 0, l: number = transfers.length; i < l; i++) {
      let fileEntry: FileEntry = transfers[i].fileEntry as FileEntry;
      if (typeof transfers[i].fileEntry.file === 'function') {
        try {
          fileEntry.file(
            (file: File) => {
              this.saveFile(transfers[i], file);
            },
            () => {
              this.saveLink(transfers[i]);
            }
          );
        } catch (e) {
          console.log(e);
        }
      } else {
        this.saveLink(transfers[i]);
      }
    }
  }
  /**
   * @param {Transfer}transfer
   * @param {String?}objectURL
   * @private
   */
  private saveLink = (transfer: Transfer, objectURL?: string) => {
    let link: string | false = typeof objectURL === 'string' && objectURL;
    let dlLinkNode: HTMLAnchorElement = document.createElement('a');

    dlLinkNode.download = transfer.name;
    dlLinkNode.href = link || transfer.fileEntry.toURL();

    dlLinkNode.click();
  };
  /**
   * @param {Transfer}transfer
   * @param {File}file
   * @private
   */
  private saveFile = (transfer: Transfer, file: File) => {
    try {
      let _file: File = new File([file], transfer.name, {
        type: filemime(transfer.name)
      });

      this.saveLink(transfer, window.URL.createObjectURL(_file));
    } catch (ex) {
      console.log(ex);
      this.saveLink(transfer);
    }
  };
}
