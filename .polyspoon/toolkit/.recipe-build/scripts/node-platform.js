"use strict";
if (typeof globalThis.FileReader === 'undefined') {
    class BlobReader {
        result = null;
        onloadend = null;
        onerror = null;
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }).catch(error => this.onerror?.(error));
        }
    }
    Object.defineProperty(globalThis, 'FileReader', { value: BlobReader, configurable: true });
}
