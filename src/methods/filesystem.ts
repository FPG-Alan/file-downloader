import IO from './IO';
import { filemime } from '../utils/index';
import SavvyFile from '../file';
import { createZipWriter, ZipWriter, BlobReader } from './zip';
import SavvyZipFile from '../zip_file';

const customWindow: any = window;
const TEMPORARY: number = 0;
const PERSISTENT: number = 1;

export default class FilesystemIO extends IO {
  private freeSpaceRequest: boolean = false;
  private entrtiesReaded: boolean = false;
  private allEntries: Entry[] = [];
  private allResumeFiles: Array<SavvyFile | SavvyZipFile> = [];
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
  public removeFile(file: SavvyFile | SavvyZipFile): Promise<undefined> {
    return new Promise((resolve: Function, reject: Function) => {
      customWindow.requestFileSystem(TEMPORARY, 0x10000, (fs: FileSystem) => {
        fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
          let dirReader: DirectoryReader = directoryEntry.createReader();

          dirReader.readEntries((entries: Entry[]) => {
            entries.forEach((entry: Entry) => {
              // TO-DO: need check if this file is being write to filesystem...
              if (entry.name === file.name + file.id) {
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
  public getFileWriter(file: SavvyFile | SavvyZipFile, successCallback: Function, errorCallback: Function): void {
    customWindow.requestFileSystem(TEMPORARY, file.fileSize, (fs: FileSystem) => {
      fs.root.getDirectory('savvy', { create: true }, (directoryEntry: DirectoryEntry) => {
        fs.root.getFile('savvy/' + file.name + file.id, { create: true }, (fileEntry: FileEntry) => {
          fileEntry.getMetadata((metadata: Metadata) => {
            // console.log(metadata);
            fileEntry.createWriter((fw: FileWriter) => {
              if (metadata.size && metadata.size !== 0) {
                // set offset as file size, the plus op may not effective
                if (file.offset === metadata.size) {
                  // console.log(file.offset, metadata.size);
                  fw.seek(file.offset + 1);
                } else if (file.offset < metadata.size) {
                  // console.log(file.offset + ' ,' + metadata.size + ' - finally find u!');
                  fw.onwriteend = () => {
                    fw.seek(file.offset + 1);
                    successCallback({
                      fileEntry: fileEntry,
                      fileWriter: fw
                    });

                    return;
                  };

                  fw.truncate(file.offset);
                } else {
                  fw.seek(0);

                  (file as SavvyZipFile).abortAllResumeData();
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
  public freeSpace(files: Array<SavvyFile | SavvyZipFile>): void {
    if (this.entrtiesReaded) {
      this.freeSpaceRequest = false;
      this.allEntries.forEach((entry: Entry) => {
        let tmpFile: SavvyFile | SavvyZipFile | undefined = files.find((file: SavvyFile | SavvyZipFile) => file.name + file.id === entry.name);
        // this file need be remove.
        if (tmpFile === undefined) {
          entry.remove(
            () => {
              console.log(entry.name + ' removed.');
            },
            (err: DOMError) => {}
          );
        }
      });
    } else {
      this.allResumeFiles = files;
      this.freeSpaceRequest = true;
    }
  }
  /**
   * @param {SavvyFile} file
   * @param {ArrayBuffer} buffer
   */
  public write(file: SavvyFile | SavvyZipFile, buffer: ArrayBuffer): Promise<any> {
    return new Promise((resolve, reject) => {
      if (file.fileWriter) {
        let fileWriter: FileWriter = file.fileWriter as FileWriter;
        if (file.isZip) {
          let tmpZipFile: SavvyZipFile = file as SavvyZipFile;
          let zipWriter: ZipWriter = createZipWriter();
          let currentFile: SavvyFile = tmpZipFile.currentFile;
          zipWriter.add(currentFile, tmpZipFile, buffer, tmpZipFile.nowChunkIndex === tmpZipFile.chunklist.length).then(() => {
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
  public deleteFile(file: SavvyFile | SavvyZipFile): void {
    // let assume
    if (file.fileEntry) {
      let _file = file.fileEntry as FileEntry;
      if (_file.isFile) {
        _file.getMetadata(
          (metadata: Metadata) => {
            let delTime: number = metadata.size / 1024 + 30000;
            setTimeout(() => {
              _file.remove(() => {
                console.log('file ' + file.name + ' being removed from filesystem...');
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
   * @param {SavvyFile}File
   * @param {SavvyFile[]}Files
   * @public
   */
  public download(files: Array<SavvyFile | SavvyZipFile>): void {
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      let fileEntry: FileEntry = files[i].fileEntry as FileEntry;
      if (typeof files[i].fileEntry.file === 'function') {
        try {
          fileEntry.file(
            (file: File) => {
              this.saveFile(files[i], file);
            },
            () => {
              this.saveLink(files[i]);
            }
          );
        } catch (e) {
          console.log(e);
        }
      } else {
        this.saveLink(files[i]);
      }
    }
  }
  /**
   * @param {SavvyFile}file
   * @param {String?}objectURL
   * @private
   */
  private saveLink = (file: SavvyFile | SavvyZipFile, objectURL?: string) => {
    let link: string | false = typeof objectURL === 'string' && objectURL;
    let dlLinkNode: HTMLAnchorElement = document.createElement('a');

    dlLinkNode.download = file.name;
    dlLinkNode.href = link || file.fileEntry.toURL();

    dlLinkNode.click();
  };
  /**
   * @param {SavvyFile}savvyFile
   * @param {File}file
   * @private
   */
  private saveFile = (savvyFile: SavvyFile | SavvyZipFile, file: File) => {
    try {
      let _file: File = new File([file], savvyFile.name, {
        type: filemime(savvyFile.name)
      });

      this.saveLink(savvyFile, window.URL.createObjectURL(_file));
    } catch (ex) {
      console.log(ex);
      this.saveLink(savvyFile);
    }
  };
}
