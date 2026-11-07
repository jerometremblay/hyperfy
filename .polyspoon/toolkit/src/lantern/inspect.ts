import { Box3, Mesh, Vector3 } from 'three';
import type { Object3D, BufferGeometry } from 'three';

export function geometrySnapshot(root: Object3D) {
  root.updateMatrixWorld(true);
  const parts: unknown[] = [];
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const geometry = object.geometry as BufferGeometry;
    parts.push({ name: object.name, matrix: object.matrixWorld.toArray(), attributes: Object.fromEntries(Object.entries(geometry.attributes).map(([key, value]) => [key, { itemSize: value.itemSize, array: Array.from(value.array) }])), indices: geometry.index ? Array.from(geometry.index.array) : null });
  });
  return parts;
}
export function inspectGeometry(root: Object3D) {
  const errors: string[] = [];
  let triangles = 0, vertices = 0, parts = 0;
  root.updateMatrixWorld(true);
  const names = new Set<string>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    parts++;
    if (!object.name || names.has(object.name)) errors.push('Missing or duplicate part name');
    names.add(object.name);
    const geometry = object.geometry as BufferGeometry, position = geometry.getAttribute('position'), indices = geometry.index;
    if (!position || !position.count) { errors.push(`${object.name}: empty positions`); return; }
    vertices += position.count;
    for (const [attribute, buffer] of Object.entries(geometry.attributes)) {
      if (Array.from(buffer.array).some(n => !Number.isFinite(n))) errors.push(`${object.name}: non-finite ${attribute}`);
    }
    if (indices && Array.from(indices.array).some(i => i < 0 || i >= position.count || !Number.isInteger(i))) errors.push(`${object.name}: invalid indices`);
    const count = indices ? indices.count : position.count;
    triangles += count / 3;
    if (count % 3) errors.push(`${object.name}: incomplete triangles`);
    const a = new Vector3(), b = new Vector3(), c = new Vector3();
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(position, indices ? indices.getX(i) : i);
      b.fromBufferAttribute(position, indices ? indices.getX(i + 1) : i + 1);
      c.fromBufferAttribute(position, indices ? indices.getX(i + 2) : i + 2);
      if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-18) errors.push(`${object.name}: degenerate triangle ${i / 3}`);
    }
  });
  const bounds = new Box3().setFromObject(root);
  if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) errors.push('Invalid bounds');
  return { errors, parts, triangles, vertices, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() } };
}
