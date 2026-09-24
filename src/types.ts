// ===== Facility & Ticket Types =====

export type FacilityType = 'toilet' | 'drinking_water';

export type FacilityStatus = 'clean' | 'usable' | 'broken' | 'locked' | 'no_water';

export type AccessibilityLevel = 'wheelchair' | 'limited' | 'none';

import type { Point } from 'geojson';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  accessibility: AccessibilityLevel;
  latitude: number;
  longitude: number;
  address: string;
  managed_by: string;
  last_verified_at: string;
  confidence_score: number;
  distance_m: number;
  total_reports: number;
  geojson: Point;
}

export interface Ticket {
  id: string;
  facility_id: string;
  device_id: string;
  reported_status: FacilityStatus;
  comment: string;
  created_at: string;
  routed_to: string;
  ticket_number: string;
}

export interface FilterState {
  maxDistance: number; // meters
  type: FacilityType | 'all';
  accessibility: AccessibilityLevel | 'all';
  status: FacilityStatus | 'all';
  minConfidence: number; // 0-100
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// Confidence tier thresholds
export const CONFIDENCE_TIERS = {
  HIGH: { min: 70, label: 'Verified', color: 'green' as const },
  MEDIUM: { min: 40, label: 'Likely OK', color: 'yellow' as const },
  LOW: { min: 0, label: 'Unverified', color: 'red' as const },
} as const;

export type ConfidenceTier = 'green' | 'yellow' | 'red';

export function getConfidenceTier(score: number): { label: string; color: ConfidenceTier } {
  if (score >= CONFIDENCE_TIERS.HIGH.min) return CONFIDENCE_TIERS.HIGH;
  if (score >= CONFIDENCE_TIERS.MEDIUM.min) return CONFIDENCE_TIERS.MEDIUM;
  return CONFIDENCE_TIERS.LOW;
}

export function getStatusLabel(status: FacilityStatus): string {
  const labels: Record<FacilityStatus, string> = {
    clean: 'Clean',
    usable: 'Usable',
    broken: 'Broken',
    locked: 'Locked',
    no_water: 'No Water',
  };
  return labels[status];
}

export function getStatusColor(status: FacilityStatus): ConfidenceTier {
  switch (status) {
    case 'clean': return 'green';
    case 'usable': return 'yellow';
    case 'broken':
    case 'locked':
    case 'no_water': return 'red';
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
