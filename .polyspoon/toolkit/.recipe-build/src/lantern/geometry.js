export { profileSolid, carryingBand } from '../engine/geometry.js';
import { facetedLoft } from '../engine/geometry.js';
export function protectiveGuard(stations, width, depth, angle) {
    const x = width / 2, z = depth / 2, cut = Math.min(width, depth) * .18;
    const section = [[-x + cut, -z], [x - cut, -z], [x, -z + cut], [x, z - cut], [x - cut, z], [-x + cut, z], [-x, z - cut], [-x, -z + cut]];
    const c = Math.cos(angle), s = Math.sin(angle);
    const outline = section.map(([u, v]) => [s * u + c * v, -c * u + s * v]);
    return facetedLoft(stations.map(center => ({ center, outline })));
}
