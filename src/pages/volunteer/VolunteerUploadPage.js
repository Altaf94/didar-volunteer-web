// ============================================
// VOLUNTEER UPLOAD PAGE
// Page for uploading Excel files with volunteer data
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import FileUpload from '../../components/volunteer/FileUpload';
import Alert from '../../components/Alert/Alert';
// colors not used here
import { useVolunteer } from '../../context/VolunteerContext';
import { useAuth } from '../../context/AuthContext';
import { getRegionLabel } from '../../constants/volunteerConstants';
import { useAlert } from '../../hooks/useAlert';
import './VolunteerUploadPage.css';

const VolunteerUploadPage = () => {
  const navigate = useNavigate();
  // upload state is handled inside FileUpload component

  const { uploadVolunteerData, userRegion } = useVolunteer();
  const { logout } = useAuth();
  const { alert, showSuccess, showError, hideAlert } = useAlert();

  const handleUploadSuccess = (batch) => {
    const totalRecords = batch?.uploadMeta?.totalRecords || batch?.recordCount || batch?.totalRecords || 0;
    const validRecords = batch?.uploadMeta?.validRecords || batch?.validRecords || 0;
    const discrepantRecords = batch?.uploadMeta?.discrepantRecords || batch?.discrepantRecords || 0;

    showSuccess(
      'Upload Successful',
      `${totalRecords} records processed. ${validRecords} valid, ${discrepantRecords} need review.`
    );

    setTimeout(() => {
      const batchId = batch?.uploadMeta?.importBatch?.id || batch?.id || null;
      if (batchId) {
        navigate('/maker/review', { state: { batchId } });
      } else {
        navigate('/maker');
      }
    }, 2000);
  };

  const handleUploadError = (error) => {
    showError('Upload Failed', error);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="upload-page">
      <Header
        title="Upload Volunteer Data"
        subtitle={userRegion ? getRegionLabel(userRegion) : 'Select Region'}
        onLogout={handleLogout}
      />

      <Alert
        type={alert.type}
        title={alert.title}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        autoClose
      />

      <div className="upload-page-content">
        {/* Instructions */}
        <div className="instructions-card">
          <h3 className="instructions-title">📋 Upload Instructions</h3>
          <ol className="instructions-list">
            <li>Select the region for this upload</li>
            <li>Choose the data source (Local Council, ITREB, etc.)</li>
            <li>Upload an Excel file with volunteer data</li>
            <li>
              System will automatically validate:
              <ul className="sub-instructions">
                <li>CNIC verification</li>
                <li>Duplicate detection</li>
                <li>Discrepancy checks</li>
              </ul>
            </li>
            <li>Review and approve/reject records</li>
          </ol>
        </div>

        {/* File Upload Component */}
        <FileUpload
          onUpload={uploadVolunteerData}
          region={userRegion}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />

        {/* Validation Rules Info */}
        <div className="rules-card">
          <h3 className="rules-title">⚙️ Validation Rules</h3>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-badge yellow">⚠️</span>
              <div className="rule-content">
                <h4 className="rule-name">2. Duplicate Rejection</h4>
                <p className="rule-desc">
                  System blocks same event + same duty entries
                </p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-badge yellow">⚠️</span>
              <div className="rule-content">
                <h4 className="rule-name">3. Discrepancy Flagging</h4>
                <p className="rule-desc">
                  Identifies multiple duties within a single event
                </p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-badge blue">ℹ️</span>
              <div className="rule-content">
                <h4 className="rule-name">4. Multiple Events</h4>
                <p className="rule-desc">
                  Person working in multiple events → Allowed but flagged
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/maker')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default VolunteerUploadPage;
