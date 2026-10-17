// Typed wrapper around the DMU loading helpers (loading.js)
// The loading.js script exposes window.DMU.loading
declare global {
  interface Window {
    DMU?: {
      loading: {
        button: (btn: HTMLButtonElement, task: () => Promise<unknown>, opts?: { busyLabel?: string; delay?: number; min?: number }) => Promise<unknown>;
        region: (el: HTMLElement, task: () => Promise<unknown>, render: (data: unknown) => string, opts?: Record<string, unknown>) => Promise<void>;
        page: (task: () => Promise<unknown>, opts?: { label?: string }) => Promise<unknown>;
      };
    };
  }
}
export {};
