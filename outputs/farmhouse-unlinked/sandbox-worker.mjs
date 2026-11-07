// src/server/polyspoonNodeWorker.js
import { parentPort } from "node:worker_threads";

// src/core/extras/polyspoonSandbox.js
import "ses";
globalThis.lockdown({ overrideTaming: "severe", errorTaming: "unsafe" });
var typedArrays = globalThis.harden({ Float32Array, Float64Array });
function runSandboxedRecipe(source, parameters) {
  if (typeof source !== "string" || source.length > 512e3 || typeof parameters !== "string" || parameters.length > 65536)
    throw new Error("Recipe input exceeds the sandbox limits");
  const compartment = new globalThis.Compartment(typedArrays);
  const program = `
    (function () {
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
        const meshes = [];
        let vertices = 0, indices = 0;
        object.traverse(mesh => {
          if (!mesh.isMesh) return;
          if (meshes.length >= 512 || Array.isArray(mesh.material)) throw Error('Unsupported recipe mesh');
          const geometry = mesh.geometry, material = mesh.material;
          if (!geometry?.isBufferGeometry || !material || !['MeshBasicMaterial','MeshStandardMaterial'].includes(material.type))
            throw Error('Unsupported recipe geometry or material');
          if (Object.values(material).some(value => value && value.isTexture)) throw Error('Recipe textures are not supported');
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
          const faces = index ? Array.from({length:index.count}, (_, i) => index.getX(i)) : null;
          meshes.push({
            name: String(mesh.name || '').slice(0, 160),
            matrix: inverse.clone().multiply(mesh.matrixWorld).toArray(),
            positions: read('position', 3), normals: read('normal', 3), uvs: read('uv', 2), colors: read('color', 3),
            indices: faces,
            material: {
              type: material.type, color: material.color?.getHex(), opacity: material.opacity,
              transparent: material.transparent, side: material.side, wireframe: material.wireframe,
              vertexColors: material.vertexColors, flatShading: material.flatShading,
              roughness: material.roughness, metalness: material.metalness,
              emissive: material.emissive?.getHex(), emissiveIntensity: material.emissiveIntensity,
            }
          });
        });
        return JSON.stringify({ meshes, controls: recipe.metadata.controls, applied: object.userData.design.applied });
      } finally { recipe.disposeAsset(object); }
    })()
  `;
  const output = compartment.evaluate(program);
  if (typeof output !== "string" || output.length > 32e6) throw new Error("Recipe output exceeds sandbox limits");
  return output;
}

// src/server/polyspoonNodeWorker.js
parentPort.on("message", (data) => {
  try {
    parentPort.postMessage({ result: runSandboxedRecipe(data.source, data.parameters) });
  } catch (error) {
    parentPort.postMessage({ error: String(error?.message || "Recipe failed") });
  }
});
