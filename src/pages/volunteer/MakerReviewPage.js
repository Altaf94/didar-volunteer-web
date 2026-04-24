import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import { getAccessLevelLabel, getDutyById, getDutyByCode } from '../../constants/volunteerConstants';
import './MakerReviewPage.css';

const MakerReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState(location?.state?.batchId ?? null);
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'detailed'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 13; // show 13 entries per page
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!batchId) {
      // try to read query param
      const params = new URLSearchParams(window.location.search);
      const q = params.get('batchId') || params.get('importId');
      if (q) setBatchId(q);
    }
  }, [location]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
        const data = resp || [];
        // only show records still pending maker approval
        const pending = data.filter(
          (r) => (r.recordStatus || r.record_status || '').toLowerCase() === 'maker'
        );
        setRecords(pending);
      } catch (err) {
        console.error('Failed to load review records', err);
        setRecords([]);
      } finally {
        setLoading(false);
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
    { label: 'Sno', keys: ['Sno', 'sno', 'record_number', 'recordNumber'] },
    { label: 'CNIC', keys: ['cnic', 'CNIC'] },
    { label: 'Name', keys: ['name'] },
    { label: 'Event', keys: ['event', 'eventName', 'event_id', 'eventId'] },
    { label: 'Access Level', keys: ['accessLevel', 'accessLevelName', 'access_level', 'access_level_id'] },
    { label: 'Duty Type', keys: ['dutyType', 'duty_type', 'duty'] },
    { label: 'Register', keys: ['register', 'Register'] },
    { label: 'Decision Status', keys: ['decision_status', 'decisionStatus', 'decision'] },
    { label: 'Created At', keys: ['created_at', 'createdAt'] },
  ];

  const getRecordId = (record) => {
    const keys = ['id', 'Id', 'record_id', 'recordId', 'volunteer_id', 'volunteerId'];
    for (const key of keys) {
      const value = record?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };

  const handleApprove = async () => {
    if (!records.length) return;

    // extract userId from token if available
    let userId = null;
    try {
      const token = tokenService.getAccessToken();
      const payloadPart = token?.split('.')?.[1];
      if (payloadPart) {
        const payload = JSON.parse(tokenService.safeBase64Decode(payloadPart));
        userId = payload.user_id || payload.id || payload.sub || null;
      }
    } catch (e) {
      // ignore
    }

    const eventField = fields.find(f => f.label === 'Event');
    const accessField = fields.find(f => f.label === 'Access Level');
    const dutyField = fields.find(f => f.label === 'Duty Type');

    setApproving(true);
    try {
      setRecords((prev) => prev.map((record) => ({
        ...record,
        decisionStatus: 'approved',
        decision_status: 'approved',
        status: record.status || 'approved',
      })));
      navigate('/maker');
    } catch (err) {
      console.error('Failed to approve records', err);
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

  if (loading) return <IsmailiLoader message="Loading records..." />;

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
                <button
                  className="approve-btn"
                  onClick={handleApprove}
                  disabled={approving || !records.length}
                >
                  <Check size={16} />
                  {approving ? 'Approving...' : 'Approved'}
                </button>
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
                <button
                  className="approve-btn"
                  onClick={handleApprove}
                  disabled={approving || !records.length}
                >
                  <Check size={16} />
                  {approving ? 'Approving...' : 'Approved'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakerReviewPage;
