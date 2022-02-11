declare global {
  interface Window {
    api: Sandbox;
  }
}

export interface Sandbox {
  show(): void;
  file(): Promise<string[]>;
  folder(): Promise<string[]>;
  drop(paths: string[]): Promise<string[]>;
  baseName(filePath: string): string;
  getStatic(val: string): string;
  getAudio(val: string): Promise<string>;
}
