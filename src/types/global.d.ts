export {};

declare global {
  interface Window {
    ucoderInsight?: {
      version: string;
      isReady: boolean;
      isVanilla: () => boolean;
      init: (projectId: string, options?: any) => Promise<any>;
      track: (config: any) => void;
      healthCheck: () => boolean;
    };
  }
}