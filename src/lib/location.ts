export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationError {
  message: string;
  code?: 'NOT_SUPPORTED' | 'INSECURE' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'TIMEOUT' | 'INVALID' | 'LOW_ACCURACY';
}

export const getFreshLocation = async (requireHighAccuracy = true, maxAcceptableAccuracy = 1000): Promise<LocationResult> => {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject({ message: 'Location requires a secure connection (HTTPS).', code: 'INSECURE' });
      return;
    }

    if (!('geolocation' in navigator)) {
      reject({ message: 'Geolocation is not supported by your browser.', code: 'NOT_SUPPORTED' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (
          !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180
        ) {
          reject({ message: 'Received invalid coordinates from device.', code: 'INVALID' });
          return;
        }

        if (requireHighAccuracy && accuracy > maxAcceptableAccuracy) {
          reject({ 
            message: `Location accuracy is low (${Math.round(accuracy)}m). Move to an open area and try again.`, 
            code: 'LOW_ACCURACY' 
          });
          return;
        }

        resolve({ latitude, longitude, accuracy });
      },
      (err) => {
        let code: LocationError['code'] = 'UNAVAILABLE';
        let message = 'Location unavailable. Please try again.';

        if (err.code === 1) { // PERMISSION_DENIED
          code = 'PERMISSION_DENIED';
          message = 'Location access denied. Please enable location permissions in your browser settings.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          code = 'UNAVAILABLE';
          message = 'Location unavailable. The device could not determine your position.';
        } else if (err.code === 3) { // TIMEOUT
          code = 'TIMEOUT';
          message = 'Location request timed out. Make sure you are in a clear area and try again.';
        }

        reject({ message, code });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000 // 15 seconds
      }
    );
  });
};
