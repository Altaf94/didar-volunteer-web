// ============================================
// VOLUNTEER CARD COMPONENT
// Displays volunteer information in a card format
// ============================================

import React from 'react';
import { Check, AlertTriangle, X, Printer, Package } from 'lucide-react';
import { colors } from '../../theme';
import { VolunteerStatus, PrintStatus } from '../../types/volunteer';
import {
  getStatusConfig,
  getPrintStatusConfig,
  getAccessLevelLabel,
  getAccessLevelColor,
  getRegionLabel,
  getDataSourceLabel,
} from '../../constants/volunteerConstants';
import './VolunteerCard.css';

const VolunteerCard = ({
  volunteer,
  isSelected = false,
  onSelect,
  onPress,
  showCheckbox = false,
  showActions = false,
  onApprove,
  onReject,
}) => {
  const statusConfig = getStatusConfig(volunteer.status);
  const printStatusConfig = getPrintStatusConfig(volunteer.printStatus);
  const accessLevelColor = getAccessLevelColor(volunteer.accessLevel);

  const handleCardPress = () => {
    if (showCheckbox && onSelect) {
      onSelect(volunteer.id);
    } else if (onPress) {
      onPress(volunteer);
    }
  };

  // Get validation status icon for clearer UI display
  const getValidationIcon = () => {
    switch (volunteer.status) {
      case VolunteerStatus.VALID:
      case VolunteerStatus.APPROVED:
      case VolunteerStatus.SUBMITTED:
        return '✅';
      case VolunteerStatus.DISCREPANT:
        return '⚠️';
      case VolunteerStatus.REJECTED:
        return '❌';
      default:
        return '';
    }
  };

  const renderStatusBadge = () => (
    <span
      className="volunteer-card-badge"
      style={{ backgroundColor: statusConfig.color, color: statusConfig.textColor }}
    >
      {getValidationIcon()} {statusConfig.label}
    </span>
  );

  const renderAccessLevelBand = () => (
    <div
      className="volunteer-card-access-band"
      style={{ backgroundColor: accessLevelColor }}
    >
      {getAccessLevelLabel(volunteer.accessLevel)}
    </div>
  );

  const renderDiscrepancyWarning = () => {
    if (volunteer.status !== VolunteerStatus.DISCREPANT) return null;
    
    return (
      <div className="volunteer-card-warning">
        <AlertTriangle size={16} color="#F59E0B" />
        <span>
          {volunteer.validationErrors?.length > 0
            ? volunteer.validationErrors[0].errorMessage
            : 'Discrepancy detected'}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`volunteer-card ${isSelected ? 'volunteer-card-selected' : ''}`}
      onClick={handleCardPress}
    >
      {/* Header Row */}
      <div className="volunteer-card-header">
        <div className="volunteer-card-header-left">
          {showCheckbox && (
            <button
              className={`volunteer-card-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(volunteer.id);
              }}
            >
              {isSelected && <Check size={14} color="#FFFFFF" />}
            </button>
          )}
          <div>
            <div className="volunteer-card-id">{volunteer.volunteerId}</div>
            <div className="volunteer-card-name">{volunteer.name}</div>
          </div>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Access Level Band */}
      {renderAccessLevelBand()}

      {/* Details */}
      <div className="volunteer-card-details">
        <div className="volunteer-card-detail-row">
          <span className="volunteer-card-detail-label">CNIC:</span>
          <span className="volunteer-card-detail-value">{volunteer.cnic}</span>
        </div>
        <div className="volunteer-card-detail-row">
          <span className="volunteer-card-detail-label">Event:</span>
          <span className="volunteer-card-detail-value">Event {volunteer.eventNumber}</span>
        </div>
        <div className="volunteer-card-detail-row">
          <span className="volunteer-card-detail-label">Duty:</span>
          <span className="volunteer-card-detail-value">{volunteer.dutyTypeName}</span>
        </div>
        <div className="volunteer-card-detail-row">
          <span className="volunteer-card-detail-label">Region:</span>
          <span className="volunteer-card-detail-value">{getRegionLabel(volunteer.region)}</span>
        </div>
        <div className="volunteer-card-detail-row">
          <span className="volunteer-card-detail-label">Source:</span>
          <span className="volunteer-card-detail-value">{getDataSourceLabel(volunteer.source)}</span>
        </div>
      </div>

      {/* Discrepancy Warning */}
      {renderDiscrepancyWarning()}

      {/* Print Status */}
      {volunteer.printStatus !== PrintStatus.NOT_PRINTED && (
        <div className="volunteer-card-print-status">
          <Printer size={14} />
          <span
            className="volunteer-card-print-badge"
            style={{ backgroundColor: printStatusConfig.color, color: printStatusConfig.textColor }}
          >
            {printStatusConfig.label}
          </span>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="volunteer-card-actions">
          <button
            className="volunteer-card-action-btn approve"
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.(volunteer.id);
            }}
          >
            <Check size={16} />
            Approve
          </button>
          <button
            className="volunteer-card-action-btn reject"
            onClick={(e) => {
              e.stopPropagation();
              onReject?.(volunteer.id);
            }}
          >
            <X size={16} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerCard;
