import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getMockFacilities } from '../lib/mockData';
import { cacheFacilities, getCachedFacilities } from '../lib/offlineDb';
import type { Facility } from '../types';

interface SupabaseFacilityRow {
  id: string;
  name: string;
  type: 'toilet' | 'drinking_water';
  status: 'clean' | 'usable' | 'broken' | 'locked' | 'no_water';
  accessibility: 'wheelchair' | 'limited' | 'none';
  latitude: number;
  longitude: number;
  address: string;
  managed_by: string;
  last_verified_at: string;
  confidence_score: number;
  distance_m: number;
  total_reports: number;
  geojson: string; // From RPC it's string
}

export function useFacilities() {
  const userLocation = useAppStore((s) => s.userLocation);
  const filters = useAppStore((s) => s.filters);
  const setFacilities = useAppStore((s) => s.setFacilities);
  const isOffline = useAppStore((s) => s.isOffline);

  return useQuery<Facility[]>({
    queryKey: ['facilities', userLocation?.latitude, userLocation?.longitude, filters.maxDistance],
    queryFn: async () => {
      // Default to Kochi if browser GPS denied or missing
      const loc = userLocation || { latitude: 9.9312, longitude: 76.2673 };
      
      let facilities: Facility[] = [];

      if (isSupabaseConfigured() && !isOffline) {
        try {
          // Attempt the RPC call first with fixed 50km radius
          const { data, error } = await supabase.rpc('get_ranked_facilities', {
            user_lat: loc.latitude,
            user_lng: loc.longitude,
            radius_m: 50000,
          });

          if (error) throw error;

          if (data && data.length > 0) {
            facilities = (data as SupabaseFacilityRow[]).map((row) => ({
              id: row.id,
              name: row.name,
              type: row.type,
              status: row.status,
              accessibility: row.accessibility,
              latitude: row.latitude,
              longitude: row.longitude,
              address: row.address,
              managed_by: row.managed_by,
              last_verified_at: row.last_verified_at,
              confidence_score: row.confidence_score,
              distance_m: row.distance_m,
              total_reports: row.total_reports,
              geojson: JSON.parse(row.geojson),
            }));
          }
        } catch (err) {
          console.warn("Supabase RPC failed, attempting direct table select fallback", err);
        }

        // CRITICAL FALLBACK: If RPC was empty or failed, fetch directly from table
        if (facilities.length === 0) {
          try {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('facilities')
              .select('*')
              .limit(50);
              
            if (fallbackError) throw fallbackError;
            
            if (fallbackData) {
              facilities = fallbackData.map((row: any) => {
                // If it's a direct select, 'location' might be WKB or we need to extract from mock/fallback logic
                return {
                  id: row.id,
                  name: row.name,
                  type: row.type,
                  status: row.status,
                  accessibility: row.accessibility,
                  // In a direct select without PostGIS ST_AsGeoJSON, location is EWKB. 
                  // We default to Kochi for demo safety if we can't parse it.
                  latitude: row.latitude || 9.9312, 
                  longitude: row.longitude || 76.2673,
                  address: row.address || 'Kochi',
                  managed_by: row.managed_by || 'Unknown',
                  last_verified_at: row.last_verified_at,
                  confidence_score: 50,
                  distance_m: 0,
                  total_reports: row.total_reports || 0,
                  geojson: { type: 'Point', coordinates: [row.longitude || 76.2673, row.latitude || 9.9312] },
                } as Facility;
              });
            }
          } catch (fbErr) {
            console.error("Fallback select also failed", fbErr);
          }
        }

        if (facilities.length > 0) {
          await cacheFacilities(facilities);
        }
      }

      // Final fallback to mock data if absolutely necessary
      if (facilities.length === 0) {
        facilities = await getCachedFacilities();
        if (facilities.length === 0) {
          facilities = getMockFacilities(loc.latitude, loc.longitude, 50000);
        }
      }

      // Apply client-side filters
      let filtered = facilities;
      if (filters.type !== 'all') {
        filtered = filtered.filter((f) => f.type === filters.type);
      }
      if (filters.accessibility !== 'all') {
        filtered = filtered.filter((f) => f.accessibility === filters.accessibility);
      }
      if (filters.status !== 'all') {
        filtered = filtered.filter((f) => f.status === filters.status);
      }
      if (filters.minConfidence > 0) {
        filtered = filtered.filter((f) => f.confidence_score >= filters.minConfidence);
      }

      setFacilities(filtered);
      return filtered;
    },
    enabled: !!userLocation,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}
