export type TChunk = { filePath: string; start: number; end: number };
export type TStatus = 'initializing' | 'inited' | 'downloading' | 'chunk_empty' | 'complete' | 'abort';

export type TResumeData = {
  id: number;
  name: string;
  type: 'zip';
  chunkIndex: number;
  tag: 0 | 1; // 0: not complete, 1: complete

  path?: string; // in case of the type is not zip, temporary not that possible
  size?: number; // in case of the type is not zip, temporary not that possibleoffset
  offset: number;
  dirData: any[];
  files: TResumeFile[];
};

export type TResumeFile = {
  name: string;
  path: string;
  size: number;
  bufferAcc: number;
  offset: number;
};
