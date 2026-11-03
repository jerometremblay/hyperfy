import { runSandboxedRecipe } from './polyspoonSandbox'

self.onmessage = event => {
  try {
    self.postMessage({ result: runSandboxedRecipe(event.data.source, event.data.parameters) })
  } catch (error) {
    self.postMessage({ error: String(error?.message || 'Recipe failed') })
  }
}
