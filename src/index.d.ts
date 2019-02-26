// Type definitions for Savvy-Transfer 0.0.1
// Project: Savvy-Transfer
// Definitions by: Alan.Yang <http://fpg-alan.github.io>

export = SavvyTransfer;

declare class SavvyTransfer {
  constructor();
  static SIZE_LIMIT: number;
  static CHUNK_SIZE: number;

  someProperty: string[];
  addFile(name: string): Promise<SavvyFile>;
}

declare class SavvyFile {
  constructor(path: string, fileSize: number, chunkSize: number);

  public status: 'initializing' | 'downloading' | 'complete' | 'abort';
  public chunklist: {
    start: number;
    end: number;
  }[];
}
