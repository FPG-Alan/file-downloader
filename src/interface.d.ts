export type TChunk = { start: number; end: number };
export type TStatus = 'initializing' | 'ready' | 'downloading' | 'chunk_empty' | 'complete' | 'abort';
