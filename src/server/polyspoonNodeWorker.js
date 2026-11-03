import { parentPort } from 'node:worker_threads'
import { runSandboxedRecipe } from '../core/extras/polyspoonSandbox'

parentPort.on('message', data => {
  try {
    parentPort.postMessage({ result: runSandboxedRecipe(data.source, data.parameters) })
  } catch (error) {
    parentPort.postMessage({ error: String(error?.message || 'Recipe failed') })
  }
})
