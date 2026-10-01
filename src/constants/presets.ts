import { GamePreset } from '../types/game';

export const GAME_PRESETS: GamePreset[] = [
  {
    id: 'quick',
    label: '3 × 3 Dots',
    description: 'Quick Game (4 Boxes • ~2 mins)',
    rows: 3,
    cols: 3,
  },
  {
    id: 'classic',
    label: '4 × 4 Dots',
    description: 'Classic (9 Boxes • ~5 mins)',
    rows: 4,
    cols: 4,
  },
  {
    id: 'standard',
    label: '5 × 5 Dots',
    description: 'Standard (16 Boxes • ~10 mins)',
    rows: 5,
    cols: 5,
  },
  {
    id: 'marathon',
    label: '6 × 6 Dots',
    description: 'Challenge (25 Boxes • ~15 mins)',
    rows: 6,
    cols: 6,
  },
];

export const DEFAULT_PLAYER_PALETTES = [
  { name: 'Crayon Red', color: '#E53935', lightColor: '#FFEBEE' },
  { name: 'Royal Blue', color: '#1E88E5', lightColor: '#E3F2FD' },
  { name: 'Forest Green', color: '#43A047', lightColor: '#E8F5E9' },
  { name: 'Warm Orange', color: '#FB8C00', lightColor: '#FFF3E0' },
  { name: 'Berry Purple', color: '#8E24AA', lightColor: '#F3E5F5' },
];
