// outputs/polyspoon-sofa/sofa.source.mjs
import * as THREE from "three";

// node_modules/three/examples/jsm/utils/BufferGeometryUtils.js
import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  TrianglesDrawMode,
  Vector3
} from "three";
function mergeVertices(geometry, tolerance = 1e-4) {
  tolerance = Math.max(tolerance, Number.EPSILON);
  const hashToIndex = {};
  const indices = geometry.getIndex();
  const positions = geometry.getAttribute("position");
  const vertexCount = indices ? indices.count : positions.count;
  let nextIndex = 0;
  const attributeNames = Object.keys(geometry.attributes);
  const tmpAttributes = {};
  const tmpMorphAttributes = {};
  const newIndices = [];
  const getters = ["getX", "getY", "getZ", "getW"];
  const setters = ["setX", "setY", "setZ", "setW"];
  for (let i = 0, l = attributeNames.length; i < l; i++) {
    const name = attributeNames[i];
    const attr = geometry.attributes[name];
    tmpAttributes[name] = new attr.constructor(
      new attr.array.constructor(attr.count * attr.itemSize),
      attr.itemSize,
      attr.normalized
    );
    const morphAttributes = geometry.morphAttributes[name];
    if (morphAttributes) {
      if (!tmpMorphAttributes[name]) tmpMorphAttributes[name] = [];
      morphAttributes.forEach((morphAttr, i2) => {
        const array = new morphAttr.array.constructor(morphAttr.count * morphAttr.itemSize);
        tmpMorphAttributes[name][i2] = new morphAttr.constructor(array, morphAttr.itemSize, morphAttr.normalized);
      });
    }
  }
  const halfTolerance = tolerance * 0.5;
  const exponent = Math.log10(1 / tolerance);
  const hashMultiplier = Math.pow(10, exponent);
  const hashAdditive = halfTolerance * hashMultiplier;
  for (let i = 0; i < vertexCount; i++) {
    const index = indices ? indices.getX(i) : i;
    let hash = "";
    for (let j = 0, l = attributeNames.length; j < l; j++) {
      const name = attributeNames[j];
      const attribute = geometry.getAttribute(name);
      const itemSize = attribute.itemSize;
      for (let k = 0; k < itemSize; k++) {
        hash += `${Math.trunc(attribute[getters[k]](index) * hashMultiplier + hashAdditive)},`;
      }
    }
    if (hash in hashToIndex) {
      newIndices.push(hashToIndex[hash]);
    } else {
      for (let j = 0, l = attributeNames.length; j < l; j++) {
        const name = attributeNames[j];
        const attribute = geometry.getAttribute(name);
        const morphAttributes = geometry.morphAttributes[name];
        const itemSize = attribute.itemSize;
        const newArray = tmpAttributes[name];
        const newMorphArrays = tmpMorphAttributes[name];
        for (let k = 0; k < itemSize; k++) {
          const getterFunc = getters[k];
          const setterFunc = setters[k];
          newArray[setterFunc](nextIndex, attribute[getterFunc](index));
          if (morphAttributes) {
            for (let m = 0, ml = morphAttributes.length; m < ml; m++) {
              newMorphArrays[m][setterFunc](nextIndex, morphAttributes[m][getterFunc](index));
            }
          }
        }
      }
      hashToIndex[hash] = nextIndex;
      newIndices.push(nextIndex);
      nextIndex++;
    }
  }
  const result = geometry.clone();
  for (const name in geometry.attributes) {
    const tmpAttribute = tmpAttributes[name];
    result.setAttribute(name, new tmpAttribute.constructor(
      tmpAttribute.array.slice(0, nextIndex * tmpAttribute.itemSize),
      tmpAttribute.itemSize,
      tmpAttribute.normalized
    ));
    if (!(name in tmpMorphAttributes)) continue;
    for (let j = 0; j < tmpMorphAttributes[name].length; j++) {
      const tmpMorphAttribute = tmpMorphAttributes[name][j];
      result.morphAttributes[name][j] = new tmpMorphAttribute.constructor(
        tmpMorphAttribute.array.slice(0, nextIndex * tmpMorphAttribute.itemSize),
        tmpMorphAttribute.itemSize,
        tmpMorphAttribute.normalized
      );
    }
  }
  result.setIndex(newIndices);
  return result;
}
function toCreasedNormals(geometry, creaseAngle = Math.PI / 3) {
  const resultGeometry = geometry.index ? geometry.toNonIndexed() : geometry;
  const posAttr = resultGeometry.attributes.position;
  const vertexCount = posAttr.count;
  let positions;
  if (posAttr.isBufferAttribute === true && posAttr.itemSize === 3 && posAttr.normalized === false) {
    positions = posAttr.array;
  } else {
    positions = new Float64Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      positions[3 * i + 0] = posAttr.getX(i);
      positions[3 * i + 1] = posAttr.getY(i);
      positions[3 * i + 2] = posAttr.getZ(i);
    }
  }
  const creaseDot = Math.cos(creaseAngle);
  const hashMultiplier = (1 + 1e-10) * 100;
  const faceCount = vertexCount / 3;
  const faceNormals = new Float64Array(faceCount * 3);
  for (let f = 0; f < faceCount; f++) {
    const f9 = 9 * f;
    const ax = positions[f9 + 0], ay = positions[f9 + 1], az = positions[f9 + 2];
    const bx = positions[f9 + 3], by = positions[f9 + 4], bz = positions[f9 + 5];
    const cx = positions[f9 + 6], cy = positions[f9 + 7], cz = positions[f9 + 8];
    const v1x = cx - bx, v1y = cy - by, v1z = cz - bz;
    const v2x = ax - bx, v2y = ay - by, v2z = az - bz;
    const nx = v1y * v2z - v1z * v2y;
    const ny = v1z * v2x - v1x * v2z;
    const nz = v1x * v2y - v1y * v2x;
    const invLength = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
    faceNormals[3 * f + 0] = nx * invLength;
    faceNormals[3 * f + 1] = ny * invLength;
    faceNormals[3 * f + 2] = nz * invLength;
  }
  const vertexIds = new Int32Array(vertexCount);
  const quantized = new Float64Array(vertexCount * 3);
  let tableSize = 1;
  while (tableSize < vertexCount * 2) tableSize <<= 1;
  const tableMask = tableSize - 1;
  const table = new Int32Array(tableSize);
  let uniqueCount = 0;
  for (let i = 0; i < vertexCount; i++) {
    const i3 = 3 * i;
    const qx = Math.trunc(positions[i3 + 0] * hashMultiplier);
    const qy = Math.trunc(positions[i3 + 1] * hashMultiplier);
    const qz = Math.trunc(positions[i3 + 2] * hashMultiplier);
    let slot = (Math.imul(qx, 73856093) ^ Math.imul(qy, 19349663) ^ Math.imul(qz, 83492791)) & tableMask;
    while (true) {
      const id = table[slot];
      if (id === 0) {
        const q32 = 3 * uniqueCount;
        quantized[q32 + 0] = qx;
        quantized[q32 + 1] = qy;
        quantized[q32 + 2] = qz;
        table[slot] = uniqueCount + 1;
        vertexIds[i] = uniqueCount++;
        break;
      }
      const q3 = 3 * (id - 1);
      if (quantized[q3 + 0] === qx && quantized[q3 + 1] === qy && quantized[q3 + 2] === qz) {
        vertexIds[i] = id - 1;
        break;
      }
      slot = slot + 1 & tableMask;
    }
  }
  const bucketOffsets = new Int32Array(uniqueCount + 1);
  for (let i = 0; i < vertexCount; i++) bucketOffsets[vertexIds[i] + 1]++;
  for (let i = 0; i < uniqueCount; i++) bucketOffsets[i + 1] += bucketOffsets[i];
  const bucketFaces = new Int32Array(vertexCount);
  const bucketCursors = bucketOffsets.slice(0, uniqueCount);
  for (let f = 0; f < faceCount; f++) {
    const f3 = 3 * f;
    bucketFaces[bucketCursors[vertexIds[f3 + 0]]++] = f;
    bucketFaces[bucketCursors[vertexIds[f3 + 1]]++] = f;
    bucketFaces[bucketCursors[vertexIds[f3 + 2]]++] = f;
  }
  const normalArray = new Float32Array(vertexCount * 3);
  for (let f = 0; f < faceCount; f++) {
    const f3 = 3 * f;
    const nx = faceNormals[f3 + 0];
    const ny = faceNormals[f3 + 1];
    const nz = faceNormals[f3 + 2];
    for (let n = 0; n < 3; n++) {
      const i = f3 + n;
      const id = vertexIds[i];
      let sumX = 0, sumY = 0, sumZ = 0;
      for (let k = bucketOffsets[id], end = bucketOffsets[id + 1]; k < end; k++) {
        const o3 = 3 * bucketFaces[k];
        const ox = faceNormals[o3 + 0];
        const oy = faceNormals[o3 + 1];
        const oz = faceNormals[o3 + 2];
        if (nx * ox + ny * oy + nz * oz > creaseDot) {
          sumX += ox;
          sumY += oy;
          sumZ += oz;
        }
      }
      const invLength = 1 / (Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ) || 1);
      normalArray[3 * i + 0] = sumX * invLength;
      normalArray[3 * i + 1] = sumY * invLength;
      normalArray[3 * i + 2] = sumZ * invLength;
    }
  }
  resultGeometry.setAttribute("normal", new BufferAttribute(normalArray, 3, false));
  return resultGeometry;
}

// outputs/polyspoon-sofa/sofa.source.mjs
var metadata = {
  id: "cognac-leather-sofa",
  version: "1.1.0",
  title: "Cognac leather sofa",
  description: "Beveled leather sofa adapted from the Hyperfy three-seat app.",
  controls: [
    { key: "seatCount", label: "Seats", kind: "integer", group: "construction", unit: "count", min: 1, max: 5, step: 1, default: 3, hint: "Number of cushions and seats.", affects: ["topology"], targets: ["seat", "back"] },
    { key: "seatWidth", label: "Seat width", kind: "range", group: "shape", unit: "m", min: 0.55, max: 0.95, step: 0.01, default: 0.7, hint: "Width of each cushion in metres.", affects: ["geometry"], targets: ["seat", "back"] },
    { key: "seatDepth", label: "Seat cushion depth", kind: "range", group: "shape", unit: "m", min: 0.55, max: 0.75, step: 0.01, default: 0.66, hint: "Depth of the seat cushion extrusion.", affects: ["geometry"], targets: ["seat"] },
    { key: "backDepth", label: "Back cushion depth", kind: "range", group: "shape", unit: "m", min: 0.16, max: 0.28, step: 0.01, default: 0.22, hint: "Depth of the back cushion extrusion.", affects: ["geometry"], targets: ["back"] },
    { key: "armDepth", label: "Arm depth", kind: "range", group: "shape", unit: "m", min: 0.75, max: 0.95, step: 0.01, default: 0.84, hint: "Depth of the arm extrusion.", affects: ["geometry"], targets: ["arms"] },
    { key: "seatRadius", label: "Seat corner radius", kind: "range", group: "shape", unit: "m", min: 0.05, max: 0.1, step: 0.01, default: 0.08, hint: "Roundness of the seat cushion profile.", affects: ["geometry"], targets: ["seat"] },
    { key: "backRadius", label: "Back corner radius", kind: "range", group: "shape", unit: "m", min: 0.05, max: 0.12, step: 0.01, default: 0.09, hint: "Roundness of the back cushion profile.", affects: ["geometry"], targets: ["back"] },
    { key: "armRadius", label: "Arm corner radius", kind: "range", group: "shape", unit: "m", min: 0.05, max: 0.11, step: 0.01, default: 0.09, hint: "Roundness of the arm profile.", affects: ["geometry"], targets: ["arms"] },
    { key: "bevelSize", label: "Bevel size (mm)", kind: "integer", group: "shape", unit: "mm", min: 2, max: 22, step: 1, default: 20, hint: "Seat cushion bevel size; other panels scale proportionally.", affects: ["geometry"], targets: ["seat", "back", "arms"] },
    { key: "bevelThickness", label: "Bevel depth (mm)", kind: "integer", group: "shape", unit: "mm", min: 2, max: 25, step: 1, default: 18, hint: "Seat cushion bevel depth; other panels scale proportionally.", affects: ["geometry"], targets: ["seat", "back", "arms"] },
    { key: "color.leather", label: "Leather", kind: "color", group: "colors", unit: "color", default: "#8a4f2b", role: "leather", hint: "Arms and all cushions.", affects: ["material"], targets: ["arms", "seat", "back"] },
    { key: "color.leatherDark", label: "Dark leather", kind: "color", group: "colors", unit: "color", default: "#6d3b22", role: "leatherDark", hint: "Base and seams.", affects: ["material"], targets: ["base"] },
    { key: "color.piping", label: "Piping", kind: "color", group: "colors", unit: "color", default: "#b8774b", role: "piping", hint: "Piping and stitching.", affects: ["material"], targets: ["piping"] },
    { key: "color.wood", label: "Feet", kind: "color", group: "colors", unit: "color", default: "#2b1b13", role: "wood", hint: "Wooden feet.", affects: ["material"], targets: ["feet"] }
  ],
  presets: [{ id: "three-seat", name: "Three-seat sofa", description: "Original cognac leather sofa.", parameters: {} }],
  palettes: []
};
metadata.defaults = Object.fromEntries(metadata.controls.map((control) => [control.key, control.default]));
function createAsset(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object of sofa parameters");
  const keys = new Set(metadata.controls.map((control) => control.key));
  if (Object.keys(input).some((key) => !keys.has(key))) throw new Error("Unknown sofa parameter");
  const applied = { ...metadata.defaults, ...input };
  for (const control of metadata.controls) {
    const value = applied[control.key];
    if (control.kind === "color" ? typeof value !== "string" || !/^#[a-f0-9]{6}$/i.test(value) : typeof value !== "number" || !Number.isFinite(value) || value < control.min || value > control.max || control.kind === "integer" && !Number.isInteger(value)) {
      throw new Error("Invalid sofa parameter: " + control.key);
    }
  }
  const SEAT_COUNT = applied.seatCount;
  const C = Object.fromEntries(["leather", "leatherDark", "piping", "wood"].map((role) => [role, { value: applied["color." + role], role }]));
  const root = new THREE.Group();
  root.name = "cognac-leather-sofa";
  root.userData.design = { formatVersion: 1, family: metadata.id, familyVersion: metadata.version, requested: { ...input }, applied: { ...applied } };
  function addPrim(parent, type, props = {}) {
    let geometry;
    if (type === "box") geometry = new THREE.BoxGeometry(...props.size);
    else if (type === "cylinder") geometry = new THREE.CylinderGeometry(...props.size, 20);
    else if (type === "extrude") {
      const shape = new THREE.Shape();
      shape.moveTo(...props.profile[0]);
      for (const point of props.profile.slice(1)) shape.lineTo(...point);
      shape.closePath();
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: props.depth,
        bevelEnabled: props.bevelEnabled,
        bevelThickness: props.bevelThickness,
        bevelSize: props.bevelSize,
        bevelSegments: props.bevelSegments,
        curveSegments: props.curveSegments
      });
      if (props.smooth) {
        const merged = mergeVertices(geometry);
        geometry.dispose();
        geometry = toCreasedNormals(merged, props.creaseAngle ?? Math.PI / 3);
        merged.dispose();
      }
      geometry.center();
    } else throw new Error("Unsupported sofa geometry: " + type);
    const material = new THREE.MeshStandardMaterial({ color: props.color.value, roughness: props.roughness ?? 0.5, metalness: props.metalness ?? 0.02 });
    const node = new THREE.Mesh(geometry, material);
    node.userData.materialRole = props.color.role;
    node.position.fromArray(props.position || [0, 0, 0]);
    node.rotation.fromArray(props.rotation || [0, 0, 0]);
    node.castShadow = props.castShadow !== false;
    node.receiveShadow = props.receiveShadow !== false;
    (parent || root).add(node);
    return node;
  }
  function box(parent, size, position, color, rotation = [0, 0, 0], extra = {}) {
    return addPrim(parent, "box", { size, position, color, rotation, ...extra });
  }
  function cylinder(parent, radius, height, position, color, rotation = [0, 0, 0], extra = {}) {
    return addPrim(parent, "cylinder", { size: [radius, radius, height], position, color, rotation, ...extra });
  }
  function extrudePrim(parent, profile, depth, position, color, rotation = [0, 0, 0], extra = {}) {
    return addPrim(parent, "extrude", {
      profile,
      depth,
      position,
      color,
      rotation,
      curveSegments: extra.curveSegments ?? 10,
      bevelEnabled: extra.bevelEnabled ?? true,
      bevelSize: extra.bevelSize ?? 0.018,
      bevelThickness: extra.bevelThickness ?? 0.016,
      bevelSegments: extra.bevelSegments ?? 4,
      smooth: extra.smooth ?? true,
      creaseAngle: extra.creaseAngle ?? Math.PI / 3,
      ...extra
    });
  }
  function group(position = [0, 0, 0], rotation = [0, 0, 0]) {
    const node = new THREE.Group();
    node.position.fromArray(position);
    node.rotation.fromArray(rotation);
    root.add(node);
    return node;
  }
  function roundedRectProfile(w, h, r, seg = 6) {
    const pts = [];
    function arc(cx, cy, a0, a1, includeStart = false) {
      for (let i = includeStart ? 0 : 1; i <= seg; i++) {
        const t = a0 + (a1 - a0) * (i / seg);
        pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
      }
    }
    arc(w / 2 - r, -h / 2 + r, -Math.PI / 2, 0, true);
    arc(w / 2 - r, h / 2 - r, 0, Math.PI / 2);
    arc(-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI);
    arc(-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5);
    return pts;
  }
  function pipingFront(parent, w, h, d, r, color = C.piping) {
    const z = -d / 2 - 0.01;
    const rr = 8e-3;
    const horizontal = w - 2 * r;
    const vertical = h - 2 * r;
    const y = h / 2 - r;
    const x = w / 2 - r;
    cylinder(parent, rr, horizontal, [0, y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 });
    cylinder(parent, rr, horizontal, [0, -y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 });
    cylinder(parent, rr, vertical, [x, 0, z], color, [0, 0, 0], { roughness: 0.58 });
    cylinder(parent, rr, vertical, [-x, 0, z], color, [0, 0, 0], { roughness: 0.58 });
  }
  function extrudedRoundedPanel(position, rotation, size, radius, color, options = {}) {
    const g = group(position, rotation);
    const bevelSize = (options.bevelSize ?? 0.018) * (applied.bevelSize / 20);
    const bevelThickness = (options.bevelThickness ?? 0.016) * (applied.bevelThickness / 18);
    extrudePrim(g, roundedRectProfile(size[0], size[1], radius, options.profileSegs ?? 7), size[2], [0, 0, 0], color, [0, 0, 0], {
      roughness: options.roughness ?? 0.46,
      bevelEnabled: true,
      bevelSize,
      bevelThickness,
      bevelSegments: options.bevelSegments ?? 4,
      curveSegments: options.curveSegments ?? 10
    });
    if (options.piping !== false) pipingFront(g, size[0], size[1], size[2], radius);
    return g;
  }
  function stitchDash(parent, pos, rot = [0, 0, 0], size = [0.025, 6e-3, 6e-3]) {
    box(parent, size, pos, C.piping, rot, { roughness: 0.64, castShadow: false });
  }
  function addArmStitching(x, armD) {
    const frontZ = -armD / 2 - 6e-3;
    const baseY = 0.39;
    for (let i = 0; i < 8; i++) {
      const y = baseY + i * 0.052;
      stitchDash(null, [x, y, frontZ], [0, 0, 0], [6e-3, 0.024, 6e-3]);
    }
    const topY = 0.81;
    for (let i = 0; i < 8; i++) {
      const z = -0.3 + i * 0.085;
      stitchDash(null, [x, topY, z], [Math.PI / 2, 0, 0], [6e-3, 0.024, 6e-3]);
    }
  }
  function buildCouch() {
    const seatW = applied.seatWidth;
    const gap = 8e-3;
    const armW = 0.235;
    const innerW = SEAT_COUNT * seatW + (SEAT_COUNT - 1) * gap;
    const totalW = innerW + armW * 2 + 0.012;
    const leftInner = -innerW / 2;
    const footX = totalW / 2 - 0.16;
    for (const x of [-footX, footX]) {
      for (const z of [-0.285, 0.275]) {
        box(null, [0.13, 0.18, 0.13], [x, 0.09, z], C.wood, [0.02 * Math.sign(z), 0, 0.015 * Math.sign(x)], { roughness: 0.78 });
      }
    }
    box(null, [totalW - 0.02, 0.3, 0.78], [0, 0.3, 0.03], C.leatherDark, [0, 0, 0], { roughness: 0.53 });
    extrudedRoundedPanel([0, 0.38, -0.33], [0, 0, 0], [totalW - 0.04, 0.11, 0.07], 0.035, C.leather, {
      piping: false,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      roughness: 0.5,
      profileSegs: 5
    });
    box(null, [innerW + 0.08, 0.27, 0.18], [0, 0.675, 0.3], C.leatherDark, [0.04, 0, 0], { roughness: 0.55 });
    const armX = innerW / 2 + armW / 2 + 6e-3;
    const armSize = [armW, 0.65, applied.armDepth];
    for (const x of [-armX, armX]) {
      extrudedRoundedPanel([x, 0.56, 0.015], [0, 0, 0], armSize, applied.armRadius, C.leather, {
        piping: false,
        bevelSize: 0.02,
        bevelThickness: 0.018,
        profileSegs: 7,
        roughness: 0.47
      });
      const ag = group([x, 0.56, 0.015], [0, 0, 0]);
      pipingFront(ag, armSize[0], armSize[1], armSize[2], applied.armRadius, C.piping);
      addArmStitching(x, armSize[2]);
    }
    for (let i = 0; i < SEAT_COUNT; i++) {
      const x = leftInner + seatW / 2 + i * (seatW + gap);
      const seatY = 0.545;
      const seatZ = -0.085;
      const seat = extrudedRoundedPanel([x, seatY, seatZ], [0, 0, 0], [seatW + 0.04, 0.21, applied.seatDepth], applied.seatRadius, C.leather, {
        bevelSize: 0.02,
        bevelThickness: 0.018,
        profileSegs: 8,
        roughness: 0.44
      });
      seat.name = `seat-cushion-${i + 1}`;
      const back = extrudedRoundedPanel([x, 0.79, 0.245], [0.14, 0, 0], [seatW + 0.025, 0.51, applied.backDepth], applied.backRadius, C.leather, {
        bevelSize: 0.018,
        bevelThickness: 0.016,
        profileSegs: 8,
        roughness: 0.46
      });
      back.name = `back-cushion-${i + 1}`;
      box(back, [0.018, 0.3, 0.014], [0, -0.015, -applied.backDepth / 2], C.leatherDark, [0, 0, 0], { roughness: 0.62, castShadow: false });
    }
    const seamZ = -0.35;
    cylinder(null, 7e-3, totalW - 0.16, [0, 0.405, seamZ], C.piping, [0, 0, Math.PI / 2], { roughness: 0.62 });
    for (let i = 1; i < SEAT_COUNT; i++) {
      const x = -innerW / 2 + i * seatW + (i - 0.5) * gap;
      cylinder(null, 6e-3, 0.18, [x, 0.285, seamZ], C.piping, [0, 0, 0], { roughness: 0.62 });
    }
    for (let i = 0; i < SEAT_COUNT; i++) {
      const x = leftInner + seatW / 2 + i * (seatW + gap);
      box(null, [seatW + 0.015, 0.04, 0.06], [x, 0.448, -0.345], C.leatherDark, [0, 0, 0], { roughness: 0.68 });
    }
    return totalW;
  }
  buildCouch();
  root.updateMatrixWorld(true);
  return root;
}
function disposeAsset(root) {
  root.traverse((node) => {
    if (node.isMesh) {
      node.geometry.dispose();
      node.material.dispose();
    }
  });
}
export {
  createAsset,
  disposeAsset,
  metadata
};
