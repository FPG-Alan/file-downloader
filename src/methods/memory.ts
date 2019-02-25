import IO from './IO';

export default class memoryIO extends IO {
  constructor() {
    super();
  }
  public write() {
    console.log('memory write');
  }
}
