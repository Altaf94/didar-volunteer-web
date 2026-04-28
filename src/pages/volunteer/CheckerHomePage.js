// ============================================
// CHECKER HOME PAGE
// Main page for Checker role - Review, Print, Dispatch
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Printer,
  Package,
  Clock,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard, RegionProgressCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { VolunteerStatus, UserLevel } from '../../types/volunteer';
import { getRegionLabel } from '../../constants/volunteerConstants';
import volunteerApiService from '../../services/volunteerApi';
import './CheckerHomePage.css';

/** Auth token role for checker users who may load maker decision queue (per API). */
const CHECKER_MAKER_DECISIONS_ROLE = 3;

const CheckerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [makerDecisions, setMakerDecisions] = useState(null);
  const [makerDecisionsLoading, setMakerDecisionsLoading] = useState(false);
  const [makerDecisionsError, setMakerDecisionsError] = useState(null);

  const {
    volunteers,
    volunteersLoading,
    dashboardStats,
    dashboardLoading,
    dispatchPackages,
    userLevel,
    userRegion,
    loadVolunteers,
    loadDashboardStats,
    loadDispatchPackages,
  } = useVolunteer();

  const { logout, userRole } = useAuth();

  const loadMakerDecisions = useCallback(async () => {
    if (userRole !== CHECKER_MAKER_DECISIONS_ROLE) return;
    setMakerDecisionsLoading(true);
    setMakerDecisionsError(null);
    try {
      const data = await volunteerApiService.getMakerDecisions();
      setMakerDecisions(data);
    } catch (err) {
      console.error('Failed to load maker decisions:', err);
      setMakerDecisionsError(err.message || 'Failed to load');
      setMakerDecisions(null);
    } finally {
      setMakerDecisionsLoading(false);
    }
  }, [userRole]);

  const loadData = useCallback(async () => {
    const tasks = [
      loadVolunteers({ status: VolunteerStatus.SUBMITTED }),
      loadDashboardStats(),
      loadDispatchPackages(),
    ];
    if (userRole === CHECKER_MAKER_DECISIONS_ROLE) {
      tasks.push(loadMakerDecisions());
    }
    await Promise.all(tasks);
  }, [loadVolunteers, loadDashboardStats, loadDispatchPackages, loadMakerDecisions, userRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate statistics
  const submittedCount = volunteers.filter(v => v.status === VolunteerStatus.SUBMITTED).length;
  const approvedCount = volunteers.filter(v => v.status === VolunteerStatus.APPROVED).length;

  const isNationalLevel = userLevel === UserLevel.NATIONAL;

  const byImportEntries =
    makerDecisions?.byImportId && typeof makerDecisions.byImportId === 'object'
      ? Object.entries(makerDecisions.byImportId)
      : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if ((volunteersLoading || dashboardLoading) && !refreshing) {
    return <IsmailiLoader message="Loading Dashboard..." />;
  }

  return (
    <div className="checker-home">
      <Header
        title="Checker Dashboard"
        subtitle={isNationalLevel ? 'National Level' : userRegion ? getRegionLabel(userRegion) : 'Regional Level'}
        onLogout={handleLogout}
      />

      <div className="checker-home-content">
        {/* Summary Cards */}
        <div className="summary-container">
          <div className="summary-row">
            <div
              className="summary-card-wrapper"
              onClick={() => navigate('/checker/review')}
            >
              <SummaryCard
                title="Pending Review"
                value={submittedCount}
                icon={<Clock size={24} color={colors.info} />}
                color={colors.info}
              />
            </div>
            <div
              className="summary-card-wrapper"
              onClick={() => navigate('/checker/print')}
            >
              <SummaryCard
                title="Ready to Print"
                value={approvedCount}
                icon={<Printer size={24} color={colors.primary} />}
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
              className="action-card review-card"
              onClick={() => navigate('/checker/review')}
            >
              <FileCheck size={32} color={colors.white} />
              <h3 className="action-title">Review Submissions</h3>
              <p className="action-subtitle">{submittedCount} pending</p>
            </div>

            <div
              className="action-card print-card"
              onClick={() => navigate('/checker/print')}
            >
              <Printer size={32} color={colors.white} />
              <h3 className="action-title">Print Badges</h3>
              <p className="action-subtitle">{approvedCount} ready</p>
            </div>
          </div>
        </section>

        {/* GET /api/volunteers/maker-decisions (byImportId) — role 3, Recent Uploads layout */}
        {userRole === CHECKER_MAKER_DECISIONS_ROLE && (
          <section className="section recent-uploads-section">
            <div className="section-header">
              <h2 className="section-title">Recent Uploads</h2>
              {byImportEntries.length > 0 && (
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => {
                    const [id, recs] = byImportEntries[0];
                    navigate(`/checker/import/${encodeURIComponent(String(id))}`, {
                      state: { makerRecords: recs },
                    });
                  }}
                >
                  View All
                </button>
              )}
            </div>
            {makerDecisionsError && (
              <p className="recent-uploads-error" role="alert">
                {makerDecisionsError}
              </p>
            )}
            <div className="recent-uploads-panel">
              {makerDecisionsLoading && !makerDecisions && (
                <p className="recent-uploads-placeholder">Loading…</p>
              )}
              {!makerDecisionsLoading && !makerDecisionsError && byImportEntries.length === 0 && (
                <p className="recent-uploads-placeholder">No recent uploads.</p>
              )}
              {byImportEntries.length > 0 && (
                <div className="recent-uploads-grid">
                  {byImportEntries.map(([importId, records]) => {
                    const list = Array.isArray(records) ? records : [];
                    return (
                      <div key={importId} className="recent-upload-card">
                        <p className="recent-upload-id-line">
                          Import ID: <strong>{importId}</strong>
                        </p>
                        <div className="recent-upload-total" aria-label="Total records">
                          {list.length}
                        </div>
                        <p className="recent-upload-total-label">Total Records</p>
                        <button
                          type="button"
                          className="recent-upload-view-btn"
                          onClick={() =>
                            navigate(`/checker/import/${encodeURIComponent(String(importId))}`, {
                              state: { makerRecords: list },
                            })
                          }
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Region Progress */}
        {isNationalLevel && dashboardStats?.byRegion && (
          <section className="section">
            <h2 className="section-title">Region Progress</h2>
            {dashboardStats.byRegion.map((region) => (
              <div
                key={region.region}
                onClick={() => navigate('/checker/review', { state: { region: region.region } })}
              >
                <RegionProgressCard
                  regionName={region.regionName}
                  required={region.required}
                  received={region.received}
                  printed={region.printed}
                />
              </div>
            ))}
          </section>
        )}

        {/* Recent Packages */}
        {dispatchPackages.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Recent Packages</h2>
              <button className="view-all-btn" onClick={() => navigate('/checker/dispatch')}>
                View All
              </button>
            </div>

            <div className="packages-list">
              {dispatchPackages.slice(0, 3).map((pkg) => (
                <div key={pkg.id} className="package-card">
                  <div className="package-icon">
                    <Package size={24} color={colors.primary} />
                  </div>
                  <div className="package-content">
                    <h4 className="package-title">{pkg.destinationEntityName}</h4>
                    <p className="package-meta">
                      {pkg.totalBadges} badges • {getRegionLabel(pkg.region)}
                    </p>
                  </div>
                  <span
                    className={`package-status ${pkg.status === 'dispatched' ? 'dispatched' : 'prepared'}`}
                  >
                    {pkg.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Refresh Button */}
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default CheckerHomePage;
