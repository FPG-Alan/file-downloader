export type TChunk = { start: number; end: number };
export type TStatus = 'initializing' | 'inited' | 'downloading' | 'chunk_empty' | 'complete' | 'abort';
