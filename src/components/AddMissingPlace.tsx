import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre';
import {
  X,
  MapPin,
  Droplet,
  Sparkles,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Accessibility,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getFreshLocation } from '../lib/location';

interface AddMissingPlaceProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number };
  theme: 'light' | 'dark';
}

type FacilityTypeChoice = 'toilet' | 'drinking_water' | null;
type AccessibilityChoice = 'wheelchair' | 'limited' | 'unknown';

interface SubmissionForm {
  type: FacilityTypeChoice;
  latitude: number | null;
  longitude: number | null;
  name: string;
  address: string;
  landmark: string;
  description: string;
  accessibility: AccessibilityChoice;
}

function generateSubmissionId(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JS-PLACE-${date}-${rand}`;
}

export default function AddMissingPlace({ isOpen, onClose, userLocation, theme }: AddMissingPlaceProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SubmissionForm>({
    type: null,
    latitude: null,
    longitude: null,
    name: '',
    address: '',
    landmark: '',
    description: '',
    accessibility: 'unknown',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'map' | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapPinLocation, setMapPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationMapRef = useRef<MapRef>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setForm({
        type: null,
        latitude: null,
        longitude: null,
        name: '',
        address: '',
        landmark: '',
        description: '',
        accessibility: 'unknown',
      });
      setIsSubmitting(false);
      setSubmitError(null);
      setSubmitSuccess(false);
      setSubmissionId(null);
      setLocationMethod(null);
      setGeoError(null);
      setMapPinLocation(null);
    }
  }, [isOpen]);

  // Resize the location picker map when it becomes visible (step 2)
  useEffect(() => {
    if (step === 2 && locationMapRef.current) {
      // Small delay to let the container render with dimensions
      const timer = setTimeout(() => {
        locationMapRef.current?.resize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleUseCurrentLocation = useCallback(async () => {
    setGeoError(null);
    try {
      const { latitude, longitude } = await getFreshLocation(true, 150);
      setForm(prev => ({ ...prev, latitude, longitude }));
      setMapPinLocation({ lat: latitude, lng: longitude });
      setLocationMethod('gps');
      setGeoError(null);
    } catch (err: any) {
      setGeoError(err.message || 'Could not get location. Please try picking on map.');
    }
  }, []);

  const handleMapClick = useCallback((e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
    setMapPinLocation({ lat, lng });
    setLocationMethod('map');
    setGeoError(null);
  }, []);

  const checkDuplicates = async (lat: number, lng: number) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase.rpc('check_nearby_facilities', {
        check_lat: lat,
        check_lng: lng,
        radius_m: 50, // Flag if there is something very close
      });
      if (!error && data && data.length > 0) {
        setDuplicateWarning(data);
      } else {
        setDuplicateWarning([]);
      }
    } catch {
      setDuplicateWarning([]);
    }
  };

  const handleNext = () => {
    if (step === 2 && form.latitude && form.longitude) {
      checkDuplicates(form.latitude, form.longitude);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!form.type || !form.latitude || !form.longitude || !form.name.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Database not configured. Cannot submit.');
      }

      const { error } = await supabase.from('facility_submissions').insert({
        name: form.name.trim(),
        type: form.type,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address.trim() || null,
        landmark: form.landmark.trim() || null,
        description: form.description.trim() || null,
        accessibility: form.accessibility,
        status: 'pending',
        source: 'community',
        submitted_by: null, // Anonymous
      });

      if (error) throw error;

      const id = generateSubmissionId();
      setSubmissionId(id);
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        setSubmitError('Connection unavailable. Check your connection and try again.');
      } else {
        setSubmitError(err.message || 'This submission could not be saved. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return form.type !== null;
      case 2: return form.latitude !== null && form.longitude !== null;
      case 3: return form.name.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const stepLabels = ['Type', 'Location', 'Details', 'Review'];

  if (!isOpen) return null;

  const mapStyle = theme === 'dark'
    ? 'https://tiles.openfreemap.org/styles/dark'
    : 'https://tiles.openfreemap.org/styles/liberty';

  return (
    <div className="modal-backdrop" onMouseDown={onClose} style={{ zIndex: 110 }}>
      <div className="report-modal amp-modal" onMouseDown={e => e.stopPropagation()}>
        {submitSuccess ? (
          /* ============ SUCCESS STATE ============ */
          <div className="amp-success">
            <div className="amp-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h3>Submitted for verification</h3>
            <p>Your suggestion will appear on JanaSeva after admin verification.</p>

            <div className="amp-success-card">
              {submissionId && (
                <div className="amp-success-row">
                  <span>Reference</span>
                  <strong className="amp-ref-id">{submissionId}</strong>
                </div>
              )}
              <div className="amp-success-row">
                <span>Type</span>
                <strong>{form.type === 'toilet' ? '🚻 Public Restroom' : '💧 Drinking Water'}</strong>
              </div>
              <div className="amp-success-row">
                <span>Name</span>
                <strong>{form.name}</strong>
              </div>
              <div className="amp-success-row">
                <span>Status</span>
                <strong className="amp-status-pending">⏳ Pending review</strong>
              </div>
            </div>

            <button className="submit-report" style={{ marginTop: 20 }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          /* ============ WIZARD STEPS ============ */
          <div className="amp-wizard">
            {/* Header */}
            <div className="amp-header">
              <div className="amp-header-text">
                <span className="modal-kicker">ADD MISSING PLACE</span>
                <h3>Add a missing place</h3>
                <p className="amp-subtitle">Help improve public facility information in your area.</p>
              </div>
              <button className="close-button" onClick={onClose} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="amp-progress">
              {stepLabels.map((label, i) => (
                <div
                  key={label}
                  className={`amp-progress-step ${i + 1 <= step ? 'amp-step-active' : ''} ${i + 1 < step ? 'amp-step-done' : ''}`}
                >
                  <div className="amp-step-dot">
                    {i + 1 < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="amp-step-label">{label}</span>
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="amp-content">
              {/* STEP 1 — TYPE */}
              {step === 1 && (
                <div className="amp-step-body">
                  <h4>What type of facility is missing?</h4>
                  <div className="amp-type-grid">
                    <button
                      className={`amp-type-card ${form.type === 'toilet' ? 'amp-type-selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, type: 'toilet' }))}
                    >
                      <div className="amp-type-icon amp-icon-toilet">
                        <Sparkles size={28} />
                      </div>
                      <span className="amp-type-name">🚻 Public Restroom</span>
                      <span className="amp-type-desc">Toilet, washroom, or restroom facility</span>
                    </button>
                    <button
                      className={`amp-type-card ${form.type === 'drinking_water' ? 'amp-type-selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, type: 'drinking_water' }))}
                    >
                      <div className="amp-type-icon amp-icon-water">
                        <Droplet size={28} fill="currentColor" />
                      </div>
                      <span className="amp-type-name">💧 Drinking Water</span>
                      <span className="amp-type-desc">Water kiosk, tap, or station</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 — LOCATION */}
              {step === 2 && (
                <div className="amp-step-body">
                  <h4>Where is this facility?</h4>
                  <div className="amp-location-actions">
                    <button
                      className="amp-loc-btn amp-loc-gps"
                      onClick={handleUseCurrentLocation}
                    >
                      <LocateFixed size={18} />
                      Use my current location
                    </button>
                    <span className="amp-loc-or">or tap on the map below</span>
                  </div>

                  {geoError && (
                    <div className="amp-geo-error">
                      <AlertTriangle size={14} />
                      {geoError}
                    </div>
                  )}

                  <div className="amp-location-map-wrapper">
                    <Map
                      ref={locationMapRef}
                      initialViewState={{
                        latitude: mapPinLocation?.lat || userLocation.lat,
                        longitude: mapPinLocation?.lng || userLocation.lng,
                        zoom: 15,
                      }}
                      mapStyle={mapStyle}
                      style={{ width: '100%', height: '100%', borderRadius: 12 }}
                      onClick={handleMapClick}
                    >
                      {mapPinLocation && (
                        <Marker
                          latitude={mapPinLocation.lat}
                          longitude={mapPinLocation.lng}
                          anchor="bottom"
                        >
                          <div className="amp-pin-marker">
                            <MapPin size={28} fill="currentColor" />
                            <span className="amp-pin-pulse" />
                          </div>
                        </Marker>
                      )}
                    </Map>
                  </div>

                  {mapPinLocation && (
                    <div className="amp-coords-display">
                      <MapPin size={14} />
                      <span>{mapPinLocation.lat.toFixed(6)}, {mapPinLocation.lng.toFixed(6)}</span>
                      {locationMethod === 'gps' && <span className="amp-coords-badge">GPS</span>}
                      {locationMethod === 'map' && <span className="amp-coords-badge amp-coords-map">Map</span>}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — DETAILS */}
              {step === 3 && (
                <div className="amp-step-body">
                  <h4>Facility details</h4>
                  <div className="amp-form-fields">
                    <div className="amp-field">
                      <label>Place name <span className="amp-required">*</span></label>
                      <input
                        type="text"
                        placeholder={form.type === 'toilet' ? 'e.g., Public Toilet near Bus Stand' : 'e.g., Water Kiosk at Park Entrance'}
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        maxLength={120}
                      />
                    </div>
                    <div className="amp-field">
                      <label>Address / Landmark <span className="optional-tag">Optional</span></label>
                      <input
                        type="text"
                        placeholder="e.g., Near Railway Station, Main Road"
                        value={form.address}
                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                        maxLength={200}
                      />
                    </div>
                    <div className="amp-field">
                      <label>Description <span className="optional-tag">Optional</span></label>
                      <textarea
                        placeholder="Any helpful details about this facility..."
                        value={form.description}
                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        maxLength={500}
                        rows={3}
                      />
                    </div>
                    <div className="amp-field">
                      <label>Accessibility</label>
                      <div className="amp-access-options">
                        {([
                          { value: 'wheelchair' as const, icon: <Accessibility size={16} />, label: 'Wheelchair accessible' },
                          { value: 'limited' as const, icon: null, label: 'Limited accessibility' },
                          { value: 'unknown' as const, icon: null, label: 'Unknown' },
                        ]).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`amp-access-btn ${form.accessibility === opt.value ? 'amp-access-active' : ''}`}
                            onClick={() => setForm(prev => ({ ...prev, accessibility: opt.value }))}
                          >
                            {opt.icon}{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 — REVIEW */}
              {step === 4 && (
                <div className="amp-step-body">
                  <h4>Review your submission</h4>
                  <div className="amp-review-card">
                    <div className="amp-review-row">
                      <span>Type</span>
                      <strong>{form.type === 'toilet' ? '🚻 Public Restroom' : '💧 Drinking Water'}</strong>
                    </div>
                    <div className="amp-review-row">
                      <span>Name</span>
                      <strong>{form.name}</strong>
                    </div>
                    <div className="amp-review-row">
                      <span>Location</span>
                      <strong>{form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}</strong>
                    </div>
                    {form.address && (
                      <div className="amp-review-row">
                        <span>Address</span>
                        <strong>{form.address}</strong>
                      </div>
                    )}
                    <div className="amp-review-row">
                      <span>Accessibility</span>
                      <strong>
                        {form.accessibility === 'wheelchair' && '♿ Wheelchair accessible'}
                        {form.accessibility === 'limited' && 'Limited accessibility'}
                        {form.accessibility === 'unknown' && 'Unknown'}
                      </strong>
                    </div>
                    {form.description && (
                      <div className="amp-review-row">
                        <span>Description</span>
                        <strong>{form.description}</strong>
                      </div>
                    )}
                  </div>

                  {duplicateWarning.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex gap-3">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <strong className="block mb-1 text-[11px] uppercase tracking-wide">Possible Duplicates Found</strong>
                        <p className="mb-2">There are facilities already mapped near this location:</p>
                        <ul className="space-y-1">
                          {duplicateWarning.map(d => (
                            <li key={d.id} className="opacity-90">• {d.name} ({Math.round(d.distance_m)}m away)</li>
                          ))}
                        </ul>
                        <p className="mt-2 font-bold">You can still submit this if you are sure it's a new, unmapped place.</p>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="amp-geo-error" style={{ marginTop: 12 }}>
                      <AlertTriangle size={14} />
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="amp-footer">
              {step > 1 && (
                <button className="amp-btn-back" onClick={() => setStep(s => s - 1)} disabled={isSubmitting}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <div className="amp-footer-spacer" />
              {step < 4 ? (
                <button
                  className="amp-btn-next"
                  disabled={!canProceed()}
                  onClick={handleNext}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="amp-btn-submit"
                  disabled={isSubmitting || !canProceed()}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <><RefreshCw size={16} className="spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit for verification</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
