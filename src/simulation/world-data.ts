export type Vec2 = Readonly<{ x: number; z: number }>;

export type Obstacle = Readonly<{
  id: string;
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
}>;

export type Sigil = Readonly<{
  id: string;
  name: string;
  x: number;
  z: number;
  color: number;
}>;

export type Hazard = Readonly<{
  id: string;
  x: number;
  z: number;
  radius: number;
}>;

export const TEMPLE_ATRIUM = Object.freeze({
  spawn: { x: 0, z: 8 } satisfies Vec2,
  bounds: Object.freeze({ minX: -15, maxX: 15, minZ: -20, maxZ: 12 }),
  gate: Object.freeze({ x: 0, z: -18, radius: 1.8 }),
  sigils: Object.freeze([
    { id: 'root-sigil', name: 'Root Sigil', x: -10, z: 1, color: 0x4ac27c },
    { id: 'canopy-sigil', name: 'Canopy Sigil', x: 10, z: -4, color: 0x9cd85a },
    { id: 'resin-sigil', name: 'Resin Sigil', x: -7, z: -13, color: 0xd9b65c },
  ] satisfies Sigil[]),
  hazards: Object.freeze([
    { id: 'spore-vent-a', x: -2.5, z: -3, radius: 1.45 },
    { id: 'spore-vent-b', x: 5, z: -10, radius: 1.55 },
    { id: 'spore-vent-c', x: -9.5, z: -7.5, radius: 1.35 },
  ] satisfies Hazard[]),
  obstacles: Object.freeze([
    { id: 'center-altar', x: 0, z: -5.5, halfWidth: 2.4, halfDepth: 2.4 },
    { id: 'west-pillar', x: -6, z: -1.5, halfWidth: 1.2, halfDepth: 1.2 },
    { id: 'east-pillar', x: 6, z: -1.5, halfWidth: 1.2, halfDepth: 1.2 },
    { id: 'west-wall', x: -12.8, z: -9.5, halfWidth: 1.6, halfDepth: 5.5 },
    { id: 'east-wall', x: 12.8, z: -9.5, halfWidth: 1.6, halfDepth: 5.5 },
    { id: 'gate-left', x: -4.2, z: -17.4, halfWidth: 3.1, halfDepth: 0.9 },
    { id: 'gate-right', x: 4.2, z: -17.4, halfWidth: 3.1, halfDepth: 0.9 },
  ] satisfies Obstacle[]),
  playerRadius: 0.55,
  walkSpeed: 5.2,
  sprintSpeed: 8.4,
  pickupRadius: 1.35,
});

export type TempleAtriumData = typeof TEMPLE_ATRIUM;
