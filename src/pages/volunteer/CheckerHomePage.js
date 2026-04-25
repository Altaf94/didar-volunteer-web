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
  ChevronRight,
  CheckCircle,
  Clock,
  Truck,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { SummaryCard, RegionProgressCard } from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { VolunteerStatus, PrintStatus, UserLevel } from '../../types/volunteer';
import { getRegionLabel } from '../../constants/volunteerConstants';
import './CheckerHomePage.css';

const CheckerHomePage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

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

  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    await Promise.all([
      loadVolunteers({ status: VolunteerStatus.SUBMITTED }),
      loadDashboardStats(),
      loadDispatchPackages(),
    ]);
  }, [loadVolunteers, loadDashboardStats, loadDispatchPackages]);

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
  const printedCount = volunteers.filter(v => v.printStatus === PrintStatus.PRINTED).length;
  const dispatchedCount = volunteers.filter(v => v.printStatus === PrintStatus.DISPATCHED).length;

  const isNationalLevel = userLevel === UserLevel.NATIONAL;

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
          <div className="summary-row">
            <div className="summary-card-wrapper">
              <SummaryCard
                title="Printed"
                value={printedCount}
                icon={<CheckCircle size={24} color={colors.success} />}
                color={colors.success}
              />
            </div>
            <div
              className="summary-card-wrapper"
              onClick={() => navigate('/checker/dispatch')}
            >
              <SummaryCard
                title="Dispatched"
                value={dispatchedCount}
                icon={<Truck size={24} color="#8B5CF6" />}
                color="#8B5CF6"
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

          <div
            className="action-card dispatch-card full-width"
            onClick={() => navigate('/checker/dispatch')}
          >
            <Package size={32} color={colors.white} />
            <div className="action-text">
              <h3 className="action-title">Manage Dispatch</h3>
              <p className="action-subtitle">Prepare & send packages</p>
            </div>
            <ChevronRight size={24} color={colors.white} />
          </div>
        </section>

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
