if (typeof globalThis.FileReader === 'undefined') {
  class BlobReader {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;
    onerror: ((error: unknown) => void) | null = null;
    readAsArrayBuffer(blob: Blob): void {
      blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }).catch(error => this.onerror?.(error));
    }
  }
  Object.defineProperty(globalThis, 'FileReader', { value: BlobReader, configurable: true });
}
