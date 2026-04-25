// ============================================
// MAKER HOME PAGE
// Main page for Maker role - Upload, Review, Submit
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileCheck,
  Send,
  ChevronRight,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import { VolunteerStatus } from '../../types/volunteer';
import { getRegionLabel } from '../../constants/volunteerConstants';
import './MakerHomePage.css';

const MakerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadRef = React.useRef(false);

  const {
    volunteersLoading,
    uploadBatches,
    uploadBatchesLoading,
    userRegion,
    loadVolunteers,
    loadUploadBatches,
  } = useVolunteer();

  const [importGroups, setImportGroups] = useState({});
  const importIdsSet = new Set(Object.keys(importGroups).map(id => String(id)));

  const { logout } = useAuth();

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
    } catch (err) {
      console.error('Failed to load by import or user', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadVolunteers(),
      loadUploadBatches(),
      loadByImportOrUser(),
    ]);
  }, [loadVolunteers, loadUploadBatches, loadByImportOrUser]);

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

  // Pending = import batches where at least one record still has recordStatus "maker"
  const pendingCount = Object.values(importGroups).filter((recs) =>
    recs.some((r) => (r.recordStatus || r.record_status || '').toLowerCase() === 'maker')
  ).length;

  // Submitted = import batches where all records have moved past "maker" (e.g. "checker")
  const submittedCount = Object.values(importGroups).filter((recs) =>
    recs.length > 0 &&
    recs.every((r) => (r.recordStatus || r.record_status || '').toLowerCase() !== 'maker')
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if ((volunteersLoading || uploadBatchesLoading) && !refreshing) {
    return <IsmailiLoader message="Loading Dashboard..." />;
  }

  return (
    <div className="maker-home">
      <Header
        title="Maker Dashboard"
        subtitle={userRegion ? getRegionLabel(userRegion) : 'Select Region'}
        onLogout={handleLogout}
      />

      <div className="maker-home-content">
        {/* Summary Cards */}
        <div className="summary-container">
          <div className="summary-row">
            <div
              className="summary-card-wrapper"
              onClick={() => navigate('/maker/review', { state: { status: VolunteerStatus.PENDING } })}
            >
              <SummaryCard
                title="Pending"
                value={pendingCount}
                icon={<Clock size={24} color={colors.info} />}
                color={colors.info}
              />
            </div>
            <div
              className="summary-card-wrapper"
              onClick={() => navigate('/maker/review', { state: { status: VolunteerStatus.SUBMITTED } })}
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
              className="action-card upload-card"
              onClick={() => navigate('/maker/upload')}
            >
              <Upload size={32} color={colors.white} />
              <h3 className="action-title">Upload Data</h3>
              <p className="action-subtitle">Import Excel file</p>
            </div>

            <div
              className="action-card review-card"
              onClick={() => navigate('/maker/review')}
            >
              <FileCheck size={32} color={colors.white} />
              <h3 className="action-title">Review Records</h3>
              <p className="action-subtitle">Approve or reject</p>
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
            {uploadBatches.length === 0 && Object.keys(importGroups).length === 0 ? (
              <div className="empty-state">
                <FileSpreadsheet size={40} color={colors.textMuted} />
                <p className="empty-text">No uploads yet</p>
                <p className="empty-subtext">
                  Upload your first Excel file to get started
                </p>
              </div>
            ) : (
              <>
                {uploadBatches.length > 0 && (
                  <div className="batches-list">
                    {uploadBatches
                      .filter(b => !importIdsSet.has(String(b.id)))
                      .slice(0, 5)
                      .map((batch) => (
                      <div
                        key={batch.id}
                        className="batch-card"
                        onClick={() => navigate('/maker/review', { state: { batchId: batch.id } })}
                      >
                        <div className="batch-icon">
                          <FileSpreadsheet size={24} color={colors.primary} />
                        </div>
                        <div className="batch-content">
                          <h4 className="batch-filename">{batch.fileName}</h4>
                          <p className="batch-meta">
                            {batch.totalRecords} records • {getRegionLabel(batch.region)}
                          </p>
                        </div>
                        <div className="batch-stats">
                          <span className="batch-stat valid">{batch.validRecords} valid</span>
                          {batch.discrepantRecords > 0 && (
                            <span className="batch-stat discrepant">{batch.discrepantRecords} issues</span>
                          )}
                        </div>
                        <ChevronRight size={20} color={colors.textMuted} />
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(importGroups).length > 0 && (
                  <div className="import-groups-grid">
                    {Object.entries(importGroups).filter(([, recs]) =>
                      recs.some((r) => (r.recordStatus || r.record_status || '').toLowerCase() === 'maker')
                    ).map(([importId, records]) => {
                      const batchMeta = uploadBatches.find(b => String(b.id) === String(importId));
                      const total = batchMeta?.totalRecords ?? records.length;
                      const fileName = batchMeta?.fileName ?? batchMeta?.file_name ?? '';

                      return (
                        <div key={importId} className="import-summary-card">
                          <div className="import-summary-top">
                            <div className="import-id">Import ID: <strong>{importId}</strong></div>
                            {fileName && <div className="import-filename">{fileName}</div>}
                          </div>
                          <div className="import-summary-body">
                            <div className="import-count">{total}</div>
                            <div className="import-count-label">Total Records</div>
                          </div>
                          <div className="import-summary-actions">
                            <button
                              className="view-btn"
                              onClick={() => navigate('/maker/review', { state: { batchId: importId } })}
                            >
                              View
                            </button>
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
