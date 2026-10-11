import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [new URL('./ClientGraphics.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientGraphics } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

for (const mode of ['direct', 'composer', 'xr', 'exception']) {
  test(`${mode} rendering applies the shadow budget and restores requested flags and tone mapping`, () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    const material = new THREE.MeshStandardMaterial({ map: new THREE.Texture() })
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material))
    const lights = Array.from({ length: 16 }, () => {
      const light = new THREE.PointLight()
      light.castShadow = true
      scene.add(light)
      return light
    })
    let rendered = false
    const draw = () => {
      assert.equal(lights.filter(light => light.castShadow).length, 15)
      rendered = true
      if (mode === 'exception') throw new Error('render failed')
    }
    const graphics = new ClientGraphics({ stage: { scene }, camera })
    graphics.renderer = {
      shadowMap: { enabled: true },
      capabilities: { maxTextures: 16 },
      xr: { isPresenting: mode === 'xr' },
      toneMapping: THREE.NoToneMapping,
      render: draw,
    }
    graphics.usePostprocessing = mode !== 'direct'
    graphics.composer = { render: draw }
    if (mode === 'exception') assert.throws(() => graphics.render(), /render failed/)
    else graphics.render()
    assert.ok(rendered)
    assert.ok(lights.every(light => light.castShadow))
    assert.equal(graphics.renderer.toneMapping, THREE.NoToneMapping)
  })
}
