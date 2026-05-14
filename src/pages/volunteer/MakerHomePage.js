// ============================================
// MAKER HOME PAGE
// Main page for Maker role - Upload, Review, Submit
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Send,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import { getRegionLabel } from '../../constants/volunteerConstants';
import './MakerHomePage.css';

const MakerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadRef = React.useRef(false);

  const {
    volunteersLoading,
    userRegion,
    loadVolunteers,
  } = useVolunteer();

  const [importGroups, setImportGroups] = useState({});
  const [importStatusMap, setImportStatusMap] = useState({});

  const { logout } = useAuth();
  const { canView, canMake } = usePermissions();

  const loadImportStatuses = useCallback(async (importIds) => {
    try {
      const statusPromises = importIds.map(async (importId) => {
        try {
          const status = await volunteerApiService.getImportStatus(importId);
          return [importId, status.submitted];
        } catch (err) {
          console.error(`Failed to get status for import ${importId}:`, err);
          return [importId, false];
        }
      });

      const statusResults = await Promise.all(statusPromises);
      const statusMap = Object.fromEntries(statusResults);
      setImportStatusMap(statusMap);
    } catch (err) {
      console.error('Failed to load import statuses', err);
    }
  }, []);

  const loadByImportOrUser = useCallback(async () => {
    try {
      // extract user id from token
      let userId = null;
      const token = tokenService.getAccessToken();
      try {
        const payloadPart = token?.split('.')?.[1];
        if (payloadPart) {
          const payload = JSON.parse(tokenService.safeBase64Decode(payloadPart));
          userId = payload.user_id || payload.id || payload.sub || null;
        }
      } catch (e) {
        // ignore
      }

      if (!userId) return;

      const resp = await volunteerApiService.getVolunteersByImportOrUser({ userId });
      // expect array of records with import_id
      const groups = {};
      (resp || []).forEach((r) => {
        const key = r.import_id ?? r.importId ?? r.importFileId ?? 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });
      setImportGroups(groups);

      // Fetch status for each import ID
      await loadImportStatuses(Object.keys(groups));
    } catch (err) {
      console.error('Failed to load by import or user', err);
    }
  }, [loadImportStatuses]);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadVolunteers(),
      loadByImportOrUser(),
    ]);
  }, [loadVolunteers, loadByImportOrUser]);

  useEffect(() => {
    // Guard against React.StrictMode double-invocation in development
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate statistics based on recordStatus from API
  // Also factor in locally-persisted approved batch IDs (set by MakerReviewPage after submission)
  const approvedBatchIds = (() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('makerApproved_batches') || '[]').map(String));
    } catch {
      return new Set();
    }
  })();

  // Pending = import NOT submitted to checker (based on API status)
  const pendingCount = Object.entries(importGroups).filter(([importId, recs]) =>
    recs.length > 0 && !importStatusMap[importId]
  ).length;

  // Submitted = import exists in maker_decisions table (based on API status)
  const submittedCount = Object.entries(importGroups).filter(([importId, recs]) =>
    recs.length > 0 && importStatusMap[importId]
  ).length;

  const firstPendingImportId = (() => {
    for (const [importId, recs] of Object.entries(importGroups)) {
      if (Array.isArray(recs) && recs.length > 0 && !importStatusMap[importId]) {
        return String(importId);
      }
    }
    return null;
  })();

  const openMakerReview = () => {
    if (!canMake) {
      alert('You do not have permission to review and approve records.');
      return;
    }
    if (firstPendingImportId) {
      navigate(`/maker/review?batchId=${encodeURIComponent(firstPendingImportId)}`);
      return;
    }
    navigate('/maker/review');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (volunteersLoading && !refreshing) {
    return <IsmailiLoader message="Loading Dashboard..." />;
  }

  return (
    <div className="maker-home">
      <Header
        title="Welcome to Volunteer Portal"
        subtitle={userRegion ? getRegionLabel(userRegion) : ''}
        onLogout={handleLogout}
      />

      <div className="maker-home-content">
        {/* Summary Cards */}
        <div className="summary-container">
          <div className="summary-row">
            <div
              className={`summary-card-wrapper ${!canMake ? 'disabled' : ''}`}
              onClick={canMake ? openMakerReview : undefined}
              style={{ opacity: canMake ? 1 : 0.6, cursor: canMake ? 'pointer' : 'not-allowed' }}
            >
              <SummaryCard
                title="Pending"
                value={pendingCount}
                icon={<Clock size={24} color={colors.info} />}
                color={colors.info}
              />
            </div>
            <div
              className={`summary-card-wrapper ${!canMake ? 'disabled' : ''}`}
              onClick={canMake ? openMakerReview : undefined}
              style={{ opacity: canMake ? 1 : 0.6, cursor: canMake ? 'pointer' : 'not-allowed' }}
            >
              <SummaryCard
                title="Submitted"
                value={submittedCount}
                icon={<Send size={24} color={colors.primary} />}
                color={colors.primary}
              />
            </div>
          </div>
          
        </div>



        {/* Quick Actions */}
        <section className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-container">
            <div
              className={`action-card upload-card ${!canMake ? 'disabled' : ''}`}
              onClick={canMake ? () => navigate('/maker/upload') : () => alert('You do not have permission to upload data.')}
              style={{ opacity: canMake ? 1 : 0.5, cursor: canMake ? 'pointer' : 'not-allowed' }}
            >
              <Upload size={32} color={colors.white} />
              <h3 className="action-title">Upload Data</h3>
              <p className="action-subtitle">{canMake ? 'Import Excel file' : ''}</p>
            </div>


          </div>
        </section>

        {/* Recent Uploads (now includes import summary cards) */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Uploads</h2>
            <button className="view-all-btn">View All</button>
          </div>

          <div className="uploads-container">
            {Object.keys(importGroups).length === 0 ? (
              <div className="empty-state">
                <FileSpreadsheet size={40} color={colors.textMuted} />
                <p className="empty-text">No uploads yet</p>
                <p className="empty-subtext">
                  Upload your first Excel file to get started
                </p>
              </div>
            ) : (
              <>
                {Object.keys(importGroups).length > 0 && (
                  <div className="import-groups-grid">
                    {Object.entries(importGroups).map(([importId, records]) => {
                      const total = records.length;
                      const fileName = '';
                      const isSubmitted = importStatusMap[importId] || false;

                      return (
                        <div key={importId} className="import-summary-card">
                          <div className="import-summary-top">
                            <div className="import-id">Import ID: <strong>{importId}</strong></div>
                            {fileName && <div className="import-filename">{fileName}</div>}
                            <span className={`batch-status-badge ${isSubmitted ? 'submitted' : 'pending'}`}>
                              {isSubmitted ? 'Submitted' : 'Pending'}
                            </span>
                          </div>
                          <div className="import-summary-body">
                            <div className="import-count">{total}</div>
                            <div className="import-count-label">Total Records</div>
                          </div>
                          <div className="import-summary-actions">
                            {canView && (
                              <button
                                className="view-btn"
                                onClick={() => {
                                  navigate('/maker/review', { state: { batchId: importId, isSubmitted } });
                                }}
                                style={{ opacity: 1, cursor: 'pointer' }}
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        

        {/* Refresh Button */}
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default MakerHomePage;
