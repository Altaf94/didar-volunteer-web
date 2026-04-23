import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
// Import Mock Data
import { mockDatabase, RecordStatus, DiscrepancyType } from '../../types/mockDb';
// Import Helpers
import { getStatusBadgeClass, canSubmitForPrinting } from '../../utils/checkerHelpers';
// Import CSS
import './CheckerReviewPage.css'; // CSS file same rahegi

const CheckerReviewPage = () => {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Initial Load of Data
    const pendingRecords = mockDatabase.filter(
      (r) => r.status === RecordStatus.AWAITING_CHECKER || r.status === RecordStatus.DISCREPANT
    );
    setRecords(pendingRecords);
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'DISCREPANT_1') return r.discrepancyType === DiscrepancyType.SAME_EVENT_MULTIPLE_DUTIES;
    if (filter === 'DISCREPANT_2') return r.discrepancyType === DiscrepancyType.MULTIPLE_EVENTS;
    return true;
  });

  const remainingDiscrepancies = records.filter(r => r.status === RecordStatus.DISCREPANT).length;

  // Resolve Logic: Same Event, Multiple Duties
  const handleResolveDiscrepant1 = (keepId, rejectId) => {
    setRecords((prev) => prev.map((r) => {
      if (r.id === keepId) return { ...r, status: RecordStatus.APPROVED };
      if (r.id === rejectId) return { ...r, status: RecordStatus.REJECTED };
      return r;
    }));
  };

  // Resolve Logic: Multiple Events
  const handleResolveDiscrepant2 = (id, action) => {
    setRecords((prev) => prev.map((r) => {
      if (r.id === id) return { ...r, status: action === 'APPROVE' ? RecordStatus.APPROVED : RecordStatus.REJECTED };
      return r;
    }));
  };

  const handleBulkApproveNormal = () => {
    setRecords((prev) => prev.map((r) =>
      r.status === RecordStatus.AWAITING_CHECKER ? { ...r, status: RecordStatus.APPROVED } : r
    ));
  };

  const handleSubmitForPrinting = () => {
    if (!canSubmitForPrinting(remainingDiscrepancies)) {
      alert("Error: Please resolve all discrepant records first!");
      return;
    }
    alert("Success! Records moved to Print Queue.");
  };

  return (
    <div className="checker-review-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Checker Dashboard - Resolve Discrepancies</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-success" onClick={handleBulkApproveNormal}>Approve Clean Records</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmitForPrinting}
            style={{ opacity: remainingDiscrepancies > 0 ? 0.5 : 1 }}
          >
            Submit for Printing
          </button>
        </div>
      </div>

      {remainingDiscrepancies > 0 && (
        <div style={{ backgroundColor: '#fff7ed', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ea580c', marginBottom: '20px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412' }}>
            <AlertCircle size={20} /> Attention: {remainingDiscrepancies} Discrepant records need manual review.
          </strong>
        </div>
      )}

      <div className="table-container">
        <table className="professional-table">
          <thead>
            <tr>
              <th>CNIC</th>
              <th>Name</th>
              <th>Event</th>
              <th>Duty Type</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.cnic}</td>
                <td><strong>{record.name}</strong></td>
                <td>{record.event}</td>
                <td>{record.accessLevel} - {record.dutyType}</td>
                <td>
                  <span className={getStatusBadgeClass(record.status)}>
                    {record.status}
                  </span>
                  {record.status === RecordStatus.DISCREPANT && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      {record.discrepancyReason}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {record.status === RecordStatus.DISCREPANT && record.discrepancyType === DiscrepancyType.SAME_EVENT_MULTIPLE_DUTIES && (
                    <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => handleResolveDiscrepant1(record.id, record.conflictingRecordIds[0])}>
                      Keep This & Reject Conflict
                    </button>
                  )}
                  {record.status === RecordStatus.DISCREPANT && record.discrepancyType === DiscrepancyType.MULTIPLE_EVENTS && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <CheckCircle size={24} color="#16a34a" style={{ cursor: 'pointer' }} onClick={() => handleResolveDiscrepant2(record.id, 'APPROVE')} />
                      <XCircle size={24} color="#dc2626" style={{ cursor: 'pointer' }} onClick={() => handleResolveDiscrepant2(record.id, 'REJECT')} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckerReviewPage;
