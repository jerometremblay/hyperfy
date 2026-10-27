import * as THREE from 'three'

// Shared geometry: the comparison and world-2d start from the same village.
export function createVillage() {
  const village = new THREE.Group()
  const obstacles = []
  const water = []
  const lanterns = []
  const materialCache = new Map()
  const boxGeometry = new THREE.BoxGeometry()
  function material(color, flat = false) {
    const key = `${color}:${flat}`
    if (!materialCache.has(key))
      materialCache.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.95,
          flatShading: flat,
        })
      )
    return materialCache.get(key)
  }
  function box(group, x, y, z, width, height, depth, color) {
    const object = new THREE.Mesh(boxGeometry, material(color))
    object.position.set(x, y, z)
    object.scale.set(width, height, depth)
    object.castShadow = height > 0.1
    object.receiveShadow = true
    group.add(object)
    return object
  }
  function seeded(n) {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return value - Math.floor(value)
  }
  // A floating slice keeps the composition readable without requiring production assets.
  box(village, 0, -0.65, 0, 18, 1.25, 15, '#53624b')
  box(village, 0, -1.45, 0, 17.3, 0.4, 14.3, '#374c42')
  box(village, -1.9, 0, 0, 14.2, 0.12, 15, '#759052')
  box(village, 7.75, 0, 0, 2.5, 0.12, 15, '#819654')
  box(village, 5.3, -0.05, 0, 2.0, 0.06, 15, '#2d777d')
  for (let i = 0; i < 35; i++) {
    const ripple = box(
      village,
      4.45 + seeded(i) * 1.6,
      0.001,
      -7 + seeded(i + 80) * 14,
      0.1 + seeded(i + 200) * 0.6,
      0.018,
      0.055,
      i % 2 ? '#87bdac' : '#589f9f'
    )
    water.push(ripple)
  }
  for (let i = 0; i < 140; i++) {
    const x = -8.5 + seeded(i + 13) * 17
    const z = -7.1 + seeded(i + 28) * 14
    if (x > 4.2 && x < 6.45) continue
    box(village, x, 0.075, z, 0.1 + seeded(i + 3) * 0.35, 0.03, 0.1, i % 3 === 0 ? '#a4b66b' : '#668448')
  }
  // Cobblestone route through the village and across the river.
  for (let z = -6.5; z < 7; z += 0.5) {
    for (let x = -1.25; x < 1.25; x += 0.5) {
      box(village, x, 0.1, z, 0.47, 0.07, 0.47, seeded(z * 8 + x) > 0.5 ? '#b8b38b' : '#a6a787')
    }
  }
  for (let x = 1; x < 8.5; x += 0.5) {
    for (let z = 2; z < 4; z += 0.5) {
      if (x > 4 && x < 6.5) continue
      box(village, x, 0.1, z, 0.47, 0.07, 0.47, '#b3b28b')
    }
  }
  box(village, 5.3, 0.25, 2.75, 2.8, 0.35, 2.4, '#b4af91')
  for (const z of [1.6, 3.9]) {
    box(village, 5.3, 0.75, z, 2.8, 0.2, 0.16, '#c6c0a1')
    for (const x of [4, 4.7, 5.4, 6.6]) box(village, x, 0.47, z, 0.17, 0.7, 0.17, '#929980')
  }
  for (let i = 0; i < 12; i++)
    box(village, 4.35 + i * 0.16, -0.7, 7.53, 0.12, 1.3 + seeded(i) * 0.5, 0.1, i % 2 ? '#a5d1c3' : '#6daaa2')

  function cottage(x, z, color, angle = 0) {
    const group = new THREE.Group()
    group.position.set(x, 0.1, z)
    group.rotation.y = angle
    village.add(group)
    box(group, 0, 0.12, 0, 3.6, 0.25, 3.25, '#9b9f7c')
    box(group, 0, 1.1, 0, 3.15, 1.95, 2.7, '#dbc8a1')
    for (const cx of [-1.52, 1.52]) {
      for (const cz of [-1.3, 1.3]) box(group, cx, 1.1, cz, 0.15, 2.05, 0.15, '#655c45')
    }
    box(group, 0, 1.58, 1.36, 3.1, 0.1, 0.1, '#7b6850')
    box(group, 0.45, 0.69, 1.38, 0.6, 1.25, 0.12, '#5b6558')
    const glass = new THREE.MeshStandardMaterial({ color: '#ffe4a0', emissive: '#ffa33d', emissiveIntensity: 0.5 })
    const window = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.08), glass)
    window.position.set(-0.78, 1.19, 1.39)
    group.add(window)
    lanterns.push(glass)
    box(group, -0.78, 1.19, 1.45, 0.06, 0.7, 0.07, '#625b44')
    box(group, -0.78, 1.19, 1.45, 0.7, 0.06, 0.07, '#625b44')
    // Stepped roof silhouettes intentionally keep the block pattern legible.
    for (let i = 0; i < 7; i++) {
      box(group, 0, 2.12 + i * 0.16, 0, 3.8, 0.18, 3.45 - i * 0.43, color)
    }
    box(group, 0.85, 2.85, -0.45, 0.38, 1.05, 0.45, '#aaa185')
    obstacles.push({ x, z, radius: 2.05 })
  }
  cottage(-4.8, 0.2, '#bc7653', 0.04)
  cottage(-4.3, -4.4, '#677f79', -0.12)
  cottage(2.5, -4.5, '#9b8151', -0.05)

  function tree(x, z, scale = 1) {
    const group = new THREE.Group()
    group.position.set(x, 0.06, z)
    group.scale.setScalar(scale)
    village.add(group)
    box(group, 0, 0.7, 0, 0.26, 1.4, 0.26, '#79664b')
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.0 - i * 0.22, 1.55, 5),
        material(['#466c4f', '#557b50', '#6b8a54'][i], true)
      )
      cone.position.y = 1.2 + i * 0.6
      cone.rotation.y = Math.PI / 4
      cone.castShadow = true
      group.add(cone)
    }
    obstacles.push({ x, z, radius: 0.45 })
  }
  for (const [x, z, scale] of [
    [-7.5, -5.9, 1.25],
    [-7.6, -3.8, 1.1],
    [-7.9, 2.5, 1.3],
    [-6.6, 5.8, 0.9],
    [-3.8, 6.0, 0.75],
    [7.6, -5, 1.1],
    [7.7, -2.5, 1.25],
    [8, 5.7, 1.0],
  ])
    tree(x, z, scale)
  // Ruined gate and a little kitchen garden.
  for (const x of [-1.15, 1.15]) {
    box(village, x, 1.65, -5.7, 0.6, 3.3, 0.75, '#929d84')
    box(village, x, 3.31, -5.7, 0.83, 0.25, 0.95, '#bbc2a0')
    obstacles.push({ x, z: -5.7, radius: 0.5 })
  }
  box(village, 0, 3.65, -5.7, 3.1, 0.48, 0.85, '#a7b295')
  box(village, 0, 3.95, -5.7, 2.5, 0.15, 1.0, '#6e8e57')
  box(village, -3.4, 0.11, 3.6, 2.5, 0.11, 1.8, '#69583e')
  for (let i = 0; i < 16; i++) {
    const x = -4.4 + (i % 4) * 0.6
    const z = 3.05 + Math.floor(i / 4) * 0.35
    box(village, x, 0.25, z, 0.18, 0.3, 0.18, i % 2 ? '#a8b54a' : '#d5a155')
  }
  for (let i = 0; i < 42; i++) {
    const x = -8 + seeded(i + 90) * 16
    const z = -7 + seeded(i + 230) * 14
    if (Math.abs(x) < 1.5 || (x > 4 && x < 6.6)) continue
    box(village, x, 0.16, z, 0.07, 0.22, 0.07, '#52764c')
    box(village, x, 0.29, z, 0.16, 0.08, 0.16, i % 3 ? '#eed295' : '#d4988a')
  }

  return { village, obstacles, water, lanterns, box }
}
