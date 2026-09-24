import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Accessibility,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplet,
  Image as ImageIcon,
  LocateFixed,
  Lock,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
  Sun,
  Moon,
  Layers,
  Map as MapIcon,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import AddMissingPlace from './components/AddMissingPlace';
import AdminPanel from './components/AdminPanel';

// Import local OSM GeoJSON
import osmData1 from './data/export.json';
import osmData2 from './data/export(1).json';
import osmData3 from './data/export(2).json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null as any;

const DEMO_LOCATION = { lat: 10.0070408, lng: 76.3656069 }; // JAIN University / Nirmal Infopark

const ROBUST_FALLBACK_DATA = [
  { id: 'fb-1', type: 'toilet', lat: 10.0071, lng: 76.3657, name: 'JAIN University Block A Restroom', is_accessible: true, status: 'clean', confidence_score: 0.98, last_verified_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'fb-2', type: 'water', lat: 10.0068, lng: 76.3652, name: 'JAIN University Cafeteria Water', is_accessible: true, status: 'clean', confidence_score: 0.95, last_verified_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'fb-3', type: 'toilet', lat: 10.0075, lng: 76.3660, name: 'Nirmal Infopark Ground Floor', is_accessible: true, status: 'usable', confidence_score: 0.80, last_verified_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'fb-4', type: 'toilet', lat: 10.00364, lng: 76.37059, name: 'InfoPark 2nd Gate Restroom', is_accessible: true, status: 'clean', confidence_score: 0.88, last_verified_at: new Date(Date.now() - 43200000).toISOString() },
  { id: 'fb-5', type: 'water', lat: 10.0040, lng: 76.3710, name: 'InfoPark Express Water Kiosk', is_accessible: true, status: 'no-water', confidence_score: 0.40, last_verified_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 'fb-6', type: 'toilet', lat: 10.0080, lng: 76.3640, name: 'Kusumagiri Road Public Toilet', is_accessible: false, status: 'broken', confidence_score: 0.25, last_verified_at: new Date(Date.now() - 500000000).toISOString() },
  { id: 'fb-7', type: 'water', lat: 10.0055, lng: 76.3680, name: 'Infopark Expressway Hydration', is_accessible: true, status: 'clean', confidence_score: 0.92, last_verified_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'fb-8', type: 'toilet', lat: 10.0090, lng: 76.3670, name: 'Edachira Junction Restroom', is_accessible: true, status: 'usable', confidence_score: 0.70, last_verified_at: new Date(Date.now() - 250000000).toISOString() },
  { id: 'fb-9', type: 'toilet', lat: 10.0025, lng: 76.3690, name: 'Rajagiri Valley Transit Stop', is_accessible: false, status: 'locked', confidence_score: 0.35, last_verified_at: new Date(Date.now() - 400000000).toISOString() },
  { id: 'fb-10', type: 'toilet', lat: 10.0060, lng: 76.3620, name: 'Kakkanad Civil Station Area', is_accessible: true, status: 'clean', confidence_score: 0.95, last_verified_at: new Date().toISOString() },
  { id: 'fb-11', type: 'water', lat: 10.0045, lng: 76.3665, name: 'SmartCity Pavilion Water', is_accessible: true, status: 'clean', confidence_score: 0.99, last_verified_at: new Date().toISOString() },
  { id: 'fb-12', type: 'toilet', lat: 10.0085, lng: 76.3630, name: 'Kakkanad Community Center', is_accessible: true, status: 'usable', confidence_score: 0.65, last_verified_at: new Date(Date.now() - 300000000).toISOString() },
  { id: 'fb-13', type: 'toilet', lat: 10.0010, lng: 76.3720, name: 'Brahmapuram Road Stop', is_accessible: false, status: 'broken', confidence_score: 0.30, last_verified_at: new Date(Date.now() - 450000000).toISOString() },
  { id: 'fb-14', type: 'toilet', lat: 10.0065, lng: 76.3695, name: 'Tech Park Utility Block', is_accessible: true, status: 'clean', confidence_score: 0.85, last_verified_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'fb-15', type: 'toilet', lat: 10.0050, lng: 76.3645, name: 'Athani Public Restroom', is_accessible: false, status: 'locked', confidence_score: 0.45, last_verified_at: new Date(Date.now() - 600000000).toISOString() },
];

interface Facility {
  id: string;
  type: 'toilet' | 'water';
  lat: number;
  lng: number;
  is_accessible: boolean | null;
  status: 'clean' | 'usable' | 'broken' | 'locked' | 'no-water' | 'no_water' | 'mapped';
  confidence_score: number;
  last_verified_at: string | null;
  name?: string;
  distance_meters?: number;
  data_source: 'live' | 'osm' | 'demo' | 'community';
  condition_known: boolean;
  gender?: 'male' | 'female' | 'unisex';
  is_baby_friendly?: boolean;
  source?: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function timeAgo(dateStr: string) {
  const diffMins = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function isIssue(f: Facility) {
  if (!f.condition_known) return false;
  return f.status === 'broken' || f.status === 'locked' || f.status === 'no-water' || f.status === 'no_water';
}

function statusLabel(status: Facility['status'], conditionKnown: boolean, type: Facility['type'] = 'toilet') {
  if (!conditionKnown) return 'MAPPED';
  if (type === 'water') {
    if (status === 'clean' || status === 'usable') return 'WATER AVAILABLE';
    if (status === 'broken' || status === 'locked') return 'TEMPORARILY UNAVAILABLE';
    if (status === 'no-water' || status === 'no_water') return 'NO WATER';
  }
  return status.replace('-', ' ').replace('_', ' ').toUpperCase();
}

function parseOSMFeatures(): Facility[] {
  const allOsmFeatures = [
    ...(osmData1.features || []),
    ...(osmData2.features || []),
    ...(osmData3.features || [])
  ];

  const parsed = allOsmFeatures.map((f: any) => {
    const props = (f.properties || {}) as any;
    const geom = (f.geometry || {}) as any;
    const coords = geom.coordinates || [76.3656, 10.007];
    
    let type: 'toilet' | 'water' = 'toilet';
    if (props.amenity === 'drinking_water' || props.drinking_water === 'yes' || props.man_made === 'water_tap') {
      type = 'water';
    }
    
    let is_accessible = null;
    if (props.wheelchair === 'yes') is_accessible = true;
    if (props.wheelchair === 'no') is_accessible = false;

    return {
      id: `osm-${f.id || Math.random()}`,
      type,
      lat: coords[1],
      lng: coords[0],
      is_accessible,
      status: 'mapped' as const,
      confidence_score: 0.20,
      last_verified_at: null,
      name: props.name || (type === 'water' ? 'OSM Water Point' : 'OSM Public Toilet'),
      data_source: 'osm' as const,
      condition_known: false
    };
  });

  // Curated real locations with reliable coordinates
  parsed.push({
    id: 'osm-curated-credai',
    type: 'toilet',
    lat: 10.0185876, 
    lng: 76.3439941,
    name: 'CREDAI Public Toilet (Kakkanad Civil Station)',
    is_accessible: null,
    status: 'mapped',
    confidence_score: 0.25,
    last_verified_at: null,
    data_source: 'osm',
    condition_known: false
  });

  return parsed;
}

const ESRI_SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function App() {
  const mapRef = useRef<MapRef>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [userLocation, setUserLocation] = useState(DEMO_LOCATION);
  const [filter, setFilter] = useState<'all' | 'toilet' | 'water'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportingFacility, setReportingFacility] = useState<Facility | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [findMode, setFindMode] = useState<'nearest' | 'usable'>('nearest');
  const [accessibilityFilter, setAccessibilityFilter] = useState<'all' | 'accessible' | 'baby'>('all');
  const [submittedTicket, setSubmittedTicket] = useState<{id: string, time: string, imageUrl?: string} | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [restroomFilter, setRestroomFilter] = useState<'all' | 'male' | 'female' | 'unisex' | 'accessible'>('all');
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('jalsaaf_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('jalsaaf_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [reportData, setReportData] = useState({
    issueType: '',
    otherIssue: '',
    photo: null as File | null,
    photoPreview: null as string | null,
    description: '',
    severity: 'low',
    accessibilityAffected: false,
    waterAvailable: true,
    cleanliness: 'clean',
  });
  const [photoError, setPhotoError] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) return;

    console.log({
      name: file.name,
      type: file.type,
      size: file.size
    });
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 5 MB.');
      return;
    }
    
    if (reportData.photoPreview) URL.revokeObjectURL(reportData.photoPreview);
    
    setReportData(prev => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file)
    }));
  };

  const clearPhoto = () => {
    if (reportData.photoPreview) URL.revokeObjectURL(reportData.photoPreview);
    setReportData(prev => ({ ...prev, photo: null, photoPreview: null }));
    setPhotoError('');
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!reportingFacility) {
      clearPhoto();
      setReportData({
        issueType: '',
        otherIssue: '',
        photo: null,
        photoPreview: null,
        description: '',
        severity: 'low',
        accessibilityAffected: false,
        waterAvailable: true,
        cleanliness: 'clean'
      });
      setReportSuccess(false);
      setSubmittedTicket(null);
    }
  }, [reportingFacility]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(DEMO_LOCATION),
        { enableHighAccuracy: true },
      );
    }
  }, []);

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      
      const osmFacilities = parseOSMFeatures();
      const fallbackFacilities = ROBUST_FALLBACK_DATA.map(f => ({
        ...f,
        type: f.type as 'toilet' | 'water',
        status: f.status as 'clean'|'usable'|'broken'|'locked'|'no-water',
        data_source: 'demo' as const,
        condition_known: true
      }));

      try {
        const { data, error } = await supabase.rpc('get_ranked_facilities', {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_m: 25000,
        });

        if (error) throw error;
        setIsLiveConnected(true);

        let liveParsed: Facility[] = [];
        if (data && data.length > 0) {
          liveParsed = data.map((item: any) => ({
            ...item,
            lng: Number(item.longitude || 76.345),
            lat: Number(item.latitude || 10.015),
            name: item.name || (item.type === 'water' ? 'Public Drinking Point' : 'Public Sanitation Facility'),
            data_source: 'live',
            condition_known: true
          }));
        }

        const liveIds = new Set(liveParsed.map(f => f.id));
        const filteredOsm = osmFacilities.filter(f => !liveIds.has(f.id));
        const filteredFallback = fallbackFacilities.filter(f => !liveIds.has(f.id));

        // Also fetch approved community facilities
        let communityFacilities: Facility[] = [];
        try {
          const { data: communityData } = await supabase
            .from('facilities')
            .select('*')
            .eq('source', 'community')
            .limit(100);
          if (communityData && communityData.length > 0) {
            communityFacilities = communityData.map((row: any) => ({
              id: row.id,
              type: row.type === 'drinking_water' ? 'water' : row.type,
              lat: row.latitude || 10.007,
              lng: row.longitude || 76.365,
              name: row.name || 'Community Facility',
              is_accessible: row.accessibility === 'wheelchair',
              status: row.status || 'usable',
              confidence_score: 0.70,
              last_verified_at: row.last_verified_at,
              data_source: 'community' as const,
              condition_known: true,
              source: 'community',
            }));
          }
        } catch { /* silently continue */ }
        const communityIds = new Set(communityFacilities.map(f => f.id));
        
        if (liveParsed.length === 0) {
          setFacilities([...filteredOsm, ...filteredFallback, ...communityFacilities.filter(f => !liveIds.has(f.id))]);
        } else {
          setFacilities([...liveParsed.filter(f => !communityIds.has(f.id)), ...filteredOsm, ...communityFacilities.filter(f => !liveIds.has(f.id))]);
        }
      } catch (err) {
        console.error("Supabase RPC failed:", err);
        setIsLiveConnected(false);
        setFacilities([...osmFacilities, ...fallbackFacilities]);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, [userLocation]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('public:facilities')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'facilities' }, (payload: any) => {
        const updated = payload.new;
        setFacilities(current => current.map(f => 
          f.id === updated.id ? { 
            ...f, 
            status: updated.status, 
            last_verified_at: updated.last_verified_at,
            total_reports: updated.total_reports
          } : f
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processedFacilities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return facilities
      .map(f => ({ ...f, distance_meters: getDistance(userLocation.lat, userLocation.lng, f.lat, f.lng) }))
      .filter(f => filter === 'all' || f.type === filter)
      .filter(f => {
        if (sourceFilter === 'all') return true;
        if (sourceFilter === 'real') return f.data_source === 'osm' || f.data_source === 'live' || f.data_source === 'community';
        return f.data_source === 'demo';
      })
      .filter(f => statusFilter === 'all' || (statusFilter === 'issues' ? isIssue(f) : !isIssue(f)))
      .filter(f => accessibilityFilter === 'all' || (accessibilityFilter === 'accessible' && f.is_accessible) || (accessibilityFilter === 'baby' && f.is_baby_friendly))
      .filter(f => {
        if (filter === 'toilet' && restroomFilter !== 'all') {
          if (restroomFilter === 'accessible') return f.is_accessible;
          return f.gender === restroomFilter;
        }
        return true;
      })
      .filter(f => {
         if (findMode === 'usable') {
           return !['broken', 'locked', 'no-water', 'no_water'].includes(f.status);
         }
         return true;
      })
      .filter(f => !q || (f.name || '').toLowerCase().includes(q) || statusLabel(f.status, f.condition_known, f.type).toLowerCase().includes(q) || f.data_source.includes(q))
      .sort((a, b) => {
        if (findMode === 'usable') {
          const confA = a.confidence_score ?? 50;
          const confB = b.confidence_score ?? 50;
          if (Math.abs(confB - confA) > 10) return confB - confA;
        }
        return (a.distance_meters || 0) - (b.distance_meters || 0);
      });
  }, [facilities, userLocation, filter, sourceFilter, statusFilter, accessibilityFilter, findMode, searchQuery]);

  const stats = useMemo(() => ({
    total: processedFacilities.length,
    water: processedFacilities.filter(f => f.type === 'water').length,
    restrooms: processedFacilities.filter(f => f.type === 'toilet').length,
    issues: processedFacilities.filter(isIssue).length,
  }), [processedFacilities]);

  const handleSelectFacility = (f: Facility) => {
    setSelectedFacility(f);
    setShowDetailSheet(true);
    mapRef.current?.flyTo({ center: [f.lng, f.lat], zoom: 16, duration: 900, essential: true });
    const card = document.getElementById(`facility-${f.id}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const recenter = () => {
    mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15, duration: 800, essential: true });
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.issueType || !reportingFacility) return;
    setIsSubmittingReport(true);
    
    try {
      if (reportingFacility.data_source === 'live') {
        const ticketNumber = `JLS-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
        
        // 1. Create DB record first
        const { data: dbTicket, error: dbError } = await supabase.from('tickets').insert({
          facility_id: reportingFacility.id,
          device_id: '00000000-0000-0000-0000-000000000000',
          reported_status: 'broken',
          issue_type: reportData.issueType,
          severity: reportData.severity,
          photo_path: null,
          accessibility_affected: reportData.accessibilityAffected,
          water_available: reportData.waterAvailable,
          cleanliness: reportData.cleanliness,
          other_issue: reportData.otherIssue,
          ticket_number: ticketNumber
        }).select().single();

        if (dbError) throw dbError;
        if (!dbTicket) throw new Error("Failed to create ticket record");

        let uploadedPhotoPath = null;
        if (reportData.photo) {
          const safeName = reportData.photo.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
          const fileName = `${Date.now()}-${safeName}`;
          const filePath = `reports/${dbTicket.id}/${fileName}`;
          
          console.log('Uploading photo:', { name: reportData.photo.name, size: reportData.photo.size, path: filePath });
          
          const { error: uploadError } = await supabase.storage
            .from('report-images')
            .upload(filePath, reportData.photo);
            
          if (uploadError) {
            console.error("Photo upload failed:", uploadError);
            setPhotoError("Photo upload failed. Please try again.");
            throw new Error("Photo upload failed.");
          }
          
          uploadedPhotoPath = filePath;
          console.log('Photo uploaded successfully to:', uploadedPhotoPath);
          
          // 2. Update the DB record with the photo path
          const { error: updateError } = await supabase.from('tickets')
            .update({ photo_path: uploadedPhotoPath })
            .eq('id', dbTicket.id);
            
          if (updateError) {
            console.error("Failed to update photo_path in DB:", updateError);
            throw updateError;
          }
        }
        
        let finalImageUrl;
        if (uploadedPhotoPath) {
          const { data } = supabase.storage.from('report-images').getPublicUrl(uploadedPhotoPath);
          finalImageUrl = data.publicUrl;
        }
        
        setSubmittedTicket({ id: ticketNumber, time: new Date().toISOString(), imageUrl: finalImageUrl });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setSubmittedTicket({ id: `JLS-DEMO-${Math.floor(Math.random()*10000)}`, time: new Date().toISOString() });
      }
      
      setReportSuccess(true);
    } catch (err) {
      console.error(err);
      setSubmittedTicket({ id: `JLS-ERR-${Math.floor(Math.random()*10000)}`, time: new Date().toISOString() });
      setReportSuccess(false);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedFacility) return;
    setIsVerifying(true);
    try {
      if (selectedFacility.data_source === 'live') {
        await supabase.from('facilities').update({ last_verified_at: new Date().toISOString() }).eq('id', selectedFacility.id);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      alert('Verification recorded. Thank you!');
      setShowDetailSheet(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] max-w-md border border-slate-100">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Configuration Error</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            The application cannot start because the following required Vercel environment variables are missing:
          </p>
          <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left border border-slate-200">
            <code className="block text-sm font-bold text-slate-700 mb-2">VITE_SUPABASE_URL</code>
            <code className="block text-sm font-bold text-slate-700">VITE_SUPABASE_ANON_KEY</code>
          </div>
          <p className="text-sm text-slate-500">
            Please configure these exact variable names in your Vercel Dashboard and trigger a new deployment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="jal-root">
      <div className="map-layer">
        <Map
          initialViewState={{ latitude: DEMO_LOCATION.lat, longitude: DEMO_LOCATION.lng, zoom: 14.5 }}
          mapStyle={mapType === 'satellite' ? ESRI_SATELLITE_STYLE : theme === 'dark' ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"}
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Native navigation control removed in favor of unified UI stack */}

          <Marker anchor="center" latitude={userLocation.lat} longitude={userLocation.lng}>
            <div className="user-marker" aria-label="Your location">
              <span className="user-marker-pulse" />
              <span className="user-marker-core" />
            </div>
          </Marker>

          {processedFacilities.map(f => {
            const issue = isIssue(f);
            const selected = selectedFacility?.id === f.id;
            const markerClass = !f.condition_known ? 'marker-osm' : issue ? 'marker-issue' : f.type === 'water' ? 'marker-water' : 'marker-toilet';
            
            return (
              <Marker
                anchor="bottom"
                key={f.id}
                latitude={f.lat}
                longitude={f.lng}
                onClick={(e) => { e.originalEvent.stopPropagation(); handleSelectFacility(f); }}
              >
                <button className={`map-marker ${markerClass} ${selected ? 'marker-selected' : ''}`} aria-label={f.name}>
                  {issue && !selected && <span className="marker-pulse" />}
                  {f.type === 'water' ? <Droplet size={17} fill="currentColor" /> : <Sparkles size={17} />}
                </button>
              </Marker>
            );
          })}
        </Map>
      </div>

      <header className="brand-card glass-card">
        <div className="brand-mark">
          <img src="/logo.png" alt="JanaSeva Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="brand-copy">
          <div className="brand-title-row">
            <h1>JanaSeva</h1>
            <span className="live-pill" style={{backgroundColor: isLiveConnected ? '#dcfce7' : '#fee2e2', color: isLiveConnected ? '#166534' : '#991b1b'}}>
              <span style={{backgroundColor: isLiveConnected ? '#16a34a' : '#ef4444', animation: isLiveConnected ? 'pulse 2s infinite' : 'none'}} /> 
              {isLiveConnected ? 'LIVE DATA' : 'DEMO DATA'}
            </span>
          </div>
          <p>Discover. Verify. Report. Resolve.</p>
        </div>
        <button
          className="ml-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
          onClick={() => setShowAdminPanel(true)}
          title="Admin Panel"
          aria-label="Admin Panel"
        >
          <Shield size={18} />
        </button>
        <button
          className="ml-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Bright Mode'}
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Bright Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>
      
      <div className="map-legend glass-card">
        <div className="legend-title">MAP LEGEND</div>
        <div className="legend-grid">
          <div><span className="l-dot l-toilet"/> Sanitation</div>
          <div><span className="l-dot l-water"/> Drinking Water</div>
          <div><span className="l-dot l-issue"/> Reported issue</div>
        </div>
        <div className="legend-divider" />
        <div className="legend-grid">
          <div><span className="l-circle"/> Live network</div>
          <div><span className="l-circle l-osm"/> OSM mapped</div>
          <div><span className="l-circle l-demo"/> Demo fallback</div>
        </div>
      </div>

      <div className="absolute top-5 right-5 z-30 flex flex-col items-end gap-3">
        {/* Map status + zoom */}
        <div className="flex items-center overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex h-11 items-center gap-2 px-4">
            <span className={`h-2.5 w-2.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]'}`} />
            <span className="text-[11px] font-bold text-slate-700">
              {isLiveConnected ? 'Network online' : 'Live data unavailable'}
            </span>
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <span className="text-[11px] font-black text-slate-800">
              {stats.total || 0} mapped
            </span>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center border-l border-slate-100 text-slate-800 transition hover:bg-slate-50 active:scale-95"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
          >
            +
          </button>
        </div>

        {/* Recenter */}
        <button
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/95 text-blue-600 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:bg-white hover:scale-[1.03] active:scale-95 dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] dark:text-blue-400 dark:hover:bg-slate-700"
          aria-label="Recenter map"
          onClick={recenter}
        >
          <LocateFixed className="h-5 w-5" />
        </button>

        {/* Map Type Toggle */}
        <button
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/95 text-slate-700 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:bg-white hover:scale-[1.03] active:scale-95 dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Toggle map style"
          onClick={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        >
          {mapType === 'standard' ? <Layers className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
        </button>
      </div>

      <section className="facility-panel">
        <div className="panel-grabber" />
        <div className="panel-head">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> NEAR YOU</div>
            <h2>Public essentials</h2>
            <p>Find clean water and accessible sanitation around Kochi.</p>
          </div>
          <button className="refresh-button" onClick={() => window.location.reload()} aria-label="Refresh data"><RefreshCw size={17} /></button>
        </div>

        <div className="stats-row">
          <div onClick={() => { setFilter('all'); setStatusFilter('all'); }} style={{cursor: 'pointer'}}><strong>{stats.total}</strong><span>Places</span></div>
          <div onClick={() => setFilter('water')} style={{cursor: 'pointer'}}><strong>{stats.water}</strong><span>Water</span></div>
          <div onClick={() => setFilter('toilet')} style={{cursor: 'pointer'}}><strong>{stats.restrooms}</strong><span>Restrooms</span></div>
          <div className="stat-alert" onClick={() => setStatusFilter('issues')} style={{cursor: 'pointer'}}><strong>{stats.issues}</strong><span>Needs attention</span></div>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search facilities..." aria-label="Search facilities" />
          {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button>}
        </div>

        {/* Add Missing Place Button — Desktop */}
        <div className="hidden md:flex px-4 mb-2">
          <button className="amp-fab" onClick={() => setShowAddPlace(true)}>
            <Plus size={16} />
            <span className="amp-fab-text">Add missing place</span>
          </button>
        </div>

        <div className="flex justify-between items-center px-4 mb-3 mt-2">
          <div className="flex gap-2">
            <button className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${findMode === 'nearest' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setFindMode('nearest')}>Nearest</button>
            <button className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${findMode === 'usable' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setFindMode('usable')}>Nearest Usable</button>
          </div>
          <button className="text-[11px] font-bold text-slate-500 underline uppercase tracking-wide" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-b border-slate-100 mb-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Type</span>
              {[['all', 'All'], ['toilet', 'Restrooms'], ['water', 'Water']].map(([id, label]) => (
                <button key={id} className={`px-3 py-1 rounded-md text-xs font-semibold ${filter === id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`} onClick={() => { setFilter(id as typeof filter); setRestroomFilter('all'); }}>{label}</button>
              ))}
            </div>

            {filter === 'toilet' && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Restroom Type</span>
                {[['all', 'All'], ['male', 'Male'], ['female', 'Female'], ['unisex', 'Unisex'], ['accessible', 'Accessible']].map(([id, label]) => (
                  <button key={id} className={`px-3 py-1 rounded-md text-xs font-semibold ${restroomFilter === id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`} onClick={() => setRestroomFilter(id as any)}>{label}</button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Accessibility</span>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${accessibilityFilter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`} onClick={() => setAccessibilityFilter('all')}>All</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${accessibilityFilter === 'accessible' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`} onClick={() => setAccessibilityFilter('accessible')}>♿ Wheelchair Accessible</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${accessibilityFilter === 'baby' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`} onClick={() => setAccessibilityFilter('baby')}>👶 Baby/Family Friendly</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Condition</span>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setStatusFilter('all')}>All</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setStatusFilter('available')}>Available</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${statusFilter === 'issues' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setStatusFilter('issues')}>Needs attention</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-full">Data Source</span>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${sourceFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setSourceFilter('all')}>All</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${sourceFilter === 'real' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setSourceFilter('real')}>Live + OSM</button>
              <button className={`px-3 py-1 rounded-md text-xs font-semibold ${sourceFilter === 'demo' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setSourceFilter('demo')}>Demo</button>
            </div>
          </div>
        )}

        <div className="facility-list" ref={listRef}>
          {loading ? (
            <div className="empty-state"><RefreshCw className="spin" size={22} /><strong>Loading nearby places</strong><span>Connecting to the civic network...</span></div>
          ) : processedFacilities.length === 0 ? (
            <div className="empty-state"><Search size={22} /><strong>No places found</strong><span>Try another search or filter.</span></div>
          ) : processedFacilities.map(f => {
            const issue = isIssue(f);
            const selected = selectedFacility?.id === f.id;
            const trust = Math.round(f.confidence_score * 100);
            return (
              <article id={`facility-${f.id}`} key={f.id} onClick={() => handleSelectFacility(f)} className={`facility-card ${selected ? 'facility-selected' : ''}`}>
                <div className={`facility-icon ${!f.condition_known ? 'osm-icon' : f.type === 'water' ? 'water-icon' : 'toilet-icon'} ${issue ? 'issue-icon' : ''}`}>
                  {f.type === 'water' ? <Droplet size={22} fill="currentColor" /> : <Sparkles size={22} />}
                </div>
                <div className="facility-main">
                  <div className="facility-title-line">
                    <h3>{f.name}</h3>
                    {f.is_accessible && <span className="accessibility-badge" title="Accessible"><Accessibility size={13} /></span>}
                  </div>
                  <div className="facility-meta">
                    <span className="distance"><MapPin size={12} /> {f.distance_meters && f.distance_meters < 1000 ? `${Math.round(f.distance_meters)}m` : `${((f.distance_meters || 0) / 1000).toFixed(1)}km`}</span>
                    <span className={issue ? 'condition issue' : !f.condition_known ? 'condition osm' : 'condition'}><i /> {statusLabel(f.status, f.condition_known)}</span>
                  </div>
                </div>
                <ChevronRight className="card-arrow" size={18} />

                <div className="facility-footer">
                  <div>
                    {f.condition_known ? (
                      <span className={`trust-badge ${trust >= 80 ? 'trust-high' : trust >= 50 ? 'trust-mid' : 'trust-low'}`}>{trust}% trust score</span>
                    ) : (
                      <span className="trust-badge trust-mid">Location mapped</span>
                    )}
                    <span className="verified"><Clock3 size={12} /> {f.last_verified_at ? `Verified ${timeAgo(f.last_verified_at)}` : 'Unverified'}</span>
                  </div>
                  
                  <div className="card-actions">
                    <div className="source-indicator">
                      {f.data_source === 'osm' && <span className="src-badge src-osm">● OSM mapped</span>}
                      {f.data_source === 'live' && <span className="src-badge src-live">● Live network</span>}
                      {f.data_source === 'demo' && <span className="src-badge src-demo">● Demo fallback</span>}
                      {f.data_source === 'community' && <span className="src-badge src-community">● Community Added</span>}
                    </div>
                    <button className="report-button" onClick={(e) => { e.stopPropagation(); setReportingFacility(f); }}><AlertTriangle size={14} /> Report</button>
                    <a className="route-button" href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Route <Navigation size={14} /></a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedFacility && showDetailSheet && (
        <div className="modal-backdrop" onMouseDown={() => setShowDetailSheet(false)} style={{zIndex: 40}}>
          <div className="report-modal" onMouseDown={e => e.stopPropagation()} style={{padding: '0', display: 'flex', flexDirection: 'column'}}>
            <div className="flex justify-between items-start p-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 rounded-full items-center justify-center text-white ${isIssue(selectedFacility) ? 'bg-red-500' : !selectedFacility.condition_known ? 'bg-slate-400' : selectedFacility.type === 'water' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                  {selectedFacility.type === 'water' ? <Droplet size={24} fill="currentColor" /> : <Sparkles size={24} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{selectedFacility.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{selectedFacility.type === 'water' ? 'Water Point' : 'Public Restroom'}</span>
                    {selectedFacility.is_accessible && <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"><Accessibility size={10} /> Accessible</span>}
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setShowDetailSheet(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{maxHeight: '60vh'}}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    {selectedFacility.distance_meters && selectedFacility.distance_meters < 1000 ? `${Math.round(selectedFacility.distance_meters)}m away` : `${((selectedFacility.distance_meters || 0) / 1000).toFixed(1)}km away`}
                  </div>
                  <div className={`mt-1 font-black text-sm flex items-center gap-1.5 ${isIssue(selectedFacility) ? 'text-red-600' : !selectedFacility.condition_known ? 'text-slate-500' : 'text-emerald-600'}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {statusLabel(selectedFacility.status, selectedFacility.condition_known, selectedFacility.type)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-800">{Math.round(selectedFacility.confidence_score * 100)}% TRUST</div>
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5 justify-end">
                    <Clock3 size={11} /> {selectedFacility.last_verified_at ? `Verified ${timeAgo(selectedFacility.last_verified_at)}` : 'Unverified'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                  <Navigation size={18} /> Route
                </a>
                <button onClick={() => { setShowDetailSheet(false); setReportingFacility(selectedFacility); }} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 px-4 rounded-xl transition-colors">
                  <AlertTriangle size={18} /> Report
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Community Verification</h4>
                <p className="text-sm text-slate-700 font-medium mb-3">Is this information still accurate?</p>
                <div className="flex gap-2">
                  <button onClick={handleVerify} disabled={isVerifying} className="flex-1 bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                    {isVerifying ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
                    Yes, it's accurate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportingFacility && (
        <div className="modal-backdrop" onMouseDown={() => setReportingFacility(null)}>
          <div className="report-modal" onMouseDown={e => e.stopPropagation()}>
            {reportSuccess ? (
              <div className="success-state">
                <div className="success-icon"><CheckCircle2 size={32} /></div>
                <h3>Report Submitted</h3>
                
                <div className="bg-slate-50 rounded-xl p-4 w-full mt-4 border border-slate-100 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Report ID</span>
                    <span className="text-sm font-black text-slate-800 font-mono bg-white px-2 py-1 rounded border border-slate-200">{submittedTicket?.id || 'JLS-PENDING'}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Facility</span>
                    <span className="text-sm font-bold text-slate-800">{reportingFacility.name}</span>
                  </div>
                  
                  {submittedTicket?.imageUrl && (
                    <div className="mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Photo Evidence</span>
                      <img src={submittedTicket.imageUrl} alt="Uploaded evidence" className="w-full h-40 object-cover rounded-lg border border-slate-200 mt-1" />
                    </div>
                  )}
                  
                  <div className="mb-5">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Issue</span>
                    <span className="text-sm font-bold text-slate-800">{reportData.issueType === 'Other' ? reportData.otherIssue : reportData.issueType}</span>
                  </div>

                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-3">
                        <div className="text-[11px] font-bold text-blue-600 uppercase">Submitted</div>
                        <div className="text-[10px] text-slate-500">{timeAgo(submittedTicket?.time || new Date().toISOString())}</div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-3 opacity-50">
                        <div className="text-[11px] font-bold text-slate-600 uppercase">Under Review</div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-3 opacity-50">
                        <div className="text-[11px] font-bold text-slate-600 uppercase">Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="submit-report mt-5" onClick={() => setReportingFacility(null)}>Close Tracker</button>
              </div>
            ) : (
              <form onSubmit={handleReport} className="report-form-container" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <div className="modal-header-sticky">
                  <div className="modal-title-row">
                    <div><span className="modal-kicker">REPORT INCIDENT</span><h3>{reportingFacility.name}</h3></div>
                    <button type="button" className="close-button" onClick={() => setReportingFacility(null)} aria-label="Close report form"><X size={19} /></button>
                  </div>
                </div>
                
                <div className="modal-scroll-area">
                  <div className="report-section">
                    <h4>What’s wrong?</h4>
                    <div className="issue-grid">
                      {[
                        { id: 'Broken / Damaged', icon: AlertTriangle },
                        { id: 'Locked / Inaccessible', icon: Lock },
                        { id: 'No Water', icon: Droplet },
                        { id: 'Dirty / Unhygienic', icon: Sparkles },
                        { id: 'Unsafe Surroundings', icon: ShieldCheck },
                        { id: 'Other', icon: Search }
                      ].map(opt => {
                        const Icon = opt.icon;
                        const isSelected = reportData.issueType === opt.id;
                        return (
                          <button 
                            key={opt.id} 
                            type="button" 
                            className={`issue-card ${isSelected ? 'issue-selected' : ''}`}
                            onClick={() => setReportData(prev => ({...prev, issueType: opt.id}))}
                          >
                            <Icon size={20} />
                            <span>{opt.id}</span>
                          </button>
                        );
                      })}
                    </div>
                    {reportData.issueType === 'Other' && (
                      <input 
                        className="other-issue-input" 
                        placeholder="Specify the issue" 
                        value={reportData.otherIssue} 
                        onChange={e => setReportData(prev => ({...prev, otherIssue: e.target.value}))} 
                        required 
                      />
                    )}
                  </div>

                  <div className="report-section">
                    <h4>Photo Evidence <span className="optional-tag">Optional</span></h4>
                    
                    {!reportData.photoPreview ? (
                      <div className="photo-upload-row">
                        <label className="photo-action-btn primary">
                          <Camera size={18} /> Take Photo
                          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{display: 'none'}} />
                        </label>
                        <label className="photo-action-btn secondary">
                          <Upload size={18} /> Upload Photo
                          <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{display: 'none'}} />
                        </label>
                      </div>
                    ) : (
                      <div className="photo-preview-box">
                        <img src={reportData.photoPreview} alt="Preview" />
                        <div className="photo-preview-actions">
                          <div className="photo-name"><ImageIcon size={14} /> {reportData.photo?.name}</div>
                          <div>
                            <label className="icon-action-btn" aria-label="Change photo">
                              <RefreshCw size={14} />
                              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{display: 'none'}} />
                            </label>
                            <button type="button" className="icon-action-btn danger" onClick={clearPhoto} aria-label="Remove photo"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    )}
                    {photoError && <p className="validation-error">{photoError}</p>}
                  </div>

                  <div className="report-section">
                    <h4>Describe the issue <span className="optional-tag">Optional</span></h4>
                    <div className="textarea-wrapper">
                      <textarea 
                        placeholder="Tell us what you observed..."
                        maxLength={500}
                        value={reportData.description}
                        onChange={e => setReportData(prev => ({...prev, description: e.target.value}))}
                      />
                      <div className="char-counter">{reportData.description.length} / 500</div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h4>Optional Details</h4>
                    <div className="optional-details-grid">
                      <div>
                        <label>Severity</label>
                        <select value={reportData.severity} onChange={e => setReportData(prev => ({...prev, severity: e.target.value as any}))}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      {reportingFacility.type === 'water' && (
                        <div>
                          <label>Water available</label>
                          <select value={reportData.waterAvailable ? 'yes' : 'no'} onChange={e => setReportData(prev => ({...prev, waterAvailable: e.target.value === 'yes'}))}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      )}
                      
                      {reportingFacility.type === 'toilet' && (
                        <div>
                          <label>Cleanliness</label>
                          <select value={reportData.cleanliness} onChange={e => setReportData(prev => ({...prev, cleanliness: e.target.value}))}>
                            <option value="clean">Clean</option>
                            <option value="needs_cleaning">Needs cleaning</option>
                            <option value="severely_unhygienic">Severely unhygienic</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label>Accessibility affected</label>
                        <select value={reportData.accessibilityAffected ? 'yes' : 'no'} onChange={e => setReportData(prev => ({...prev, accessibilityAffected: e.target.value === 'yes'}))}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="report-section report-location-box">
                    <div className="loc-icon"><MapPin size={18} /></div>
                    <div className="loc-details">
                      <strong>{reportingFacility.name}</strong>
                      <span>{reportingFacility.distance_meters && reportingFacility.distance_meters < 1000 ? `${Math.round(reportingFacility.distance_meters)} m away` : `${((reportingFacility.distance_meters || 0) / 1000).toFixed(1)} km away`}</span>
                      <div className="loc-coords">📍 Location captured automatically: {reportingFacility.lat.toFixed(5)}, {reportingFacility.lng.toFixed(5)}</div>
                    </div>
                  </div>

                  <div className="form-footer-actions">
                    <button className="submit-report" type="submit" disabled={!reportData.issueType || isSubmittingReport}>
                      {isSubmittingReport ? <RefreshCw size={17} className="spin" /> : <Send size={17} />}
                      {isSubmittingReport ? 'Submitting...' : 'Submit Civic Report'}
                    </button>
                    <p className="privacy-note"><ShieldCheck size={13} /> Your report is submitted without requiring an account.</p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile FAB for Add Missing Place */}
      <button className="amp-fab md:hidden" onClick={() => setShowAddPlace(true)}>
        <Plus size={16} />
        <span className="amp-fab-text">Add place</span>
      </button>

      {/* Add Missing Place Modal */}
      <AddMissingPlace
        isOpen={showAddPlace}
        onClose={() => setShowAddPlace(false)}
        userLocation={userLocation}
        theme={theme}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        theme={theme}
        onFacilityApproved={() => window.location.reload()}
      />
    </main>
  );
}
