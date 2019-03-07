import IO from './IO';
import { filemime } from '../utils/index';
import SavvyFile from '../file';
import { createZipWriter, ZipWriter, BlobReader } from './zip';
import SavvyZipFile from '../zip_file';

const customWindow: any = window;
const TEMPORARY: number = 0;
const PERSISTENT: number = 1;

export default class FilesystemIO extends IO {
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
        fs.root.getFile('savvy/' + file.name, { create: true }, (fileEntry: FileEntry) => {
          fileEntry.createWriter((fw: FileWriter) => {
            successCallback({
              fileEntry: fileEntry,
              fileWriter: fw
            });
          });
        });
      });
    });
  }
  /* private handleFileWriteStart = (event: ProgressEvent): void => {
    console.log(event);

    this.writing = true;
  };
  private handleFileWriteProgress = (event: ProgressEvent): void => {
    console.log(event);
  };
  private handleFileWriteError = (event: ProgressEvent): void => {
    console.log(event);

    this.writing = false;
  };
  private handleFileWriteEnd = (event: ProgressEvent): void => {
    console.log(event);
    console.log(this.fileWriter!.position);
    this.writing = false;

    if (this.writeEndResolve) {
      this.writeEndResolve();

      this.writeEndReject = null;
      this.writeEndResolve = null;
    }
  }; */
  // Try to free space before starting the download.
  // 需要考虑是否存在当前有文件正在从沙盒环境写入本地文件系统, 在这个过程中不能删除这个空间.
  private free_space(callback: Function, ms: number, delta: any): void {}

  private createTmpFile(): Promise<FileEntry> {
    let tmpFileName: string = 'tmp.zip';

    return new Promise((resolve: Function, reject: Function) => {
      customWindow.requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, (fs: FileSystem) => {
        fs.root.getFile(
          tmpFileName,
          undefined,
          (file: FileEntry) => {
            file.remove(
              () => {
                this.create(fs, tmpFileName, resolve, reject);
              },
              () => {
                this.create(fs, tmpFileName, resolve, reject);
              }
            );
          },
          () => {
            this.create(fs, tmpFileName, resolve, reject);
          }
        );
      });
    });
  }
  private create(fs: FileSystem, tmpFileName: string, resolve: Function, reject: Function): void {
    fs.root.getFile(
      tmpFileName,
      { create: true },
      (tmpFile: FileEntry) => {
        resolve(tmpFile);
      },
      () => {
        reject();
      }
    );
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

  /* private async downloadAsZip(files: SavvyFile[]): Promise<undefined> {
    // create a tmpFile for zip buffer.
    let tmpZipFile: FileEntry = await this.createTmpFile();

    let totalFileSize: number = files.reduce((prev: number, cur: SavvyFile, curIndex: number, arr: SavvyFile[]) => prev + cur.fileSize, 0);

    // creative a zip writer(a zip writer need a reader to provide data, and a writer to writer zip data to zip file.)
    let writer: FileWriter = await new Promise((resolve: Function, reject: Function) => {
      tmpZipFile.createWriter(
        (fileWriter: FileWriter) => {
          resolve(fileWriter);
        },
        () => {
          reject();
        }
      );
    });

    let zipWriter: ZipWriter = createZipWriter(writer);

    // add all files into zip writer, and writer to fs://root/tmp.zip
    for (let i: number = 0, l: number = files.length; i < l; i++) {
      // get File Obj
      // TO-DO: stupid thing is, we use Filesystem to store the file but at here we read it to memory again!
      // WHATEVER SOMETHING MUST BE FOUND TO SOLVE THIS SHIT!
      let tmpFile: File = await new Promise((resolve: FileCallback, reject: ErrorCallback) => {
        (files[i].fileEntry as FileEntry).file(resolve, reject);
      });
      await zipWriter.add(files[i].name, new BlobReader(tmpFile), files[i].fileSize, totalFileSize, i === l - 1);
    }

    // download this zip file
    if (typeof tmpZipFile.file === 'function') {
      try {
        tmpZipFile.file(
          (file: File) => {
            console.log(file);
            let _file: File = new File([file], 'tmp.zip', {
              type: filemime('tmp.zip')
            });

            this.saveLink(new SavvyFile('', 'tmp.zip', 0, 0, this), window.URL.createObjectURL(_file));
            // this.saveFile(files[0], file);
          },
          () => {
            this.saveLink(files[0]);
          }
        );
      } catch (e) {
        console.log(e);
      }
    } else {
      this.saveLink(files[0]);
    }

    return;
  } */
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
