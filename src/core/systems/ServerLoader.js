// Adapted from https://github.com/dwebxr/coo-world/commit/d17d631c168c62370f3d7f80b3f45554ad3c8c51
import fs from 'fs-extra'
import path from 'path'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFLoader } from '../libs/gltfloader/GLTFLoader.js'
// import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { System } from './System'
import { createVRMFactory } from '../extras/createVRMFactory'
import { glbToNodes } from '../extras/glbToNodes'
import { createNode } from '../extras/createNode'
import { createEmoteFactory } from '../extras/createEmoteFactory'
import { recipeFromSandbox, runtimePolyspoonHash } from '../extras/polyspoon'
import { createHash } from 'node:crypto'
import { Worker } from 'node:worker_threads'

/**
 * Server Loader System
 *
 * - Runs on the server
 * - Basic file loader for many different formats, cached.
 *
 */
export class ServerLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.rgbeLoader = new HDRLoader()
    this.gltfLoader = new GLTFLoader()
    // The server needs model geometry/material settings, not GPU images. Run this
    // plugin before texture-format plugins so they cannot decode or fetch images.
    this.gltfLoader.pluginCallbacks.unshift(() => ({
      name: 'HYP_server_textures',
      loadTexture: () => Promise.resolve(null),
    }))
    this.preloadItems = []
    this.polyspoonRecipes = new Map()
    // this.gltfLoader.register(parser => new VRMLoaderPlugin(parser))

    // mock globals to allow gltf loader to work in nodejs
    globalThis.self = { URL }
    globalThis.window = {}
    globalThis.document = {
      createElementNS: () => ({ style: {} }),
    }
  }

  init({ assets, polyspoonRegistry }) {
    this.assets = assets
    this.polyspoonRegistry = polyspoonRegistry
  }

  async loadPolyspoonRecipe(model) {
    const hash = runtimePolyspoonHash(model)
    if (!hash || !(await this.polyspoonRegistry?.has(hash))) {
      throw new Error('Polyspoon recipe is not approved')
    }
    if (!this.polyspoonRecipes.has(hash)) {
      const promise = (async () => {
        const bytes = await this.assets.read(`${hash}.js`)
        if (!bytes || createHash('sha256').update(bytes).digest('hex') !== hash) {
          throw new Error('Polyspoon recipe asset is missing or corrupt')
        }
        return bytes.toString('utf8')
      })()
      this.polyspoonRecipes.set(hash, promise)
      promise.catch(() => this.polyspoonRecipes.delete(hash))
    }
    return this.polyspoonRecipes.get(hash)
  }

  async buildPolyspoonRecipe(source, props) {
    const parameters = JSON.stringify(props || {})
    const worker = new Worker(path.join(globalThis.__dirname, 'polyspoon-worker-node.js'), {
      resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32 },
    })
    try {
      const output = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Recipe sandbox timed out')), 10000)
        const finish = (error, value) => {
          clearTimeout(timer)
          if (error) reject(error)
          else resolve(value)
        }
        worker.once('error', error => finish(error))
        worker.once('exit', code => finish(new Error(`Recipe sandbox exited (${code})`)))
        worker.once('message', message =>
          message?.error ? finish(new Error(message.error)) : finish(null, message?.result)
        )
        worker.postMessage({ source, parameters })
      })
      return recipeFromSandbox(output)
    } finally {
      await worker.terminate()
    }
  }

  start() {
    // ...
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  async fetchArrayBuffer(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      return arrayBuffer
    } else {
      const buffer = await fs.readFile(url)
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      return arrayBuffer
    }
  }

  async fetchText(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      const text = await response.text()
      return text
    } else {
      const text = await fs.readFile(url, { encoding: 'utf8' })
      return text
    }
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }
    url = this.world.resolveURL(url, true)

    let promise
    if (type === 'hdr') {
      // promise = this.rgbeLoader.loadAsync(url).then(texture => {
      //   return texture
      // })
    }
    if (type === 'image') {
      // ...
    }
    if (type === 'texture') {
      // ...
    }
    if (type === 'model') {
      promise = new Promise((resolve, reject) => {
        ;(async () => {
          try {
            const arrayBuffer = await this.fetchArrayBuffer(url)
            // parse settles asynchronously (external buffers are fetched), so its errors need their own path
            this.gltfLoader.parse(
              arrayBuffer,
              '',
              glb => {
                try {
                  const node = glbToNodes(glb, this.world)
                  const model = {
                    toNodes() {
                      return node.clone(true)
                    },
                  }
                  this.results.set(key, model)
                  resolve(model)
                } catch (err) {
                  reject(err)
                }
              },
              reject
            )
          } catch (err) {
            reject(err)
          }
        })()
      })
    }
    if (type === 'emote') {
      promise = new Promise((resolve, reject) => {
        ;(async () => {
          try {
            const arrayBuffer = await this.fetchArrayBuffer(url)
            this.gltfLoader.parse(
              arrayBuffer,
              '',
              glb => {
                try {
                  const factory = createEmoteFactory(glb, url)
                  const emote = {
                    toClip(options) {
                      return factory.toClip(options)
                    },
                  }
                  this.results.set(key, emote)
                  resolve(emote)
                } catch (err) {
                  reject(err)
                }
              },
              reject
            )
          } catch (err) {
            reject(err)
          }
        })()
      })
    }
    if (type === 'avatar') {
      promise = new Promise((resolve, reject) => {
        ;(async () => {
          try {
            // NOTE: we can't load vrms on the server yet but we don't need 'em anyway
            let node
            const glb = {
              toNodes: () => {
                if (!node) {
                  node = createNode('group')
                  const node2 = createNode('avatar', { id: 'avatar', factory: null })
                  node.add(node2)
                }
                return node.clone(true)
              },
            }
            this.results.set(key, glb)
            resolve(glb)
          } catch (err) {
            reject(err)
          }
        })()
      })
    }
    if (type === 'script') {
      promise = new Promise((resolve, reject) => {
        ;(async () => {
          try {
            const code = await this.fetchText(url)
            const script = this.world.scripts.evaluate(code)
            this.results.set(key, script)
            resolve(script)
          } catch (err) {
            reject(err)
          }
        })()
      })
    }
    if (type === 'audio') {
      promise = new Promise((resolve, reject) => {
        reject(null)
      })
    }
    this.promises.set(key, promise)
    return promise
  }

  destroy() {
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
