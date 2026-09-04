import type { Point } from './model';

export type RegionId = 'root_halls' | 'sunken_archive' | 'vault_heart';

export type RegionDefinition = {
  id: RegionId;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  start: Point;
  exit: Point;
  nextRegion: RegionId | null;
  relics: Point[];
  hazards: Point[];
  wardCaches: Point[];
  checkpoints: Point[];
  walls: Point[];
  palette: { floorA: number; floorB: number; wall: number; accent: number };
};

const border = (width: number, height: number): Point[] => {
  const points: Point[] = [];
  for (let x = 0; x < width; x += 1) {
    points.push({ x, y: 0 }, { x, y: height - 1 });
  }
  for (let y = 1; y < height - 1; y += 1) {
    points.push({ x: 0, y }, { x: width - 1, y });
  }
  return points;
};

export const REGIONS: Record<RegionId, RegionDefinition> = {
  root_halls: {
    id: 'root_halls',
    name: 'The Root Halls',
    subtitle: 'Vines, old stone, and the first relic seals.',
    width: 11,
    height: 9,
    start: { x: 1, y: 7 },
    exit: { x: 9, y: 1 },
    nextRegion: 'sunken_archive',
    relics: [{ x: 2, y: 2 }, { x: 8, y: 6 }, { x: 6, y: 3 }],
    hazards: [{ x: 4, y: 6 }, { x: 7, y: 5 }, { x: 5, y: 2 }],
    wardCaches: [{ x: 2, y: 1 }, { x: 6, y: 6 }],
    checkpoints: [{ x: 1, y: 3 }, { x: 9, y: 6 }],
    walls: [
      ...border(11, 9),
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 3, y: 5 },
      { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 1, y: 5 }, { x: 2, y: 5 }
    ],
    palette: { floorA: 0x294b35, floorB: 0x24422f, wall: 0x18251d, accent: 0xd9bd72 }
  },
  sunken_archive: {
    id: 'sunken_archive',
    name: 'The Sunken Archive',
    subtitle: 'Flooded records and unstable cultivation chambers.',
    width: 11,
    height: 9,
    start: { x: 1, y: 1 },
    exit: { x: 9, y: 7 },
    nextRegion: 'vault_heart',
    relics: [{ x: 5, y: 1 }, { x: 8, y: 5 }],
    hazards: [{ x: 3, y: 2 }, { x: 6, y: 6 }, { x: 8, y: 2 }, { x: 4, y: 5 }],
    wardCaches: [{ x: 2, y: 6 }],
    checkpoints: [{ x: 5, y: 4 }],
    walls: [
      ...border(11, 9),
      { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
      { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 7, y: 5 }, { x: 7, y: 6 }
    ],
    palette: { floorA: 0x193f46, floorB: 0x17353d, wall: 0x12282d, accent: 0x8ed4cf }
  },
  vault_heart: {
    id: 'vault_heart',
    name: 'The Vault Heart',
    subtitle: 'The final chamber where the living seed vault waits.',
    width: 11,
    height: 9,
    start: { x: 1, y: 7 },
    exit: { x: 9, y: 1 },
    nextRegion: null,
    relics: [{ x: 5, y: 2 }],
    hazards: [{ x: 2, y: 6 }, { x: 4, y: 6 }, { x: 6, y: 5 }, { x: 7, y: 3 }, { x: 5, y: 1 }],
    wardCaches: [{ x: 1, y: 3 }],
    checkpoints: [{ x: 5, y: 6 }],
    walls: [
      ...border(11, 9),
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
      { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 },
      { x: 4, y: 4 }, { x: 5, y: 4 },
      { x: 8, y: 2 }
    ],
    palette: { floorA: 0x4a3325, floorB: 0x3e291f, wall: 0x241912, accent: 0xe8c766 }
  }
};

export const CAMPAIGN_RELIC_GOAL = Object.values(REGIONS).reduce((sum, region) => sum + region.relics.length, 0);
