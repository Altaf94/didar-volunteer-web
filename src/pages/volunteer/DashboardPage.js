// ============================================
// NATIONAL DASHBOARD PAGE
// Leadership view with comprehensive statistics
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Printer,
  Package,
  TrendingUp,
} from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import StatsCard, {
  SummaryCard,
  RegionProgressCard,
} from '../../components/volunteer/StatsCard';
import { colors } from '../../theme';
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { UserLevel } from '../../types/volunteer';
import {
  getRegionLabel,
  getAccessLevelColor,
} from '../../constants/volunteerConstants';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const {
    dashboardStats,
    dashboardLoading,
    userLevel,
    userRegion,
    loadDashboardStats,
  } = useVolunteer();

  const { logout } = useAuth();

  const isNationalLevel = userLevel === UserLevel.NATIONAL;

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
  }, [loadDashboardStats]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (dashboardLoading && !refreshing) {
    return <IsmailiLoader message="Loading Dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <Header
        title="Dashboard"
        subtitle={isNationalLevel ? 'National View' : userRegion ? getRegionLabel(userRegion) : 'Regional View'}
        onLogout={handleLogout}
      />

      <div className="dashboard-content">
        {/* Summary Statistics */}
        {dashboardStats && (
          <div className="summary-container">
            <div className="summary-row">
              <SummaryCard
                title="Required"
                value={dashboardStats.totalRequired}
                icon={<Users size={24} color={colors.primary} />}
                color={colors.primary}
              />
              <SummaryCard
                title="Received"
                value={dashboardStats.totalReceived}
                subtitle={`${dashboardStats.receivedPercentage}%`}
                icon={<TrendingUp size={24} color={colors.info} />}
                color={colors.info}
              />
            </div>
            <div className="summary-row">
              <SummaryCard
                title="Printed"
                value={dashboardStats.totalPrinted}
                subtitle={`${dashboardStats.printedPercentage}%`}
                icon={<Printer size={24} color={colors.success} />}
                color={colors.success}
              />
              <SummaryCard
                title="Dispatched"
                value={dashboardStats.totalDispatched}
                icon={<Package size={24} color="#8B5CF6" />}
                color="#8B5CF6"
              />
            </div>
          </div>
        )}

        {/* Main Progress Cards */}
        {dashboardStats && (
          <section className="section">
            <h2 className="section-title">Progress Overview</h2>
            
            <StatsCard
              title="Required vs Received"
              required={dashboardStats.totalRequired}
              received={dashboardStats.totalReceived}
              icon={<Users size={24} color={colors.primary} />}
            />
            
            <div className="card-spacer" />
            
            <StatsCard
              title="Required vs Printed"
              required={dashboardStats.totalRequired}
              received={dashboardStats.totalPrinted}
              icon={<Printer size={24} color={colors.success} />}
            />
          </section>
        )}

        {/* Region Progress (National Level Only) */}
        {isNationalLevel && dashboardStats?.byRegion && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Regional Progress</h2>
            </div>

            {dashboardStats.byRegion.map((region) => (
              <div
                key={region.region}
                className="region-card-wrapper"
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

        {/* Access Level Progress */}
        {dashboardStats?.byAccessLevel && (
          <section className="section">
            <h2 className="section-title">By Access Level</h2>
            <div className="access-level-card">
              {dashboardStats.byAccessLevel.map((level) => {
                const percentage = level.required > 0 
                  ? Math.round((level.received / level.required) * 100) 
                  : 0;

                return (
                  <div key={level.accessLevel} className="access-level-item">
                    <div className="access-level-header">
                      <div
                        className="access-level-color"
                        style={{ backgroundColor: getAccessLevelColor(level.accessLevel) }}
                      />
                      <span className="access-level-name">{level.accessLevelName}</span>
                      <span className="access-level-percent">{percentage}%</span>
                    </div>
                    <div className="access-level-bar">
                      <div
                        className="access-level-fill"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: getAccessLevelColor(level.accessLevel),
                        }}
                      />
                    </div>
                    <div className="access-level-stats">
                      <span>{level.received.toLocaleString()} / {level.required.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Last Updated */}
        {dashboardStats?.lastUpdated && (
          <p className="last-updated">
            Last updated: {new Date(dashboardStats.lastUpdated).toLocaleString()}
          </p>
        )}

        {/* Refresh Button */}
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
