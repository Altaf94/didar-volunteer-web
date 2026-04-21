// ============================================
// STATS CARD COMPONENT
// Displays statistics with progress visualization
// ============================================

import React from 'react';
import { colors } from '../../theme';
import { getProgressColor } from '../../constants/volunteerConstants';
import './StatsCard.css';

const StatsCard = ({
  title,
  required,
  received,
  subtitle,
  icon,
  showPercentage = true,
  variant = 'default',
}) => {
  const percentage = required > 0 ? Math.round((received / required) * 100) : 0;
  const progressColor = getProgressColor(percentage);

  const isCompact = variant === 'compact';

  return (
    <div className={`stats-card ${isCompact ? 'stats-card-compact' : ''}`}>
      <div className="stats-card-header">
        {icon && <div className="stats-card-icon">{icon}</div>}
        <div className="stats-card-title-container">
          <h3 className={`stats-card-title ${isCompact ? 'stats-card-title-compact' : ''}`}>
            {title}
          </h3>
          {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
        </div>
        {showPercentage && (
          <span className="stats-card-percentage" style={{ color: progressColor }}>
            {percentage}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="stats-card-progress-container">
        <div className="stats-card-progress-bg">
          <div
            className="stats-card-progress-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-card-stats-row">
        <div className="stats-card-stat-item">
          <span className="stats-card-stat-label">Required</span>
          <span className="stats-card-stat-value">{required.toLocaleString()}</span>
        </div>
        <div className="stats-card-stat-divider" />
        <div className="stats-card-stat-item">
          <span className="stats-card-stat-label">Received</span>
          <span className="stats-card-stat-value" style={{ color: progressColor }}>
            {received.toLocaleString()}
          </span>
        </div>
        <div className="stats-card-stat-divider" />
        <div className="stats-card-stat-item">
          <span className="stats-card-stat-label">Remaining</span>
          <span className="stats-card-stat-value">
            {Math.max(required - received, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

export const ProgressBar = ({
  label,
  value,
  maxValue,
  color,
  showValue = true,
  height = 20,
}) => {
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const barColor = color || getProgressColor(percentage);

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-label-row">
        <span className="progress-bar-label">{label}</span>
        {showValue && (
          <span className="progress-bar-value">
            {value.toLocaleString()} / {maxValue.toLocaleString()} ({percentage}%)
          </span>
        )}
      </div>
      <div className="progress-bar-track" style={{ height }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
};

// ============================================
// SUMMARY CARD COMPONENT
// ============================================

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
}) => {
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        {icon && <div className="summary-card-icon">{icon}</div>}
        <span className="summary-card-title">{title}</span>
      </div>
      <div className="summary-card-value" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && <span className="summary-card-subtitle">{subtitle}</span>}
    </div>
  );
};

// ============================================
// REGION PROGRESS CARD COMPONENT
// ============================================

export const RegionProgressCard = ({
  regionName,
  required,
  received,
  printed,
}) => {
  const receivedPercent = required > 0 ? Math.round((received / required) * 100) : 0;
  const printedPercent = required > 0 ? Math.round((printed / required) * 100) : 0;

  return (
    <div className="region-progress-card">
      <div className="region-progress-header">
        <h4 className="region-progress-name">{regionName}</h4>
        <span className="region-progress-count">{required.toLocaleString()} required</span>
      </div>

      <div className="region-progress-bars">
        <div className="region-progress-item">
          <div className="region-progress-label-row">
            <span className="region-progress-label">Received</span>
            <span className="region-progress-percent">{receivedPercent}%</span>
          </div>
          <div className="region-progress-bar-track">
            <div
              className="region-progress-bar-fill"
              style={{
                width: `${Math.min(receivedPercent, 100)}%`,
                backgroundColor: colors.info,
              }}
            />
          </div>
        </div>

        <div className="region-progress-item">
          <div className="region-progress-label-row">
            <span className="region-progress-label">Printed</span>
            <span className="region-progress-percent">{printedPercent}%</span>
          </div>
          <div className="region-progress-bar-track">
            <div
              className="region-progress-bar-fill"
              style={{
                width: `${Math.min(printedPercent, 100)}%`,
                backgroundColor: colors.success,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
