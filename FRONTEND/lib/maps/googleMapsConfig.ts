/**
 * Google Maps Platform configuration and constants
 */

export const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAMHIMjbCW5zFK9PJT4SD_jw1p3mp-kpC8';

export const GOOGLE_MAPS_MAP_ID = 'DEMO_MAP_ID';

export const GMP_ATTRIBUTION_IDS = ['gmp_git_agentskills_v1'];
