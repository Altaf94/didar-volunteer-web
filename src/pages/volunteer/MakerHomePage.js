// ============================================
// MAKER HOME PAGE
// Main page for Maker role - Upload, Review, Submit
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Send,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { VolunteerStatus } from '../../types/volunteer';
import { getRegionLabel } from '../../constants/volunteerConstants';
import './MakerHomePage.css';

const MakerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const {
    volunteers,
    volunteersLoading,
    uploadBatches,
    uploadBatchesLoading,
    userRegion,
    loadVolunteers,
    loadUploadBatches,
  } = useVolunteer();

  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadVolunteers(),
      loadUploadBatches(),
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Calculate statistics
  const validCount = volunteers.filter(v => v.status === VolunteerStatus.VALID).length;
  const pendingCount = volunteers.filter(v => v.status === VolunteerStatus.PENDING).length;
  const submittedCount = volunteers.filter(v => v.status === VolunteerStatus.SUBMITTED).length;

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
              onClick={() => navigate('/maker/review', { state: { status: VolunteerStatus.VALID } })}
            >
              <SummaryCard
                title="Valid Records"
                value={validCount}
                icon={<CheckCircle size={24} color={colors.success} />}
                color={colors.success}
              />
            </div>
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
          </div>
          <div className="summary-row">
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
            <div className="summary-card-wrapper">
              {/* empty placeholder to keep layout balanced */}
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

        {/* Recent Batches */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Uploads</h2>
            <button className="view-all-btn">View All</button>
          </div>

          {uploadBatches.length === 0 ? (
            <div className="empty-state">
              <FileSpreadsheet size={40} color={colors.textMuted} />
              <p className="empty-text">No uploads yet</p>
              <p className="empty-subtext">
                Upload your first Excel file to get started
              </p>
            </div>
          ) : (
            <div className="batches-list">
              {uploadBatches.slice(0, 5).map((batch) => (
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
