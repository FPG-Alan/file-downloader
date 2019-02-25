import IO from './IO';

export default class filesystemIO extends IO {
  constructor() {
    super();
  }
  public write(buffer: ArrayBuffer) {}
  public download() {
    console.log('fs download');
    // 请求文件系统
    // 写入文件系统
    // 读取数据, 制造下载连接, 下载.
  }
}
