import { create } from 'zustand';
import type { Facility, FilterState, UserLocation } from '../types';

interface AppState {
  // User location
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation | null) => void;
  locationError: string | null;
  setLocationError: (err: string | null) => void;

  // Facilities
  facilities: Facility[];
  setFacilities: (facs: Facility[]) => void;

  // Selected facility
  selectedFacility: Facility | null;
  setSelectedFacility: (f: Facility | null) => void;

  // Bottom sheet state
  sheetView: 'list' | 'detail' | 'report' | 'ticket-success';
  setSheetView: (v: 'list' | 'detail' | 'report' | 'ticket-success') => void;
  sheetExpanded: boolean;
  setSheetExpanded: (expanded: boolean) => void;

  // Filters
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;

  // UI modes
  listOnlyMode: boolean;
  setListOnlyMode: (v: boolean) => void;
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;

  // Last submitted ticket
  lastTicketNumber: string | null;
  setLastTicketNumber: (t: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),
  locationError: null,
  setLocationError: (err) => set({ locationError: err }),

  facilities: [],
  setFacilities: (facs) => set({ facilities: facs }),

  selectedFacility: null,
  setSelectedFacility: (f) => set({ selectedFacility: f }),

  sheetView: 'list',
  setSheetView: (v) => set({ sheetView: v }),
  sheetExpanded: false,
  setSheetExpanded: (expanded) => set({ sheetExpanded: expanded }),

  filters: {
    maxDistance: 10000,
    type: 'all',
    accessibility: 'all',
    status: 'all',
    minConfidence: 0,
  },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

  listOnlyMode: false,
  setListOnlyMode: (v) => set({ listOnlyMode: v }),
  isOffline: !navigator.onLine,
  setIsOffline: (v) => set({ isOffline: v }),

  lastTicketNumber: null,
  setLastTicketNumber: (t) => set({ lastTicketNumber: t }),
}));
