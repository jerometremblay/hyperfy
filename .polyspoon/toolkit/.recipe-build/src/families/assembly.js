import { Box3, BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { palettes } from './config.js';
import { timberFaceColors } from '../engine/timber.js';
import { materialStyle, edgeStyles } from '../engine/style.js';
import { profiledBeam, framedPanel } from '../engine/geometry.js';
export class Assembly {
    config;
    roleColors;
    root = new Group();
    materials = {};
    anchors = { ground: [0, 0, 0] };
    constructor(config, roleColors = palettes[config.applied.colorway]) {
        this.config = config;
        this.roleColors = roleColors;
        this.root.name = config.family;
        this.root.userData = { configuration: config, units: 'meters', up: '+Y', forward: '+Z', origin: 'ground-center' };
    }
    mesh(name, geometry, role, position = [0, 0, 0]) {
        if (this.root.getObjectByName(name))
            throw new Error('Duplicate part: ' + name);
        const color = String(this.config.applied['color.' + role] ?? this.roleColors[role]);
        if (!/^#[0-9a-f]{6}$/i.test(color))
            throw new Error('Unknown material role: ' + role);
        const material = this.materials[role] ??= new MeshStandardMaterial({ name: role, ...materialStyle(role, color) });
        if ((role === 'wood' || role === 'timber') && this.config.applied.weathering !== undefined) {
            const age = Number(this.config.applied.weathering), variation = Number(this.config.applied.toneVariation);
            if (!material.vertexColors) {
                material.vertexColors = true;
                material.color.multiplyScalar((.82 + Number(this.config.applied.timberTone) * .5) / .9);
                const hsl = { h: 0, s: 0, l: 0 };
                material.color.getHSL(hsl);
                material.color.setHSL(hsl.h, hsl.s * (1 - age * .22), hsl.l);
            }
            timberFaceColors(geometry, variation, age, name);
        }
        const mesh = new Mesh(geometry, material);
        mesh.name = name;
        mesh.userData = { materialRole: role };
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.root.add(mesh);
        return mesh;
    }
    box(name, size, role, position) {
        return this.mesh(name, new BoxGeometry(...size), role, position);
    }
    beam(name, from, to, width, depth, role, chamfer = edgeStyles.timber.chamfer) {
        return this.mesh(name, profiledBeam(from, to, width, depth, Math.min(chamfer * (1 + Number(this.config.applied.weathering ?? 0) * 1.8), width * 0.2, depth * 0.2)), role);
    }
    panel(name, width, height, frame, depth, reveal, position, role, backRole, rotation = 0) {
        const group = new Group();
        group.name = name;
        for (const [part, data] of Object.entries(framedPanel(width, height, frame, depth, reveal))) {
            const mesh = this.mesh(name + '-' + part, data.geometry, part === 'backing' ? backRole : role, data.position);
            group.add(mesh);
        }
        group.position.set(...position);
        group.rotation.y = rotation;
        this.root.add(group);
        return group;
    }
    branch(name, from, to, bottom, top) {
        const a = new Vector3(...from), b = new Vector3(...to), delta = b.clone().sub(a);
        const mesh = this.mesh(name, new CylinderGeometry(top, bottom, delta.length(), 7, 1), 'timber', a.clone().add(b).multiplyScalar(0.5).toArray());
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
        return mesh;
    }
    finish() {
        this.root.userData.anchors = this.anchors;
        this.root.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(this.root, true);
        return { root: this.root, config: this.config, materials: this.materials, bounds, dimensions: bounds.getSize(new Vector3()), anchors: this.anchors };
    }
}
export function disposeFamily(build) {
    build.root.traverse(object => { if (object instanceof Mesh)
        object.geometry.dispose(); });
    for (const m of Object.values(build.materials))
        m.dispose();
}
