// ============================================
// CHECKER PRINT PAGE
// Display approved volunteers ready for printing
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import volunteerApiService from '../../services/volunteerApi';
import './CheckerPrintPage.css';
import { generatePdf } from '../../utils/pdfGenerator';

const CheckerPrintPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if data was passed via navigation state
        if (location.state?.printData) {
          setPrintData(location.state.printData);
          setLoading(false);
        } else {
          // Fetch data if not passed
          const data = await volunteerApiService.getMakerDecisionsOk();
          setPrintData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load print data:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/checker');
  };

  const handlePrint = async (importId, records) => {
    console.log('Printing badges for import:', importId);
    
    try {
      // Format eventName: "Ishkoman - 2" → "Ishkoman Day 2"
      const formatEventName = (name) => {
        if (!name) return '';
        const match = name.match(/^(.+?)\s*-\s*(\d+)$/);
        return match ? `${match[1].trim()} Day ${match[2]}` : name;
      };

      // Convert records to specified format
      const data = records.map(record => ({
        field1: formatEventName(record.eventName),
        field2: record.dutyTypeName || '',
        field3: record.name || '',
        field4: record.cnic || record.CNIC || '',
        field5: record.accessLevelName || ''
      }));

      generatePdf(data, `stickers_import_${importId}.pdf`);
      console.log('Formatted print data:', data);
      
      // Mark records as printed in the database
      await volunteerApiService.markMakerDecisionsPrinted(importId);
      console.log('Successfully marked import as printed:', importId);
      
      
    } catch (err) {
      console.error('Failed to mark as printed:', err);
      alert(`Badges printed, but failed to update status: ${err.message}`);
    }
  };


  if (loading) {
    return <IsmailiLoader message="Loading print data..." />;
  }

  if (error) {
    return (
      <div className="checker-print">
        <Header
          title="Print Badges"
          onLogout={handleLogout}
        />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="back-btn" onClick={handleBack}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Convert object to array of [importId, records]
  const importEntries = printData ? Object.entries(printData) : [];
  const totalRecords = importEntries.reduce((sum, [, records]) => sum + records.length, 0);

  return (
    <div className="checker-print">
      <Header
        title="Print Badges"
        subtitle={`${totalRecords} badges ready to print`}
        onLogout={handleLogout}
      />

      <div className="checker-print-content">
        <div className="actions-bar">
          <button className="back-btn" onClick={handleBack}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>

        {importEntries.length === 0 ? (
          <div className="empty-state">
            <Printer size={64} color={colors.gray} />
            <h3>No Badges Ready to Print</h3>
            <p>There are no approved volunteers ready for printing at this time.</p>
          </div>
        ) : (
          <div className="imports-container">
            {importEntries.map(([importId, records]) => (
              <div key={importId} className="import-section">
                <div className="import-header">
                  <div className="import-info">
                    <h2>Import ID: {importId}</h2>
                    <span className="badge-count">{records.length} badges</span>
                  </div>
                  <div className="import-actions">
                      <button
                      className="action-btn print-btn"
                      onClick={() => handlePrint(importId,records)}
                    >
                      <Printer size={18} />
                      Print
                    </button>
                  </div>
                </div>

                {/* Table view - shown on screen */}
                <div className="table-container screen-only">
                  <table className="volunteers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>CNIC</th>
                        <th>Name</th>
                        <th>Event</th>
                        <th>Access Level</th>
                        <th>Duty Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={record.decisionId || record.id}>
                          <td>{index + 1}</td>
                          <td className="cnic">{record.cnic}</td>
                          <td className="name">{record.name}</td>
                          <td>{record.eventName}</td>
                          <td>{record.accessLevelName}</td>
                          <td>{record.dutyTypeName}</td>
                          <td>
                            <span className={`status-badge ${record.decisionStatus?.toLowerCase()}`}>
                              {record.decisionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Badge cards - shown only when printing */}
                <div className="badges-grid print-only">
                  {records.map((record) => (
                    <div key={record.decisionId || record.id} className="badge-card">
                      <div className="badge-content">
                        <div className="badge-field">{record.accessLevelName || 'Access Level'}</div>
                        <div className="badge-field">{record.eventName || 'Event'}</div>
                        <div className="badge-field">{record.dutyTypeName || 'Duty Type'}</div>
                        <div className="badge-field badge-name">{record.name}</div>
                        <div className="badge-field badge-cnic">{record.cnic}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckerPrintPage;
