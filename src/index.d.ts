export as namespace SavvyTransfer;

declare namespace SavvyTransfer {
  interface Savvy_IO<IN, OUT> {
    read(path: string): ArrayBuffer;
    write(path: string, name: string, buffer: ArrayBuffer): void;
    delete(name: string): void;
  }

  interface Savvy_File {
    name: string;
    size: number;
  }
}
