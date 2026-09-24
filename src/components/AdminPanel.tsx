import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock3,
  AlertTriangle,
  RefreshCw,
  Droplet,
  Sparkles,
  Accessibility,
  ChevronRight,
  Eye,
  LogIn,
  LogOut,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { FacilitySubmission, NearbyFacilityDuplicate } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null as any;

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onFacilityApproved?: () => void; // Callback to refresh map data
}

type TabFilter = 'pending' | 'approved' | 'rejected';

function timeAgo(dateStr: string): string {
  const diffMins = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function AdminPanel({ isOpen, onClose, theme: _theme, onFacilityApproved }: AdminPanelProps) {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<FacilitySubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilter>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<FacilitySubmission | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [duplicates, setDuplicates] = useState<NearbyFacilityDuplicate[]>([]);

  // Check auth status on mount
  useEffect(() => {
    if (!isOpen || !supabase) return;

    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          setIsAdmin(!!adminData);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } catch {
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session?.user) {
        setIsLoggedIn(true);
        // Re-check admin status
        supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }: { data: any }) => setIsAdmin(!!data));
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [isOpen]);

  // Fetch submissions when admin is verified
  const fetchSubmissions = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('facility_submissions')
        .select('*')
        .eq('status', tabFilter)
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, tabFilter]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchSubmissions();
    }
  }, [isOpen, isAdmin, fetchSubmissions]);

  // Check for duplicates when viewing a submission
  const checkDuplicates = useCallback(async (sub: FacilitySubmission) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('check_nearby_facilities', {
        check_lat: sub.latitude,
        check_lng: sub.longitude,
        radius_m: 200,
      });
      if (error) throw error;
      setDuplicates(data || []);
    } catch {
      setDuplicates([]);
    }
  }, []);

  const handleSelectSubmission = (sub: FacilitySubmission) => {
    setSelectedSubmission(sub);
    setAdminNote('');
    setShowConfirmApprove(false);
    setShowConfirmReject(false);
    setActionError(null);
    checkDuplicates(sub);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setSubmissions([]);
    setSelectedSubmission(null);
  };

  // Approve handler
  const handleApprove = async () => {
    if (!supabase || !selectedSubmission) return;
    setActionLoading(true);
    setActionError(null);

    try {
      // 1. Get the current admin user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated.');

      // 2. Create the facility in the facilities table
      // The existing schema uses PostGIS geometry for location
      const { data: newFacility, error: facilityError } = await supabase
        .from('facilities')
        .insert({
          name: selectedSubmission.name,
          type: selectedSubmission.type,
          status: 'usable', // Default status — approval ≠ condition verification
          accessibility: selectedSubmission.accessibility === 'unknown' ? 'none' : selectedSubmission.accessibility,
          location: `SRID=4326;POINT(${selectedSubmission.longitude} ${selectedSubmission.latitude})`,
          address: selectedSubmission.address || '',
          managed_by: 'Community',
          last_verified_at: new Date().toISOString(),
          total_reports: 0,
          source: 'community',
          latitude: selectedSubmission.latitude,
          longitude: selectedSubmission.longitude,
        })
        .select('id')
        .single();

      if (facilityError) throw facilityError;
      if (!newFacility) throw new Error('Failed to create facility.');

      // 3. Update the submission
      const { error: updateError } = await supabase
        .from('facility_submissions')
        .update({
          status: 'approved',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          approved_facility_id: newFacility.id,
          admin_note: adminNote || null,
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      // 4. Refresh
      setSelectedSubmission(null);
      setShowConfirmApprove(false);
      fetchSubmissions();
      onFacilityApproved?.();
    } catch (err: any) {
      console.error('Approval error:', err);
      setActionError(err.message || 'Failed to approve submission.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject handler
  const handleReject = async () => {
    if (!supabase || !selectedSubmission) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated.');

      const { error } = await supabase
        .from('facility_submissions')
        .update({
          status: 'rejected',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          admin_note: adminNote || null,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setSelectedSubmission(null);
      setShowConfirmReject(false);
      fetchSubmissions();
    } catch (err: any) {
      console.error('Rejection error:', err);
      setActionError(err.message || 'Failed to reject submission.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} style={{ zIndex: 120 }}>
      <div className="report-modal admin-modal" onMouseDown={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <div className="admin-shield">
              <Shield size={20} />
            </div>
            <div>
              <h3>Admin Panel</h3>
              <span className="admin-subtitle">Facility Submissions</span>
            </div>
          </div>
          <div className="admin-header-right">
            {isLoggedIn && (
              <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            )}
            <button className="close-button" onClick={onClose} aria-label="Close">
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="admin-body">
          {authLoading ? (
            <div className="admin-loading">
              <RefreshCw size={22} className="spin" />
              <span>Checking authentication...</span>
            </div>
          ) : !isLoggedIn ? (
            /* ============ LOGIN FORM ============ */
            <div className="admin-login">
              <div className="admin-login-icon">
                <LogIn size={28} />
              </div>
              <h4>Admin Login</h4>
              <p>Sign in with your admin account to manage facility submissions.</p>
              <form onSubmit={handleLogin} className="admin-login-form">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {loginError && (
                  <div className="amp-geo-error">
                    <AlertTriangle size={14} />
                    {loginError}
                  </div>
                )}
                <button type="submit" className="submit-report" disabled={loginLoading}>
                  {loginLoading ? <RefreshCw size={16} className="spin" /> : <LogIn size={16} />}
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          ) : !isAdmin ? (
            /* ============ NOT ADMIN ============ */
            <div className="admin-loading">
              <AlertTriangle size={22} />
              <span>Your account does not have admin privileges.</span>
            </div>
          ) : selectedSubmission ? (
            /* ============ DETAIL VIEW ============ */
            <div className="admin-detail">
              <button className="admin-back-btn" onClick={() => setSelectedSubmission(null)}>
                ← Back to list
              </button>

              <div className="admin-detail-card">
                <div className="admin-detail-header">
                  <div className={`admin-detail-icon ${selectedSubmission.type === 'toilet' ? 'admin-icon-toilet' : 'admin-icon-water'}`}>
                    {selectedSubmission.type === 'toilet' ? <Sparkles size={24} /> : <Droplet size={24} fill="currentColor" />}
                  </div>
                  <div>
                    <h4>{selectedSubmission.name}</h4>
                    <span className="admin-detail-type">
                      {selectedSubmission.type === 'toilet' ? 'Public Restroom' : 'Drinking Water'}
                    </span>
                  </div>
                  <span className={`admin-status-badge admin-status-${selectedSubmission.status}`}>
                    {selectedSubmission.status.toUpperCase()}
                  </span>
                </div>

                <div className="admin-detail-grid">
                  <div className="admin-detail-row">
                    <span><MapPin size={14} /> Coordinates</span>
                    <strong>{selectedSubmission.latitude.toFixed(6)}, {selectedSubmission.longitude.toFixed(6)}</strong>
                  </div>
                  {selectedSubmission.address && (
                    <div className="admin-detail-row">
                      <span>Address</span>
                      <strong>{selectedSubmission.address}</strong>
                    </div>
                  )}
                  {selectedSubmission.landmark && (
                    <div className="admin-detail-row">
                      <span>Landmark</span>
                      <strong>{selectedSubmission.landmark}</strong>
                    </div>
                  )}
                  {selectedSubmission.description && (
                    <div className="admin-detail-row">
                      <span>Description</span>
                      <strong>{selectedSubmission.description}</strong>
                    </div>
                  )}
                  <div className="admin-detail-row">
                    <span><Accessibility size={14} /> Accessibility</span>
                    <strong>
                      {selectedSubmission.accessibility === 'wheelchair' && '♿ Wheelchair accessible'}
                      {selectedSubmission.accessibility === 'limited' && 'Limited'}
                      {selectedSubmission.accessibility === 'unknown' && 'Unknown'}
                    </strong>
                  </div>
                  <div className="admin-detail-row">
                    <span><Clock3 size={14} /> Submitted</span>
                    <strong>{timeAgo(selectedSubmission.submitted_at)}</strong>
                  </div>
                  <div className="admin-detail-row">
                    <span>Source</span>
                    <strong className="admin-source-badge">Community</strong>
                  </div>
                </div>

                {/* Duplicate warning */}
                {duplicates.length > 0 && (
                  <div className="admin-duplicate-warning">
                    <div className="admin-dup-header">
                      <AlertTriangle size={16} />
                      <strong>Possible duplicate facility</strong>
                    </div>
                    <p>The following existing facilities are within 200m:</p>
                    <ul>
                      {duplicates.map(d => (
                        <li key={d.id}>
                          <strong>{d.name}</strong> ({d.type}) — {Math.round(d.distance_m)}m away
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* View on map */}
                <a
                  className="admin-map-link"
                  href={`https://www.google.com/maps?q=${selectedSubmission.latitude},${selectedSubmission.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Eye size={16} /> View on Map
                </a>

                {actionError && (
                  <div className="amp-geo-error" style={{ marginTop: 12 }}>
                    <AlertTriangle size={14} />
                    {actionError}
                  </div>
                )}

                {/* Admin actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="admin-actions">
                    <div className="amp-field" style={{ marginBottom: 12 }}>
                      <label>Admin note <span className="optional-tag">Optional</span></label>
                      <textarea
                        placeholder="Add a note (visible in records)..."
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        maxLength={500}
                        rows={2}
                      />
                    </div>

                    {!showConfirmApprove && !showConfirmReject ? (
                      <div className="admin-action-buttons">
                        <button className="admin-approve-btn" onClick={() => setShowConfirmApprove(true)}>
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button className="admin-reject-btn" onClick={() => setShowConfirmReject(true)}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    ) : showConfirmApprove ? (
                      <div className="admin-confirm">
                        <p>Are you sure you want to <strong>approve</strong> this submission? This will create a new public facility on the map.</p>
                        <div className="admin-action-buttons">
                          <button className="admin-approve-btn" onClick={handleApprove} disabled={actionLoading}>
                            {actionLoading ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
                            Confirm Approve
                          </button>
                          <button className="admin-cancel-btn" onClick={() => setShowConfirmApprove(false)} disabled={actionLoading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-confirm">
                        <p>Are you sure you want to <strong>reject</strong> this submission?</p>
                        <div className="admin-action-buttons">
                          <button className="admin-reject-btn" onClick={handleReject} disabled={actionLoading}>
                            {actionLoading ? <RefreshCw size={16} className="spin" /> : <XCircle size={16} />}
                            Confirm Reject
                          </button>
                          <button className="admin-cancel-btn" onClick={() => setShowConfirmReject(false)} disabled={actionLoading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedSubmission.status !== 'pending' && selectedSubmission.admin_note && (
                  <div className="admin-note-display">
                    <strong>Admin Note:</strong>
                    <p>{selectedSubmission.admin_note}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============ LIST VIEW ============ */
            <div className="admin-list">
              {/* Tabs */}
              <div className="admin-tabs">
                {(['pending', 'approved', 'rejected'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`admin-tab ${tabFilter === tab ? 'admin-tab-active' : ''}`}
                    onClick={() => setTabFilter(tab)}
                  >
                    {tab === 'pending' && '⏳ '}
                    {tab === 'approved' && '✅ '}
                    {tab === 'rejected' && '❌ '}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
                <button className="admin-refresh-btn" onClick={fetchSubmissions} title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Submissions list */}
              <div className="admin-submissions-list">
                {loading ? (
                  <div className="admin-loading">
                    <RefreshCw size={22} className="spin" />
                    <span>Loading submissions...</span>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="admin-loading">
                    <span>No {tabFilter} submissions found.</span>
                  </div>
                ) : (
                  submissions.map(sub => (
                    <div
                      key={sub.id}
                      className="admin-submission-card"
                      onClick={() => handleSelectSubmission(sub)}
                    >
                      <div className={`admin-sub-icon ${sub.type === 'toilet' ? 'admin-sub-toilet' : 'admin-sub-water'}`}>
                        {sub.type === 'toilet' ? <Sparkles size={18} /> : <Droplet size={18} fill="currentColor" />}
                      </div>
                      <div className="admin-sub-info">
                        <h5>{sub.name}</h5>
                        <div className="admin-sub-meta">
                          <span>{sub.type === 'toilet' ? 'Restroom' : 'Water'}</span>
                          <span>•</span>
                          <span>{timeAgo(sub.submitted_at)}</span>
                          {sub.address && <><span>•</span><span>{sub.address}</span></>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="admin-sub-arrow" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
