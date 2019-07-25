import Transfer from './transfer';
import { TChunk } from './interface';
import SavvyTransfer from '.';

export default class TransferProcesser {
  public idle: boolean = true;
  public transfer: Transfer | null = null;
  /**
   * use @function getStatus() to get file's current status instead of accessing it directly
   * so this is done to avoid errors during ts static checking
   * @ref https://github.com/Microsoft/TypeScript/issues/29155
   */
  public run(transfer: Transfer, scheduler: SavvyTransfer) {
    transfer.processer = this;
    this.transfer = transfer;
    this.idle = false;

    if (!transfer.lock) {
      transfer.lock = true;
    }

    if (!transfer.paused) {
      transfer.status = 'downloading';
      this.process(transfer, scheduler);
    } else {
      transfer.lock = false;
      transfer.processer = null;
      this.idle = true;
      if (transfer.status !== 'abort') {
        transfer.status = 'paused';
      }
    }
  }
  public process = async (transfer: Transfer, scheduler: SavvyTransfer): Promise<undefined> => {
    if (!transfer.paused) {
      if (transfer.getStatus() === 'abort') {
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_transfer: Transfer) => _transfer.id === _transfer.id), 1);

        this.idle = true;
        this.transfer = null;
        transfer.lock = false;
        transfer.processer = null;

        scheduler.distributeToProcessers();
        return;
      }
      // no more chunk need be download, should
      if (transfer.chunkIndex >= transfer.chunkList.length) {
        scheduler.IO.download([transfer]);

        transfer.status = 'complete';

        scheduler.storeFileForResume(transfer);
        scheduler.IO.deleteFile(transfer);
        scheduler.totalSize -= transfer.fileSize;
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_transfer: Transfer) => _transfer.id === _transfer.id), 1);

        this.idle = true;
        this.transfer = null;
        transfer.lock = false;
        transfer.processer = null;

        scheduler.distributeToProcessers();
        return;
      }

      // need init to get a filewriter
      if (!transfer.fileWriter) {
        await transfer.init();
        this.run(transfer, scheduler);
        return;
      }

      // file.status should be inited
      this.fetchChunk(transfer, scheduler).catch(
        (error: Error): void => {
          console.log(error);
          transfer.resumePreChunk();
          transfer.paused = true;
          transfer.lock = false;
          transfer.processer = null;
          this.idle = true;
          if (transfer.status !== 'abort') {
            transfer.status = 'error';
          }
        }
      );
      return;
      /* let nextChunk: TChunk = transfer.nextChunk();
      let response: Response = await fetch(nextChunk.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

      if (transfer.paused) {
        // throw this chunk
        transfer.resumePreChunk();

        transfer.lock = false;
        transfer.processer = null;
        this.idle = true;
        if (transfer.status !== 'abort') {
          transfer.status = 'paused';
        }
        return;
      }
      let buffer: ArrayBuffer = await response.arrayBuffer();

      if (transfer.paused) {
        // throw this chunk
        transfer.resumePreChunk();
        transfer.paused = true;
        transfer.lock = false;
        transfer.processer = null;
        this.idle = true;
        if (transfer.status !== 'abort') {
          transfer.status = 'paused';
        }
        return;
      }

      await scheduler.IO.write(transfer, buffer);
      if (transfer.getStatus() === 'abort') {
        // delete this file.
        scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_transfer: Transfer) => _transfer.id === _transfer.id), 1);

        this.idle = true;
        this.transfer = null;
        transfer.lock = false;
        transfer.processer = null;

        scheduler.distributeToProcessers();
        return;
      }
      transfer.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

      // console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);
      scheduler.storeFileForResume(transfer);

      this.run(transfer, scheduler); */
    } else {
      if (transfer.status !== 'abort') {
        transfer.status = 'paused';
      }
      transfer.processer = null;
      transfer.lock = false;
      this.idle = true;
    }
  };

  private async fetchChunk(transfer: Transfer, scheduler: SavvyTransfer): Promise<undefined> {
    let nextChunk: TChunk = transfer.nextChunk();
    let response: Response = await fetch(nextChunk.filePath, { method: 'GET', headers: { Range: `bytes=${nextChunk.start}-${nextChunk.end}` } });

    if (transfer.paused) {
      // throw this chunk
      this.pausedDuringFetch(transfer);
      return;
    }
    let buffer: ArrayBuffer = await response.arrayBuffer();

    if (transfer.paused) {
      // throw this chunk
      this.pausedDuringFetch(transfer);
      return;
    }

    await scheduler.IO.write(transfer, buffer);
    if (transfer.getStatus() === 'abort') {
      // delete this file.
      scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex((_transfer: Transfer) => _transfer.id === _transfer.id), 1);

      this.idle = true;
      this.transfer = null;
      transfer.lock = false;
      transfer.processer = null;

      scheduler.distributeToProcessers();
      return;
    }
    transfer.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1));

    // console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);
    scheduler.storeFileForResume(transfer);

    this.run(transfer, scheduler);
    return;
  }

  private pausedDuringFetch(transfer: Transfer): void {
    transfer.resumePreChunk();
    transfer.paused = true;
    transfer.lock = false;
    transfer.processer = null;
    this.idle = true;
    if (transfer.status !== 'abort') {
      transfer.status = 'paused';
    }
  }
}
