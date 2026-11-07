import { exportAsset } from './export.js';
import { exportRiggedAsset } from '../rigging/export.js';
export function exportDeliverable(build) {
    return 'rig' in build ? exportRiggedAsset(build) : exportAsset(build);
}
