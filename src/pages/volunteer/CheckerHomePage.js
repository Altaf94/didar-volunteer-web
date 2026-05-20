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
  PlusCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard, RegionProgressCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { VolunteerStatus, UserLevel } from '../../types/volunteer';
import { getRegionLabel } from '../../constants/volunteerConstants';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import './CheckerHomePage.css';

/** Numeric roles that have checker access (2 = checker, 3 = checker+maker). */
const CHECKER_ROLES = [3,6];

const isNationalAdminScope = () =>
  String(tokenService.getUserScope() || '').trim().toLowerCase() === 'national admin';

const CheckerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [makerDecisions, setMakerDecisions] = useState(null);
  const [makerDecisionsLoading, setMakerDecisionsLoading] = useState(false);
  const [makerDecisionsError, setMakerDecisionsError] = useState(null);
  const [importSearch, setImportSearch] = useState('');
  
  // State for print-ready data
  const [printReadyData, setPrintReadyData] = useState(null);
  const [printReadyLoading, setPrintReadyLoading] = useState(false);
  const [printReadyError, setPrintReadyError] = useState(null);
  const [showPrintReady, setShowPrintReady] = useState(false);
  const [recentUploadsCollapsed, setRecentUploadsCollapsed] = useState(false);
  const [readyToPrintCollapsed, setReadyToPrintCollapsed] = useState(false);

  const {
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
  console.log('User Role:', userRole);
  const { canCheck } = usePermissions();
  console.log(canCheck, 'canCheck');
  const showNationalAdminCreate = isNationalAdminScope();

  const loadMakerDecisions = useCallback(async () => {
    setMakerDecisionsLoading(true);
    setMakerDecisionsError(null);
    try {
      const userId = tokenService.getUserId();
      const data = await volunteerApiService.getMakerDecisions(userId);
      setMakerDecisions(data);
    } catch (err) {
      console.error('Failed to load maker decisions:', err);
      setMakerDecisionsError(err.message || 'Failed to load');
      setMakerDecisions(null);
    } finally {
      setMakerDecisionsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadVolunteers({ status: VolunteerStatus.SUBMITTED }),
      loadDashboardStats(),
      loadDispatchPackages(),
      loadMakerDecisions(),
    ]);
  }, [loadVolunteers, loadDashboardStats, loadDispatchPackages, loadMakerDecisions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate statistics
  const byImportEntries =
    makerDecisions?.byImportId && typeof makerDecisions.byImportId === 'object'
      ? Object.entries(makerDecisions.byImportId)
      : [];

  const getImportSortValue = (importId) => {
    const numericValue = Number(importId);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const sortedImportEntries = [...byImportEntries].sort(([a], [b]) => {
    const aValue = getImportSortValue(a);
    const bValue = getImportSortValue(b);

    if (aValue !== null && bValue !== null) {
      return bValue - aValue;
    }

    return String(b).localeCompare(String(a), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  const filteredImportEntries = sortedImportEntries.filter(([importId]) =>
    String(importId).toLowerCase().includes(importSearch.trim().toLowerCase())
  );

  const sortedPrintReadyEntries =
    printReadyData && typeof printReadyData === 'object'
      ? Object.entries(printReadyData).sort(([a], [b]) => {
          const aValue = getImportSortValue(a);
          const bValue = getImportSortValue(b);

          if (aValue !== null && bValue !== null) {
            return bValue - aValue;
          }

          return String(b).localeCompare(String(a), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        })
      : [];

  const PENDING_STATUSES = ['pending', 'discrepant', 'discrepant-1', 'discrepant-2', 'discrepant(1)', 'discrepant(2)'];

  // Pending Review = imports that still have at least one pending/discrepant record
  const pendingReviewCount = byImportEntries.filter(([, recs]) =>
    Array.isArray(recs) && recs.some((r) => {
      const s = String(r?.decisionStatus ?? r?.decision_status ?? r?.decision ?? '').trim().toLowerCase();
      return PENDING_STATUSES.includes(s);
    })
  ).length;

  // Ready to Print = imports where checker has decided (no pending/discrepant, checkerId set on at least one record)
  // and reason is not 'printed'
  const readyToPrintCount = byImportEntries.filter(([, recs]) => {
    if (!Array.isArray(recs) || recs.length === 0) return false;
    const noPending = recs.every((r) => {
      const s = String(r?.decisionStatus ?? r?.decision_status ?? r?.decision ?? '').trim().toLowerCase();
      return !PENDING_STATUSES.includes(s) && (s.includes('rejected') || s.includes('ok')); ;
    });

    const checkerActed = recs.some((r) => r?.checkerId != null && r?.checkerId !== '');
    const notPrinted = recs.every((r) => {
      const reason = String(r?.reason ?? '').trim().toLowerCase();
      return reason !== 'printed';
    });
    return noPending && notPrinted;
  }).length;

  const isNationalLevel = userLevel === UserLevel.NATIONAL || userLevel === UserLevel.NATIONAL_ADMIN;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePrintBadges = async () => {
    if (!canCheck) {
      alert('You do not have permission to print badges.');
      return;
    }
    
    setPrintReadyLoading(true);
    setPrintReadyError(null);
    setShowPrintReady(true);
    setRecentUploadsCollapsed(true);
    setReadyToPrintCollapsed(false);
    
    try {
      console.log('Fetching maker decisions ready for printing...');
      const userId = tokenService.getUserId();
      const data = await volunteerApiService.getMakerDecisionsOk(userId);
      console.log('Maker decisions OK:', data);
      setPrintReadyData(data);
    } catch (err) {
      console.error('Failed to fetch maker decisions:', err);
      setPrintReadyError(err.message || 'Failed to load print data');
      setPrintReadyData(null);
    } finally {
      setPrintReadyLoading(false);
    }
  };

  const handleViewPrintImport = (importId, records) => {
    navigate('/checker/print', { 
      state: { 
        printData: { [importId]: records },
        importId 
      } 
    });
  };

  if ((volunteersLoading || dashboardLoading) && !refreshing) {
    return <IsmailiLoader message="Loading Dashboard..." />;
  }

  return (
    <div className="checker-home">
      <Header
        title="Welcome to Volunteer Portal"
        subtitle={isNationalLevel ? 'National Level' : userRegion ? getRegionLabel(userRegion) : ''}
        onLogout={handleLogout}
      />

      <div className="checker-home-content">


        {/* Summary Cards */}
        <div className="summary-container">
          <div className="summary-row">
            <div
              className={`summary-card-wrapper ${!canCheck ? 'disabled' : ''}`}
              onClick={canCheck ? () => navigate('/checker/review') : () => alert('You do not have permission to review submissions.')}
              style={{ opacity: canCheck ? 1 : 0.6, cursor: 'default'}}
            >
              <SummaryCard
                title="Pending Review"
                value={pendingReviewCount}
                icon={<Clock size={24} color={colors.info} />}
                color={colors.info}
              />
            </div>
            <div
              className={`summary-card-wrapper ${!canCheck ? 'disabled' : ''}`}
             
              style={{ opacity: canCheck ? 1 : 0.6, cursor: 'default' }}
            >
              <SummaryCard
                title="Ready to Print"
                value={readyToPrintCount}
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
              className={`action-card review-card ${!canCheck ? 'disabled' : ''}`}
              onClick={canCheck ? () => navigate('/checker/review') : () => alert('You do not have permission to review submissions.')}
              style={{ opacity: canCheck ? 1 : 0.5, cursor: canCheck ? 'pointer' : 'not-allowed' }}
            >
              <FileCheck size={32} color={colors.white} />
              <h3 className="action-title">Review Submissions</h3>
              <p className="action-subtitle">{canCheck ? `${pendingReviewCount} pending` : ''}</p>
            </div>

            <div
              className={`action-card print-card ${!canCheck ? 'disabled' : ''}`}
              onClick={handlePrintBadges}
              style={{ opacity: canCheck ? 1 : 0.5, cursor: canCheck ? 'pointer' : 'not-allowed' }}
            >
              <Printer size={32} color={colors.white} />
              <h3 className="action-title">Print Badges</h3>
              <p className="action-subtitle">{canCheck ? `${readyToPrintCount} ready` : ''}</p>
            </div>

            {showNationalAdminCreate && (
              <div
                className={`action-card national-admin-card ${!canCheck ? 'disabled' : ''}`}
                onClick={
                  canCheck
                    ? () => navigate('/checker/national-admin-create')
                    : () => alert('You do not have permission to create print records.')
                }
                style={{ opacity: canCheck ? 1 : 0.5, cursor: canCheck ? 'pointer' : 'not-allowed' }}
              >
                <PlusCircle size={32} color={colors.white} />
                <h3 className="action-title">Create Print Records</h3>
                <p className="action-subtitle">National Admin</p>
              </div>
            )}
          </div>
        </section>

        {/* GET /api/volunteers/maker-decisions (byImportId) — role 3, Recent Uploads layout */}
        {CHECKER_ROLES.includes(userRole) && (
          <section className="section recent-uploads-section">
            <div className="section-header">
              <h2 className="section-title">Recent Uploads</h2>
              <div className="section-header-actions">
                {false  && (
                  <button
                    type="button"
                    className="view-all-btn"
                    onClick={() => {
                      const [id, recs] = filteredImportEntries[0] || sortedImportEntries[0];
                      navigate(`/checker/import/${encodeURIComponent(String(id))}`, {
                        state: { makerRecords: recs },
                      });
                    }}
                  >
                    View All
                  </button>
                )}
                <button
                  type="button"
                  className="collapse-btn"
                  onClick={() => setRecentUploadsCollapsed((collapsed) => !collapsed)}
                  aria-expanded={!recentUploadsCollapsed}
                  aria-controls="recent-uploads-content"
                  title={recentUploadsCollapsed ? 'Expand Recent Uploads' : 'Collapse Recent Uploads'}
                >
                  <ChevronDown
                    size={18}
                    className={recentUploadsCollapsed ? 'collapse-icon collapsed' : 'collapse-icon'}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            {!recentUploadsCollapsed && (
              <div id="recent-uploads-content">
                {makerDecisionsError && (
                  <p className="recent-uploads-error" role="alert">
                    {makerDecisionsError}
                  </p>
                )}
                {byImportEntries.length > 0 && (
                  <div className="recent-uploads-toolbar">
                    <div className="recent-uploads-search">
                      <Search size={18} color={colors.textMuted} aria-hidden="true" />
                      <input
                        type="search"
                        value={importSearch}
                        onChange={(event) => setImportSearch(event.target.value)}
                        placeholder="Search by Import ID"
                        aria-label="Search recent uploads by import ID"
                      />
                    </div>
                  </div>
                )}
                <div className="recent-uploads-panel">
              {makerDecisionsLoading && !makerDecisions && (
                <p className="recent-uploads-placeholder">Loading…</p>
              )}
              {!makerDecisionsLoading && !makerDecisionsError && byImportEntries.length === 0 && (
                <p className="recent-uploads-placeholder">No recent uploads.</p>
              )}
              {!makerDecisionsLoading && !makerDecisionsError && byImportEntries.length > 0 && filteredImportEntries.length === 0 && (
                <p className="recent-uploads-placeholder">No uploads found for that Import ID.</p>
              )}
              {filteredImportEntries.length > 0 && (
                <div className="recent-uploads-grid">
                  {filteredImportEntries.map(([importId, records]) => {
                    const list = Array.isArray(records) ? records : [];
                    const allPrinted = list.length > 0 && list.every((r) => {
                      const reason = String(r?.reason ?? '').trim().toLowerCase();
                      return reason === 'printed';
                    });
                    return (
                      <div key={importId} className={`recent-upload-card ${allPrinted ? 'printed' : ''}`}>
                        {allPrinted && <span className="recent-upload-printed-badge">Printed</span>}
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
              </div>
            )}
          </section>
        )}

        {/* Ready to Print Section - Displayed after clicking Print Badges */}
        {showPrintReady && (
          <section className="section ready-to-print-section">
            <div className="section-header">
              <h2 className="section-title">Ready to Print</h2>
              <div className="section-header-actions">
                {printReadyData && Object.keys(printReadyData).length > 0 && false && (
                  <button
                    type="button"
                    className="view-all-btn"
                    onClick={() => navigate('/checker/print', { state: { printData: printReadyData } })}
                  >
                    View All
                  </button>
                )}
                <button
                  type="button"
                  className="collapse-btn"
                  onClick={() => setReadyToPrintCollapsed((collapsed) => !collapsed)}
                  aria-expanded={!readyToPrintCollapsed}
                  aria-controls="ready-to-print-content"
                  title={readyToPrintCollapsed ? 'Expand Ready to Print' : 'Collapse Ready to Print'}
                >
                  <ChevronDown
                    size={18}
                    className={readyToPrintCollapsed ? 'collapse-icon collapsed' : 'collapse-icon'}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            {!readyToPrintCollapsed && (
              <div id="ready-to-print-content">
                {printReadyError && (
                  <p className="recent-uploads-error" role="alert">
                    {printReadyError}
                  </p>
                )}
                <div className="recent-uploads-panel">
              {printReadyLoading && !printReadyData && (
                <p className="recent-uploads-placeholder">Loading print data…</p>
              )}
              {!printReadyLoading && !printReadyError && (!printReadyData || Object.keys(printReadyData).length === 0) && (
                <p className="recent-uploads-placeholder">No badges ready to print.</p>
              )}
              {sortedPrintReadyEntries.length > 0 && (
                <div className="recent-uploads-grid">
                  {sortedPrintReadyEntries.map(([importId, records]) => {
                    const list = Array.isArray(records) ? records : [];
                    const allPrinted = list.length > 0 && list.every((r) => {
                      const reason = String(r?.reason ?? '').trim().toLowerCase();
                      return reason === 'printed';
                    });
                    return (
                      <div key={importId} className={`recent-upload-card ${allPrinted ? 'printed' : ''}`}>
                        {allPrinted && <span className="recent-upload-printed-badge">Printed</span>}
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
                          onClick={() => handleViewPrintImport(importId, list)}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
              </div>
            )}
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
