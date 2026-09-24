import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

// Default: Kochi, Kerala center (South Kochi)
const KOCHI_CENTER = { latitude: 9.9312, longitude: 76.2673, accuracy: 100 };

export function useGeolocation() {
  const { setUserLocation, setLocationError } = useAppStore();

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation not supported');
      setUserLocation(KOCHI_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationError(err.message);
        // Fallback to Kochi center
        setUserLocation(KOCHI_CENTER);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [setUserLocation, setLocationError]);

  useEffect(() => {
    requestLocation();

    // Watch for position changes
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {}, // Silently ignore watch errors
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [requestLocation, setUserLocation]);

  return { requestLocation };
}
