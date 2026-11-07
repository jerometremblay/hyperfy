// ../../../../private/tmp/polyfork-original.mjs
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
    let hash2 = "";
    for (let j = 0, l = attributeNames.length; j < l; j++) {
      const name = attributeNames[j];
      const attribute = geometry.getAttribute(name);
      const itemSize = attribute.itemSize;
      for (let k = 0; k < itemSize; k++) {
        hash2 += `${Math.trunc(attribute[getters[k]](index) * hashMultiplier + hashAdditive)},`;
      }
    }
    if (hash2 in hashToIndex) {
      newIndices.push(hashToIndex[hash2]);
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
      hashToIndex[hash2] = nextIndex;
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

// ../../../../private/tmp/polyfork-original.mjs
var ORE_KINDS = ["copper", "gold", "iron"];
var params = {
  colorway: {
    type: "choice",
    default: "burlap",
    label: "Colorway",
    options: ["burlap", "dark-hessian", "grey-canvas", "pale-flour"],
    describe: "Cloth and rope colours together: burlap is warm tan sacking with a pale rope, dark-hessian a deep brown sack with a golden rope, grey-canvas a cool grey sack, pale-flour a light sand sack with a dark rope. Ore colours are not changed."
  },
  ore: {
    type: "choice",
    default: "mixed",
    label: "Ore",
    affects: "geometry",
    options: ["mixed", "copper", "iron", "coal", "gold"],
    describe: "What the sack is full of. mixed is a jumble of copper, gold and grey iron lumps; copper, iron and gold make every lump that metal; coal swaps in flatter, slabby, glossy near-black chunks. Lump shape changes with the ore (gold rounder, iron and coal more angular)."
  },
  spill: {
    type: "range",
    default: 0.75,
    min: 0,
    max: 1,
    step: 0.05,
    label: "Spill",
    affects: "geometry",
    describe: "How much ore has overflowed the open top. 0 is a heap mounded just above the crown rim with nothing outside it; higher values roll one then two lumps onto the rim lip and lay a fan on the floor that starts at the foot of the sack and widens; 1 is seven floor lumps out to ~0.33 m in front."
  },
  fullness: {
    type: "range",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    label: "Fullness",
    affects: "geometry",
    describe: "How stuffed the sack is. 0 is a low, wide, slumped sack about 0.58 m tall; 1 is a tall, rounder, packed sack about 0.81 m tall. Rope, crown and lumps keep their size."
  },
  wraps: {
    type: "range",
    default: 2,
    min: 1,
    max: 3,
    step: 1,
    label: "Rope wraps",
    affects: "geometry",
    describe: "Turns of rope round the neck: 1 is a single tie, 3 a thick lashed band."
  },
  harvested: {
    type: "toggle",
    default: false,
    label: "Harvested",
    affects: "geometry",
    describe: "After-state once the ore has been collected: no heap in the top and nothing on the floor; the emptied sack slumps low and wide (about 0.53 m tall) with its dark lining showing in the open top."
  },
  sack: { type: "color", default: "#b39a78", label: "Sack", describe: "The burlap cloth of the body and crown." },
  lining: { type: "color", default: "#8d6644", label: "Lining", describe: "Inside of the sack, seen in the open top between the lumps." },
  rope: { type: "color", default: "#cbb58d", label: "Rope", describe: "Neck rope, knot and hanging tails." },
  copper: { type: "color", default: "#a86a55", label: "Copper ore", describe: "Copper lumps (shiny metal)." },
  gold: { type: "color", default: "#cba031", label: "Gold ore", describe: "Gold lumps (shiny metal)." },
  iron: { type: "color", default: "#76767a", label: "Iron ore", describe: "Iron lumps (shiny grey metal)." },
  coal: { type: "color", default: "#3f393b", label: "Coal", describe: "Coal chunks (glossy)." }
};
var presets = {
  "burlap": { sack: "#b39a78", lining: "#8d6644", rope: "#cbb58d" },
  "dark-hessian": { sack: "#8d6644", lining: "#5f3f2b", rope: "#bf9e56" },
  "grey-canvas": { sack: "#92857d", lining: "#544e4f", rope: "#b7936f" },
  "pale-flour": { sack: "#b4a48a", lining: "#82756d", rope: "#7b5234" }
};
function resolve(p) {
  const o = {};
  for (const [k, d] of Object.entries(params)) o[k] = d.default;
  Object.assign(o, presets[p.colorway ?? o.colorway] || {});
  for (const [k, v] of Object.entries(p)) if (v !== void 0) o[k] = v;
  return o;
}
function hash(...n) {
  let h = 2166136261;
  for (const v of n) {
    h = Math.imul(h ^ (v | 0), 16777619);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ h >>> 16, 2246822519);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
function prng(seed = 1) {
  return () => (seed = seed * 16807 % 2147483647) / 2147483647;
}
var Bucket = class {
  constructor() {
    this.pos = [];
    this.col = [];
  }
  raw(a, b, c, hex) {
    const col = new THREE.Color(hex);
    for (const v of [a, b, c]) {
      this.pos.push(v[0], v[1], v[2]);
      this.col.push(col.r, col.g, col.b);
    }
  }
  tri(a, b, c, hex, hint) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-14) return;
    if (nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) this.raw(a, c, b, hex);
    else this.raw(a, b, c, hex);
  }
  quad(a, b, c, d, hex, hintFn, diagA) {
    const T = diagA ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const [p, q, r] of T) this.tri(p, q, r, hex, hintFn(cen(p, q, r)));
  }
  geometry() {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    return g;
  }
};
var cen = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var lerp = (a, b, t) => a + (b - a) * t;
function band(B, A, C, hex, hintFn, closed = true) {
  const L = A.length;
  const n = closed ? L : L - 1;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % L;
    B.quad(A[i], A[j], C[j], C[i], hex, hintFn, i < L / 2);
  }
}
function makeMaterials() {
  return {
    matte: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.25, metalness: 0.25 }),
    gem: new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.15,
      metalness: 0
    })
  };
}
function lump(B, kind, hex, r, at, seed, { floor = false, cull = null, cullDot = 0.55 } = {}) {
  let g = new THREE.IcosahedronGeometry(r, 0);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const rnd = prng(seed * 7919 + 13);
  const shape = {
    copper: [1.15, 0.86, 1, 0.22],
    gold: [1.06, 0.92, 1, 0.16],
    iron: [1.2, 0.82, 0.95, 0.3],
    coal: [1.3, 0.68, 1.08, 0.34]
  }[kind];
  const sx = shape[0] * (0.88 + rnd() * 0.3), sy = shape[1] * (0.82 + rnd() * 0.26), sz = shape[2] * (0.88 + rnd() * 0.22);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 + (rnd() - 0.5) * shape[3];
    p.setXYZ(i, p.getX(i) * k * sx, p.getY(i) * k * sy, p.getZ(i) * k * sz);
  }
  g = g.toNonIndexed();
  g.rotateX((rnd() - 0.5) * 0.5);
  g.rotateY(rnd() * Math.PI * 2);
  g.rotateZ((rnd() - 0.5) * 0.4);
  g.computeBoundingBox();
  if (floor) {
    const h = g.boundingBox.max.y - g.boundingBox.min.y;
    g.translate(at[0], -g.boundingBox.min.y - h * 0.22, at[2]);
  } else g.translate(at[0], at[1], at[2]);
  const q = g.attributes.position;
  if (floor) {
    for (let i = 0; i < q.count; i++) if (q.getY(i) < 0) q.setY(i, 0);
  }
  const v = [];
  for (let i = 0; i < q.count; i++) v.push([q.getX(i), q.getY(i), q.getZ(i)]);
  for (let t = 0; t < v.length; t += 3) {
    const a = v[t], b = v[t + 1], c = v[t + 2];
    const n = new THREE.Vector3(...sub(b, a)).cross(new THREE.Vector3(...sub(c, a)));
    if (n.lengthSq() < 1e-12) continue;
    n.normalize();
    if (cull && n.x * cull[0] + n.y * cull[1] + n.z * cull[2] > cullDot) continue;
    B.raw(a, b, c, hex);
  }
}
function createAsset(input = {}) {
  const P = resolve(input);
  const harvested = !!P.harvested;
  const f = harvested ? -0.2 : Math.min(1, Math.max(0, +P.fullness));
  const wraps = Math.round(Math.min(3, Math.max(1, +P.wraps)));
  const spill = harvested ? 0 : Math.min(1, Math.max(0, +P.spill));
  const oreMode = params.ore.options.includes(P.ore) ? P.ore : "mixed";
  const C = { sack: P.sack, lining: P.lining, rope: P.rope };
  const mats = makeMaterials();
  const main = { matte: new Bucket(), metal: new Bucket(), gem: new Bucket() };
  const spilled = { metal: new Bucket(), gem: new Bucket() };
  const N = 10;
  const yN = 0.55 * (0.8 + 0.4 * f);
  const s = yN / 0.55;
  const wf = 1 + (0.5 - f) * 0.16;
  const prof = [
    [0, 0.322 * wf, 0.8, 0],
    [0.04, 0.296 * wf, 0.76, 0.03],
    [0.14 * s, 0.292 * wf, 0.75, 0.08],
    [0.25 * s, 0.284 * wf, 0.74, 0.09],
    [0.36 * s, 0.258 * wf, 0.76, 0.08],
    [yN - 0.11, 0.208 * (0.5 + wf / 2), 0.8, 0.07],
    [yN - 0.065, 0.15, 0.86, 0.03],
    [yN - 0.035, 0.092, 0.9, 0],
    [yN, 0.082, 0.9, 0]
  ];
  const rxAt = (y) => {
    for (let j = 0; j < prof.length - 1; j++) {
      const [y0, r0, z0] = prof[j], [y1, r1, z1] = prof[j + 1];
      if (y <= y1 || j === prof.length - 2) {
        const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
        return [lerp(r0, r1, t), lerp(r0 * z0, r1 * z1, t)];
      }
    }
  };
  const rings = prof.map(([y, rx, zs, jit], j) => {
    const R = [];
    for (let k = 0; k < N; k++) {
      const m = Math.min(k, N - k), sg = k <= N / 2 ? 1 : -1;
      const th = k / N * Math.PI * 2;
      let rad = 1 + (hash(j, m, 1) - 0.5) * 2 * jit;
      if (j === 0 && (m === 2 || m === 3)) rad += 0.065;
      const dy = j >= 2 && j <= 5 ? (hash(j, m, 2) - 0.5) * 0.024 : 0;
      const dt = m === 0 || m === N / 2 ? 0 : (hash(j, m, 3) - 0.5) * 0.08 * sg;
      R.push([rx * rad * Math.sin(th + dt), y + dy, rx * zs * rad * Math.cos(th + dt)]);
    }
    return R;
  });
  const surfZ = (x, y) => {
    const [rx, rz] = rxAt(y);
    return rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
  };
  const M = main.matte;
  const radial = (c) => [c[0], 0, c[2]];
  for (let j = 0; j < rings.length - 1; j++) {
    for (let k = 0; k < N; k++) {
      const k2 = (k + 1) % N;
      M.quad(rings[j][k], rings[j][k2], rings[j + 1][k2], rings[j + 1][k], C.sack, radial, k < N / 2);
    }
  }
  for (let k = 0; k < N; k++) M.tri([0, 0, 0], rings[0][k], rings[0][(k + 1) % N], C.sack, [0, -1, 0]);
  const neck = rings[rings.length - 1];
  const crownRing = (y, rx, zs, pts = 0) => {
    const R = [];
    for (let k = 0; k < N; k++) {
      const th = k / N * Math.PI * 2;
      const up = pts ? k % 2 === 0 ? pts : -pts * 0.7 : 0;
      R.push([rx * Math.sin(th), y + up, rx * zs * Math.cos(th)]);
    }
    return R;
  };
  const C1 = crownRing(yN + 0.045, 0.108, 0.9);
  const T = crownRing(yN + 0.135, 0.158, 0.88, 0.02);
  const Ti = T.map((p) => [p[0] * 0.74, p[1] - 0.012, p[2] * 0.74]);
  band(M, neck, C1, C.sack, radial);
  band(M, C1, T, C.sack, radial);
  band(M, T, Ti, C.sack, (c) => [c[0] * 0.3, 1, c[2] * 0.3]);
  const capT = [0, yN + 0.06, 0];
  const Ci = crownRing(yN + 0.07, 0.07, 0.9);
  band(M, Ti, Ci, C.lining, (c) => [-c[0], 0.4, -c[2]]);
  for (let k = 0; k < N; k++) M.tri(capT, Ci[k], Ci[(k + 1) % N], C.lining, [0, 1, 0]);
  const RR = 0.023, MS = 8;
  const neckAt = (y) => {
    if (y <= yN) return rxAt(y);
    const t = Math.min(1, (y - yN) / 0.045);
    return [lerp(0.082, 0.108, t), lerp(0.082 * 0.9, 0.108 * 0.9, t)];
  };
  let zKnot = 0;
  for (let w = 0; w < wraps; w++) {
    const yw = yN - 0.012 + (w - (wraps - 1) / 2) * 0.036;
    const [nx0, nz0] = neckAt(yw);
    const rx = nx0 + RR * 0.55, rz = nz0 + RR * 0.55;
    zKnot = Math.max(zKnot, rz);
    const secs = [], ctrs = [];
    for (let m = 0; m < MS; m++) {
      const th = m / MS * Math.PI * 2;
      const c = [rx * Math.sin(th), yw, rz * Math.cos(th)];
      const n = new THREE.Vector3(Math.sin(th) / rx, 0, Math.cos(th) / rz).normalize();
      const tw = Math.PI / 4 + Math.min(m, MS - m) * (Math.PI / 6) + w * 0.4;
      const sec = [];
      for (let q = 0; q < 4; q++) {
        const ps = tw + q * Math.PI / 2;
        sec.push([c[0] + RR * Math.cos(ps) * n.x, yw + RR * Math.sin(ps), c[2] + RR * Math.cos(ps) * n.z]);
      }
      secs.push(sec);
      ctrs.push(c);
    }
    for (let m = 0; m < MS; m++) {
      const m2 = (m + 1) % MS;
      const mid = [(ctrs[m][0] + ctrs[m2][0]) / 2, yw, (ctrs[m][2] + ctrs[m2][2]) / 2];
      for (let q = 0; q < 4; q++) {
        const q2 = (q + 1) % 4;
        const a = secs[m][q], b = secs[m][q2], c2 = secs[m2][q2], d = secs[m2][q];
        const cx = (a[0] + b[0] + c2[0] + d[0]) / 4, cz = (a[2] + b[2] + c2[2] + d[2]) / 4;
        if ((cx / nx0) ** 2 + (cz / nz0) ** 2 < 0.97) continue;
        M.quad(a, b, c2, d, C.rope, (c) => sub(c, mid), m < MS / 2);
      }
    }
  }
  {
    let g2 = new THREE.IcosahedronGeometry(0.036, 0);
    g2.scale(1.4, 1.05, 0.85).translate(0, yN - 0.016, zKnot + 0.012);
    const q = g2.attributes.position;
    for (let t = 0; t < q.count; t += 3) {
      const v = [t, t + 1, t + 2].map((i) => [q.getX(i), q.getY(i), q.getZ(i)]);
      M.raw(v[0], v[1], v[2], C.rope);
    }
  }
  const tmp = new THREE.Mesh(M.geometry(), new THREE.MeshBasicMaterial());
  const ray = new THREE.Raycaster();
  const onSurf = (x, y) => {
    ray.set(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
    const h = ray.intersectObject(tmp, false);
    return h.length ? h[0].point.z : surfZ(x, y);
  };
  {
    const yEnd = yN - 0.2;
    const RT = 0.02;
    const path = [[0.018, yN - 0.024, zKnot + 0]];
    const xs = [0.045, 0.07, 0.085];
    for (let i = 0; i < 3; i++) {
      const y = lerp(yN - 0.06, yEnd, i / 2);
      path.push([xs[i], y, onSurf(xs[i], y) + RT * 0.8]);
    }
    const tailB = new Bucket();
    const secs = path.map((p, i) => {
      const nxt = path[Math.min(i + 1, path.length - 1)], prv = path[Math.max(i - 1, 0)];
      const t = new THREE.Vector3(...sub(nxt, prv)).normalize();
      const ref = new THREE.Vector3(0, 0, 1);
      const u = ref.clone().sub(t.clone().multiplyScalar(ref.dot(t))).normalize();
      const v = new THREE.Vector3().crossVectors(t, u);
      const tw = Math.PI / 4 + i * 0.5;
      const sc = i === path.length - 1 ? 0.85 : 1;
      return [0, 1, 2, 3].map((q) => {
        const a = tw + q * Math.PI / 2;
        return [
          p[0] + RT * sc * (Math.cos(a) * u.x + Math.sin(a) * v.x),
          p[1] + RT * sc * (Math.cos(a) * u.y + Math.sin(a) * v.y),
          p[2] + RT * sc * (Math.cos(a) * u.z + Math.sin(a) * v.z)
        ];
      });
    });
    for (let i = 0; i < secs.length - 1; i++) {
      const mid = [(path[i][0] + path[i + 1][0]) / 2, (path[i][1] + path[i + 1][1]) / 2, (path[i][2] + path[i + 1][2]) / 2];
      for (let q = 0; q < 4; q++) {
        const q2 = (q + 1) % 4;
        tailB.quad(secs[i][q], secs[i][q2], secs[i + 1][q2], secs[i + 1][q], C.rope, (c) => sub(c, mid), true);
      }
    }
    const end = secs[secs.length - 1];
    const tEnd = sub(path[path.length - 1], path[path.length - 2]);
    tailB.quad(end[0], end[1], end[2], end[3], C.rope, () => tEnd, true);
    const tp = tailB.pos;
    for (let i = 0; i < tp.length; i += 9) {
      const a = [tp[i], tp[i + 1], tp[i + 2]], b = [tp[i + 3], tp[i + 4], tp[i + 5]], c = [tp[i + 6], tp[i + 7], tp[i + 8]];
      M.raw(a, b, c, C.rope);
      M.raw([-a[0], a[1], a[2]], [-c[0], c[1], c[2]], [-b[0], b[1], b[2]], C.rope);
    }
  }
  const kindOf = (i) => oreMode === "mixed" ? ORE_KINDS[(i + Math.floor(hash(i, 77) * 1.6)) % 3] : oreMode;
  const hexOf = (kind) => P[kind];
  const put = (bucketSet, kind, ...rest) => lump(kind === "coal" ? bucketSet.gem : bucketSet.metal, kind, hexOf(kind), ...rest);
  const LR = 0.047;
  if (!harvested) {
    const yRim = yN + 0.123;
    const heap = [];
    for (let i = 0; i < 5; i++) {
      const th = i / 5 * Math.PI * 2 + 0.35;
      heap.push([0.07 * Math.sin(th), yRim + 0.016 + hash(i, 4) * 0.012, 0.062 * Math.cos(th)]);
    }
    for (let i = 0; i < 3; i++) {
      const th = i / 3 * Math.PI * 2 + 1.2;
      heap.push([0.034 * Math.sin(th), yRim + 0.064 + hash(i, 6) * 0.01, 0.03 * Math.cos(th)]);
    }
    heap.push([4e-3, yRim + 0.108, -4e-3]);
    heap.forEach((at, i) => {
      const r = LR * (0.92 + hash(i, 5) * 0.16);
      put(main, kindOf(i), r, at, 100 + i, { cull: i >= 5 ? [0, -1, 0] : null, cullDot: 0.8 });
    });
    const rimTh = [0.45, -1.1];
    const nRim = spill > 0.55 ? 2 : spill > 0.1 ? 1 : 0;
    for (let i = 0; i < nRim; i++) {
      const th = rimTh[i];
      put(
        main,
        kindOf(20 + i),
        LR * (0.95 - i * 0.06),
        [0.14 * Math.sin(th), yRim + 0.034, 0.14 * 0.88 * Math.cos(th)],
        120 + i
      );
    }
    const zFoot = rings[0][0][2];
    const fan = [
      [0, -0.01],
      [-0.112, 0.035],
      [0.118, 0.045],
      [-0.05, 0.145],
      [0.072, 0.155],
      [-0.18, 0.15],
      [0.03, 0.25]
    ];
    const nFloor = Math.round(spill * fan.length);
    for (let i = 0; i < nFloor; i++) {
      const [fx, fz] = fan[i];
      const t = i / (fan.length - 1);
      const r = LR * (1 - 0.22 * t) * (0.94 + hash(i, 31) * 0.12);
      const x = fx + (hash(i, 32) - 0.5) * 0.02, z = zFoot + LR * 0.75 + fz + (hash(i, 33) - 0.5) * 0.016;
      put(spilled, kindOf(30 + i), r, [x, 0, z], 200 + i, { floor: true });
    }
  }
  tmp.geometry.dispose();
  const g = new THREE.Group();
  g.name = "ore-sack";
  const addMesh = (parent, bucket, mat, name) => {
    const geo = bucket.geometry();
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    parent.add(mesh);
  };
  addMesh(g, main.matte, mats.matte, "sack");
  addMesh(g, main.metal, mats.metal, "ore-metal");
  addMesh(g, main.gem, mats.gem, "ore-coal");
  const sp = new THREE.Group();
  sp.name = "spilled-ore";
  addMesh(sp, spilled.metal, mats.metal, "spilled-metal");
  addMesh(sp, spilled.gem, mats.gem, "spilled-coal");
  g.add(sp);
  return g;
}

// ../../../../private/tmp/polyfork-wrapper.mjs
var keys = ["colorway", "ore", "spill", "fullness", "wraps", "harvested"];
var metadata = { controls: keys.map((key) => {
  const p = params[key];
  return { key, kind: p.type, label: p.label, ...p.min === void 0 ? {} : { min: p.min, max: p.max, step: p.step }, ...p.options ? { options: p.options.map((value) => ({ value, label: value })) } : {} };
}) };
function createAsset2(input = {}) {
  const applied = Object.fromEntries(keys.map((key) => [key, input[key] ?? params[key].default]));
  const object = createAsset(applied);
  object.userData.design = { applied };
  return object;
}
function disposeAsset(object) {
  object.traverse((node) => {
    node.geometry?.dispose();
    node.material?.dispose();
  });
}
export {
  createAsset2 as createAsset,
  disposeAsset,
  metadata
};
