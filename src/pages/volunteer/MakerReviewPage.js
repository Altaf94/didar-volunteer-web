import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Header from '../../components/Header/Header';
import { usePermissions } from '../../hooks/usePermissions';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import { getAccessLevelLabel, getDutyById, getDutyByCode } from '../../constants/volunteerConstants';
import './MakerReviewPage.css';

const getRecordImportId = (record) => {
  if (!record || typeof record !== 'object') return '';
  const keys = [
    'importId',
    'import_id',
    'importFileId',
    'import_file_id',
    'batchId',
    'batch_id',
  ];
  for (const key of keys) {
    const val = record[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  if (record.importBatch && typeof record.importBatch === 'object') {
    for (const key of ['id', 'importId', 'import_id', 'importFileId']) {
      const val = record.importBatch[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
  }
  return '';
};

const MakerReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [batchId, setBatchId] = useState(location?.state?.batchId ?? null);
  const [viewMode] = useState('compact'); // 'compact' or 'detailed'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 13; // show 13 entries per page
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState(false);
  const { canMake } = usePermissions();

  useEffect(() => {
    if (!batchId) {
      // try to read query param
      const params = new URLSearchParams(window.location.search);
      const q = params.get('batchId') || params.get('importId');
      if (q) setBatchId(q);
    }
  }, [location, batchId]);

  useEffect(() => {
    const load = async () => {
      try {
        let userId = null;
        const token = tokenService.getAccessToken();
        try {
          const payloadPart = token?.split('.')?.[1];
          if (payloadPart) {
            const payload = JSON.parse(tokenService.safeBase64Decode(payloadPart));
            userId = payload.user_id || payload.id || payload.sub || null;
          }
        } catch (e) {
          // ignore
        }

        const body = { userId };
        if (batchId) {
          body.importId = batchId;
          body.import_id = batchId;
        }
        const resp = await volunteerApiService.getVolunteersByImportOrUser(body);
        const data = Array.isArray(resp) ? resp : [];
        const targetImportId = batchId != null ? String(batchId).trim() : '';
        const scopedData =
          targetImportId.length > 0
            ? (() => {
                const hasAnyImportId = data.some((row) => getRecordImportId(row) !== '');
                if (!hasAnyImportId) return data;
                return data.filter((row) => getRecordImportId(row) === targetImportId);
              })()
            : data;
        // only show records still pending maker approval
        const pending = scopedData.filter(
          (r) => (r.recordStatus || r.record_status || '').toLowerCase() === 'maker'
        );
        setRecords(pending);
      } catch (err) {
        console.error('Failed to load review records', err);
        setRecords([]);
      }
    };

    load();
  }, [batchId]);

  // reset / clamp current page when filtered records change
  useEffect(() => {
    // placeholder; filteredRecords defined after fields
  }, [currentPage]);

  const getVal = (obj, keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null) return v;
    }
    return '';
  };

  const formatFieldValue = (field, record) => {
    let raw = getVal(record, field.keys);
    // fallback: if not found, try nested search for matching key substrings
    const findNested = (obj, substrings = []) => {
      if (!obj || typeof obj !== 'object') return undefined;
      for (const k of Object.keys(obj)) {
        const lk = k.toString().toLowerCase();
        for (const sub of substrings) {
          if (lk.includes(sub)) return obj[k];
        }
        const nested = findNested(obj[k], substrings);
        if (nested !== undefined) return nested;
      }
      return undefined;
    };

    if (raw === undefined || raw === null || raw === '') {
      if (field.label === 'Access Level') {
        raw = findNested(record, ['access', 'access_level']);
      }
      if ((field.label === 'Duty Type' || !raw) ) {
        raw = findNested(record, ['duty', 'duty_type', 'role']);
      }
    }
    if (raw === undefined || raw === null) return '';

    // if object return a readable prop
    if (typeof raw === 'object') {
      if (raw.name) return raw.name;
      if (raw.label) return raw.label;
      if (raw.code) return raw.code;
      if (raw.id) return raw.id;
      return JSON.stringify(raw);
    }

    // Access Level mapping (numeric -> label)
    if (field.label === 'Access Level') {
      const n = Number(raw);
      if (!Number.isNaN(n)) return getAccessLevelLabel(n);
      return String(raw);
    }

    // Duty Type mapping (code or id -> name)
    if (field.label === 'Duty Type') {
      const asStr = String(raw);
      const byCode = getDutyByCode(asStr);
      if (byCode) return byCode.name;
      const byId = getDutyById(asStr);
      if (byId) return byId.name;
      return asStr;
    }

    return String(raw);
  };

  const fields = [
    { label: 'CNIC', keys: ['cnic', 'CNIC'] },
    { label: 'Name', keys: ['name'] },
    { label: 'Event', keys: ['event', 'eventName', 'event_id', 'eventId'] },
    { label: 'Access Level', keys: ['accessLevel', 'accessLevelName', 'access_level', 'access_level_id'] },
    { label: 'Duty Type', keys: ['dutyType', 'duty_type', 'duty'] },
    { label: 'Register', keys: ['register', 'Register'] },
    { label: 'Decision Status', keys: ['decision_status', 'decisionStatus', 'decision'] },
  ];

  const getRecordId = (record) => {
    const keys = ['id', 'Id', 'record_id', 'recordId', 'volunteer_id', 'volunteerId'];
    for (const key of keys) {
      const value = record?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };

  const [allApproved, setAllApproved] = useState(false);

  useEffect(() => {
    // determine approval status from records, and from localStorage fallback (in case backend hasn't updated yet)
    try {
      const approvedBatches = JSON.parse(localStorage.getItem('makerApproved_batches') || '[]');
      const approvedIds = JSON.parse(localStorage.getItem('makerApproved_ids') || '[]');

      const byStatus = records.length > 0 && records.every(r => {
        const status = (r.decisionStatus || r.decision_status || '').toLowerCase();
        return status === 'approved';
      });

      const byBatch = batchId && approvedBatches.includes(String(batchId));
      const byIds = records.length > 0 && records.every(r => approvedIds.includes(String(getRecordId(r))));

      setAllApproved(Boolean(byStatus || byBatch || byIds));
    } catch (e) {
      setAllApproved(false);
    }
  }, [records, batchId]);

  const handleApprove = async () => {
    if (!canMake) {
      alert('You do not have permission to approve records.');
      return;
    }
    if (!records.length) return;

    setApproving(true);
    try {
      // Prepare approval data - send records exactly as the maker is seeing them (no additions)
      const approvalData = records;

      // Call API to submit maker decisions
      await volunteerApiService.submitMakerDecisions(approvalData);

      // Update remaining counts in event-access-level-duty requirements
      try {
        await volunteerApiService.updateRemainingCounts();
      } catch (e) {
        console.warn('Failed to update remaining counts:', e);
      }

      // Persist approved batch/ids locally so returning users don't re-send
      try {
        const approvedBatches = JSON.parse(localStorage.getItem('makerApproved_batches') || '[]');
        if (batchId && !approvedBatches.includes(String(batchId))) {
          approvedBatches.push(String(batchId));
          localStorage.setItem('makerApproved_batches', JSON.stringify(approvedBatches));
        }
        const approvedIds = JSON.parse(localStorage.getItem('makerApproved_ids') || '[]');
        records.forEach(r => {
          const id = String(getRecordId(r));
          if (id && !approvedIds.includes(id)) approvedIds.push(id);
        });
        localStorage.setItem('makerApproved_ids', JSON.stringify(approvedIds));
      } catch (e) {
        // ignore storage errors
      }

      // Do not alter local `records` — keep them exactly as they were

      // mark all approved locally and navigate after approval succeeds
      setAllApproved(true);
      navigate('/maker');
    } catch (err) {
      console.error('Failed to approve records', err);
      alert('Error approving records: ' + (err.message || err));
    } finally {
      setApproving(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const q = (search || '').toString().trim().toLowerCase();
    if (!q) return true;
    const cnic = String(getVal(r, ['cnic', 'CNIC']) || '');
    const name = String(getVal(r, ['name']) || '');
    return cnic.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  // reset / clamp current page when filtered records change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [filteredRecords, currentPage, pageSize]);

  return (
    <div className="maker-review-page">
      <Header title="Review Records" subtitle={batchId ? `Import ID: ${batchId}` : ''} onLogout={() => navigate('/login')} />

      <div className="review-content">
        <div className="review-header">
          <h2>Imported Records</h2>
        </div>

        <div className="search-bar">
          <input
            type="search"
            placeholder="Search CNIC or name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {viewMode === 'compact' ? (
          <div className="records-table">
            <div className="table-head">
              {fields.map(f => (
                <div key={f.label} className="head-cell">{f.label}</div>
              ))}
            </div>
            {(() => {
              const start = (currentPage - 1) * pageSize;
              const pageRecords = filteredRecords.slice(start, start + pageSize);
              return pageRecords.map((r, idx) => (
                <div key={start + idx} className="table-row">
                  {fields.map(f => (
                    <div key={f.label} className="cell">{formatFieldValue(f, r)}</div>
                  ))}
                </div>
              ));
            })()}
            <div className="pagination">
              <div className="pagination-left">
                <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
              </div>
              <div className="pagination-center">
                <div className="page-info">Page {currentPage} of {Math.max(1, Math.ceil(filteredRecords.length / pageSize))} — {filteredRecords.length} records</div>
                <button className="page-btn" disabled={currentPage >= Math.ceil(filteredRecords.length / pageSize)} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredRecords.length / pageSize), p + 1))}>Next</button>
              </div>
              <div className="pagination-right">
                {allApproved ? (
                  <div className="approved-message">✓ All records approved</div>
                ) : (
                  <button
                    className="approve-btn"
                    onClick={canMake ? handleApprove : undefined}
                    disabled={!canMake || approving || !records.length}
                    style={{ opacity: canMake ? 1 : 0.6 }}
                    title={!canMake ? 'You do not have permission to approve records' : ''}
                  >
                    <Check size={16} />
                    {canMake ? (approving ? 'Submitting...' : 'Submit To Checker') : 'No Permission'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="records-list">
            {(() => {
              const start = (currentPage - 1) * pageSize;
              const pageRecords = filteredRecords.slice(start, start + pageSize);
              return pageRecords.map((r, idx) => (
                <div key={start + idx} className="record-card vertical">
                  {fields.map(f => (
                    <div key={f.label} className="field-row">
                      <div className="field-label">{f.label}</div>
                      <div className="field-value">{formatFieldValue(f, r)}</div>
                    </div>
                  ))}
                </div>
              ));
            })()}
            <div className="pagination">
              <div className="pagination-left">
                <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
              </div>
              <div className="pagination-center">
                <div className="page-info">Page {currentPage} of {Math.max(1, Math.ceil(filteredRecords.length / pageSize))} — {filteredRecords.length} records</div>
                <button className="page-btn" disabled={currentPage >= Math.ceil(filteredRecords.length / pageSize)} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredRecords.length / pageSize), p + 1))}>Next</button>
              </div>
              <div className="pagination-right">
                {allApproved ? (
                  <div className="approved-message">✓ All records approved</div>
                ) : (
                  <button
                    className="approve-btn"
                    onClick={handleApprove}
                    disabled={!canMake || approving || !records.length}
                    style={{ opacity: canMake ? 1 : 0.6 }}
                    title={!canMake ? 'You do not have permission to approve records' : ''}
                  >
                    <Check size={16} />
                    {approving ? 'Submitting...' : canMake ? 'Submit To Checker' : 'No Permission'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakerReviewPage;
