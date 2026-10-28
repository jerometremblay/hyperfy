// App scripts share world keys, but must never access the host's auth or prefs.
export function createClientScriptStorage(storage) {
  return {
    get(key) {
      return storage.get('scripts:' + key)
    },
    set(key, value) {
      storage.set('scripts:' + key, value)
    },
  }
}
