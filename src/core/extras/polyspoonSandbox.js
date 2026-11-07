import 'ses'

// This module runs only inside a dedicated worker, never in the world process.
globalThis.lockdown({ overrideTaming: 'severe', errorTaming: 'unsafe' })
const typedArrays = globalThis.harden({ Float32Array, Float64Array })

export function runSandboxedRecipe(source, parameters) {
  if (
    typeof source !== 'string' ||
    source.length > 512000 ||
    typeof parameters !== 'string' ||
    parameters.length > 65536
  )
    throw new Error('Recipe input exceeds the sandbox limits')
  const compartment = new globalThis.Compartment(typedArrays)
  // The bundled Three.js implementation runs inside the compartment. No world
  // objects, host functions, network, filesystem or module loader are endowed.
  const program = `
    (function () {
      // Three.js can warn about harmless operations; never expose the host console.
      const console = Object.freeze({ log() {}, info() {}, warn() {}, error() {}, debug() {} });
      const intrinsicMath = globalThis.Math;
      const Math = Object.create(intrinsicMath);
      let seed = 127394;
      Object.defineProperty(Math, 'random', { value: () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) });
      const structuredClone = value => JSON.parse(JSON.stringify(value));
      ${source}
      const recipe = PolyspoonRecipe;
      if (!recipe || typeof recipe.createAsset !== 'function' || typeof recipe.disposeAsset !== 'function' ||
          !Array.isArray(recipe.metadata?.controls) || recipe.metadata.controls.length > 256)
        throw Error('Invalid Polyspoon recipe exports');
      const object = recipe.createAsset(JSON.parse(${JSON.stringify(parameters)}));
      try {
        if (!object?.isObject3D || !object.userData?.design?.applied) throw Error('Invalid recipe object');
        object.updateMatrixWorld(true);
        const inverse = object.matrixWorld.clone().invert();
        const meshes = [], textures = [], textureIds = new Map();
        let vertices = 0, indices = 0, textureBytes = 0;
        const encode = bytes => {
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          let chunks = [], part = '';
          for (let i = 0; i < bytes.length; i += 3) {
            const n = (bytes[i] << 16) | ((bytes[i+1] || 0) << 8) | (bytes[i+2] || 0);
            part += alphabet[n >> 18] + alphabet[(n >> 12) & 63] + (i+1 < bytes.length ? alphabet[(n >> 6) & 63] : '=') + (i+2 < bytes.length ? alphabet[n & 63] : '=');
            if (part.length >= 8192) { chunks.push(part); part = ''; }
          }
          chunks.push(part); return chunks.join('');
        };
        const texture = value => {
          if (!value) return null;
          if (textureIds.has(value)) return textureIds.get(value);
          const image = value.image;
          if (!value.isDataTexture || !image || !(image.data instanceof Uint8Array) ||
              !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 ||
              image.width > 2048 || image.height > 2048 || image.data.length !== image.width * image.height * 4 ||
              value.format !== 1023 || value.type !== 1009) throw Error('Unsupported recipe texture');
          const width = image.width, height = image.height, pixels = image.data;
          textureBytes += pixels.length;
          if (textureBytes > 32000000 || textures.length >= 64) throw Error('Recipe textures exceed limits');
          const id = textures.length; textureIds.set(value, id);
          textures.push({width, height, data:encode(pixels), colorSpace:value.colorSpace,
            wrapS:value.wrapS, wrapT:value.wrapT, repeat:value.repeat.toArray(), offset:value.offset.toArray(),
            center:value.center.toArray(), rotation:value.rotation, flipY:value.flipY});
          return id;
        };
        object.traverse(mesh => {
          if (!mesh.isMesh) return;
          if (meshes.length >= 512) throw Error('Unsupported recipe mesh');
          const geometry = mesh.geometry;
          if (!geometry?.isBufferGeometry) throw Error('Unsupported recipe geometry');
          const position = geometry.getAttribute('position');
          if (!position || position.itemSize !== 3 || position.count < 1) throw Error('Recipe mesh has invalid positions');
          vertices += position.count;
          const index = geometry.getIndex();
          indices += index ? index.count : position.count;
          if (vertices > 250000 || indices > 1000000) throw Error('Recipe geometry exceeds limits');
          const read = (name, size) => {
            const attr = geometry.getAttribute(name);
            if (!attr) return null;
            if (attr.count !== position.count || attr.itemSize !== size) throw Error('Invalid recipe attribute');
            const values = [];
            for (let i = 0; i < attr.count; i++) {
              values.push(attr.getX(i), attr.getY(i));
              if (size >= 3) values.push(attr.getZ(i));
            }
            return values;
          };
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const groups = Array.isArray(mesh.material) ? geometry.groups : [{start:0,count:index ? index.count : position.count,materialIndex:0}];
          if (!groups.length || meshes.length + groups.length > 512) throw Error('Unsupported recipe material groups');
          const allFaces = index ? Array.from({length:index.count}, (_, i) => index.getX(i)) : Array.from({length:position.count}, (_,i)=>i);
          const positions = read('position', 3), normals = read('normal', 3), uvs = read('uv', 2), colors = read('color', 3);
          for (const group of groups) {
            const material = materials[group.materialIndex];
            if (!material || !['MeshBasicMaterial','MeshStandardMaterial','MeshPhysicalMaterial'].includes(material.type) ||
                !Number.isInteger(group.start) || !Number.isInteger(group.count) || group.start < 0 || group.count < 1 ||
                group.count % 3 || group.start + group.count > allFaces.length) throw Error('Unsupported recipe material group');
            const maps = {};
            for (const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap']) maps[key] = texture(material[key]);
            for (const [key,value] of Object.entries(material)) if (value?.isTexture && !(key in maps)) throw Error('Unsupported recipe texture map');
            meshes.push({
              name: String(mesh.name || '').slice(0, 160), matrix: inverse.clone().multiply(mesh.matrixWorld).toArray(),
              positions, normals, uvs, colors,
              indices: !index && !Array.isArray(mesh.material) ? null : allFaces.slice(group.start, group.start + group.count),
              material: {
                type: material.type, color: material.color?.getHex(), opacity: material.opacity,
                transparent: material.transparent, side: material.side, wireframe: material.wireframe,
                vertexColors: material.vertexColors, flatShading: material.flatShading,
                roughness: material.roughness, metalness: material.metalness,
                emissive: material.emissive?.getHex(), emissiveIntensity: material.emissiveIntensity,
                normalScale: material.normalScale?.toArray(), clearcoat:material.clearcoat, clearcoatRoughness:material.clearcoatRoughness,
                sheen:material.sheen, sheenRoughness:material.sheenRoughness, sheenColor:material.sheenColor?.getHex(), maps,
              }
            });
          }
        });
        return JSON.stringify({ meshes, textures, controls: recipe.metadata.controls, applied: object.userData.design.applied });
      } finally { recipe.disposeAsset(object); }
    })()
  `
  const output = compartment.evaluate(program)
  if (typeof output !== 'string' || output.length > 48000000) throw new Error('Recipe output exceeds sandbox limits')
  return output
}
