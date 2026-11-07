export const edgeStyles = { timber: { chamfer: 0.008 }, metal: { chamferRatio: 0.055 }, stone: { chamfer: 0.035 } };
export function materialStyle(role, color) {
    return { color, roughness: role === 'accent' || role === 'hardware' ? 0.66 : role === 'diffuser' || role === 'enclosure' ? 0.78 : 0.9, metalness: 0 };
}
