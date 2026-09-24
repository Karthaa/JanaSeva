/**
 * Mock data engine for JalSaaf.
 * Provides 15 facilities in Kochi, Kerala with realistic coordinates, names, and statuses.
 * Used when Supabase is not configured or as a fallback.
 *
 * The Truth-Decay Algorithm:
 * confidence_score = base_condition_score * accessibility_multiplier * time_decay
 * where time_decay = exp(-λ * hours_since_verified), λ = 0.005
 */

import type { Facility, FacilityStatus, FacilityType, AccessibilityLevel } from '../types';

interface MockFacilityInput {
  id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  accessibility: AccessibilityLevel;
  lat: number;
  lng: number;
  address: string;
  managed_by: string;
  last_verified_hours_ago: number;
}

// λ decay constant — results in ~50% confidence after ~139 hours (~6 days)
const DECAY_LAMBDA = 0.005;

const STATUS_BASE_SCORES: Record<FacilityStatus, number> = {
  clean: 95,
  usable: 70,
  broken: 15,
  locked: 10,
  no_water: 20,
};

const ACCESSIBILITY_MULTIPLIERS: Record<AccessibilityLevel, number> = {
  wheelchair: 1.0,
  limited: 0.85,
  none: 0.7,
};

function computeConfidence(status: FacilityStatus, accessibility: AccessibilityLevel, hoursAgo: number): number {
  const base = STATUS_BASE_SCORES[status];
  const accMul = ACCESSIBILITY_MULTIPLIERS[accessibility];
  const decay = Math.exp(-DECAY_LAMBDA * hoursAgo);
  return Math.round(base * accMul * decay);
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MOCK_FACILITIES: MockFacilityInput[] = [
  // TOILETS
  { id: 't1', name: 'Public Toilet - Panangad', type: 'toilet', status: 'clean', accessibility: 'wheelchair', lat: 9.8857718, lng: 76.2864323, address: 'Panangad, Kochi', managed_by: 'Kochi Corporation', last_verified_hours_ago: 48 },
  { id: 't2', name: 'Public Toilet - Thevara', type: 'toilet', status: 'usable', accessibility: 'limited', lat: 9.9232942, lng: 76.256472, address: 'Thevara, Kochi', managed_by: 'Kochi Corporation', last_verified_hours_ago: 336 },
  { id: 't3', name: 'Public Toilet - Ravipuram', type: 'toilet', status: 'clean', accessibility: 'none', lat: 9.9731657, lng: 76.244461, address: 'Ravipuram, Kochi', managed_by: 'Kochi Corporation', last_verified_hours_ago: 120 },
  { id: 't4', name: 'Public Toilet - Nettoor', type: 'toilet', status: 'broken', accessibility: 'wheelchair', lat: 9.8975397, lng: 76.2842326, address: 'Nettoor, Kochi', managed_by: 'Kochi Corporation', last_verified_hours_ago: 1080 },
  { id: 't5', name: 'Public Toilet - Fort Kochi', type: 'toilet', status: 'clean', accessibility: 'limited', lat: 9.9655414, lng: 76.2398291, address: 'Fort Kochi Beach', managed_by: 'Kochi Corporation', last_verified_hours_ago: 24 },
  { id: 't6', name: 'Public Toilet - Edappally', type: 'toilet', status: 'usable', accessibility: 'none', lat: 10.0730167, lng: 76.2102067, address: 'Edappally Toll', managed_by: 'Kochi Corporation', last_verified_hours_ago: 480 },
  { id: 't7', name: 'Public Toilet - Aluva', type: 'toilet', status: 'clean', accessibility: 'wheelchair', lat: 10.1092341, lng: 76.1876079, address: 'Aluva Metro', managed_by: 'KMRL', last_verified_hours_ago: 72 },

  // WATER
  { id: 'w1', name: 'Water Kiosk - Palarivattom', type: 'drinking_water', status: 'clean', accessibility: 'wheelchair', lat: 10.0323146, lng: 76.2211168, address: 'Palarivattom JN', managed_by: 'KWA', last_verified_hours_ago: 240 },
  { id: 'w2', name: 'Water Station - Kalamassery', type: 'drinking_water', status: 'usable', accessibility: 'limited', lat: 10.0910344, lng: 76.2082801, address: 'Kalamassery', managed_by: 'KWA', last_verified_hours_ago: 840 },
  { id: 'w3', name: 'Water Kiosk - CUSAT', type: 'drinking_water', status: 'no_water', accessibility: 'wheelchair', lat: 10.0755893, lng: 76.2182027, address: 'CUSAT Campus', managed_by: 'KWA', last_verified_hours_ago: 1200 }
];

export function getMockFacilities(userLat: number, userLng: number, radiusM: number = 50000): Facility[] {
  const now = new Date();

  return MOCK_FACILITIES
    .map((f) => {
      const distance_m = haversineDistance(userLat, userLng, f.lat, f.lng);
      const last_verified_at = new Date(now.getTime() - f.last_verified_hours_ago * 3600000).toISOString();
      const confidence_score = computeConfidence(f.status, f.accessibility, f.last_verified_hours_ago);

      return {
        id: f.id,
        name: f.name,
        type: f.type,
        status: f.status,
        accessibility: f.accessibility,
        latitude: f.lat,
        longitude: f.lng,
        address: f.address,
        managed_by: f.managed_by,
        last_verified_at,
        confidence_score,
        distance_m,
        total_reports: Math.floor(Math.random() * 25) + 1,
        geojson: {
          type: 'Point' as const,
          coordinates: [f.lng, f.lat],
        },
      } satisfies Facility;
    })
    .filter((f) => f.distance_m <= radiusM)
    .sort((a, b) => {
      // Primary sort: confidence desc, secondary: distance asc
      if (b.confidence_score !== a.confidence_score) return b.confidence_score - a.confidence_score;
      return a.distance_m - b.distance_m;
    });
}
