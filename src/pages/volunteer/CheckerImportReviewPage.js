import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import { usePermissions } from '../../hooks/usePermissions';
import volunteerApiService from '../../services/volunteerApi';
import { tokenService } from '../../services/tokenService';
import { getAccessLevelLabel, getDutyById, getDutyByCode } from '../../constants/volunteerConstants';
import './MakerReviewPage.css';
import './CheckerImportReviewPage.css';

const pageSize = 8;
const DEFAULT_SUBMIT_REASON = 'Verified by checker';

const toIdNumber = (v) => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

const CheckerImportReviewPage = () => {
  const { importId: importIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingActions, setPendingActions] = useState({});
  const [submittingActions, setSubmittingActions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { canCheck } = usePermissions();

  const importId = importIdParam != null ? String(importIdParam) : '';
  const makerRecordsFromState = location.state?.makerRecords;

  const getRecordImportId = useCallback((record) => {
    if (!record || typeof record !== 'object') return '';
    const directKeys = [
      'importId',
      'import_id',
      'importFileId',
      'import_file_id',
      'batchId',
      'batch_id',
    ];
    for (const key of directKeys) {
      const val = record[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    if (record.importBatch && typeof record.importBatch === 'object') {
      const nested = record.importBatch;
      for (const key of ['id', 'importId', 'import_id', 'importFileId']) {
        const val = nested[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
    return '';
  }, []);

  const filterRowsForImport = useCallback(
    (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      if (!importId) return list;
      const target = String(importId).trim();
      const hasAnyImportId = list.some((row) => getRecordImportId(row) !== '');
      if (!hasAnyImportId) return list;
      return list.filter((row) => getRecordImportId(row) === target);
    },
    [getRecordImportId, importId],
  );

  const getVal = (obj, keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null) return v;
    }
    return '';
  };

  const formatFieldValue = useCallback((field, record) => {
    if (field.label === 'Maker') {
      const m = record?.maker;
      if (m && typeof m === 'object') {
        const n = m.name || m.fullName || m.displayName || m.userName || m.email;
        if (n != null && String(n).trim() !== '') return String(n);
      }
      const nameKeys = [
        'makerName',
        'maker_name',
        'MakerName',
        'makerFullName',
        'maker_full_name',
        'makerUserName',
        'maker_user_name',
        'createdByName',
        'submittedByName',
      ];
      for (const k of nameKeys) {
        const v = record[k];
        if (v != null && String(v).trim() !== '') return String(v);
      }
      const id = getVal(record, ['makerId', 'maker_id']);
      return id != null && id !== '' ? String(id) : '';
    }

    let raw = getVal(record, field.keys);
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
      if (field.label === 'Duty type' && !raw) {
        raw = findNested(record, ['duty', 'duty_type', 'role']);
      }
    }
    if (raw === undefined || raw === null) return '';

    if (typeof raw === 'object') {
      if (raw.name) return raw.name;
      if (raw.label) return raw.label;
      if (raw.code) return raw.code;
      if (raw.id) return String(raw.id);
      return JSON.stringify(raw);
    }

    if (field.label === 'Access level') {
      const n = Number(raw);
      if (!Number.isNaN(n)) return getAccessLevelLabel(n);
      return String(raw);
    }

    if (field.label === 'Duty type') {
      const asStr = String(raw);
      const byCode = getDutyByCode(asStr);
      if (byCode) return byCode.name;
      const byId = getDutyById(asStr);
      if (byId) return byId.name;
      return asStr;
    }

    return String(raw);
  }, []);

  const fields = [
    { label: 'CNIC', keys: ['cnic', 'CNIC'] },
    { label: 'Name', keys: ['name'] },
    { label: 'Event', keys: ['eventName', 'event', 'eventId', 'event_id'] },
    { label: 'Access level', keys: ['accessLevelName', 'accessLevel', 'access_level', 'access_level_id'] },
    { label: 'Duty type', keys: ['dutyTypeName', 'dutyType', 'duty_type', 'duty'] },
    { label: 'Register', keys: ['register', 'Register'] },
    { label: 'Decision', keys: ['decisionStatus', 'decision_status', 'decision'] },
    { label: 'Maker', keys: ['makerId', 'maker_id'] },
    { label: 'Action', isAction: true },
  ];
  const tableColumns = fields;

  useEffect(() => {
    if (!importId) {
      setLoading(false);
      setRecords([]);
      return;
    }

    const hasStatePayload = location.state && Object.prototype.hasOwnProperty.call(location.state, 'makerRecords');

    if (hasStatePayload) {
      setLoadError(null);
      setRecords(filterRowsForImport(makerRecordsFromState));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await volunteerApiService.getMakerDecisions();
        if (cancelled) return;
        const map = data?.byImportId && typeof data.byImportId === 'object' ? data.byImportId : {};
        const key = Object.keys(map).find((k) => k === importId || String(k) === String(importId));
        const list = key != null ? map[key] : [];
        setRecords(filterRowsForImport(list));
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load import records for checker', e);
          setLoadError(e.message || 'Failed to load data');
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filterRowsForImport, importId, location.key, location.state, makerRecordsFromState]);

  const filteredRecords = records.filter((r) => {
    const q = (search || '').toString().trim().toLowerCase();
    if (!q) return true;
    const cnic = String(getVal(r, ['cnic', 'CNIC']) || '');
    const name = String(getVal(r, ['name']) || '');
    return cnic.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [filteredRecords.length]);

  const getRecordId = (record) => {
    const keys = [
      'id',
      'Id',
      'decisionId',
      'decision_id',
      'recordId',
      'record_id',
    ];
    for (const key of keys) {
      const value = record?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };

  const isDiscrepant = (record) => {
    const raw = getVal(record, [
      'decisionStatus',
      'decision_status',
      'decision',
    ]);
    const s = String(raw ?? '').trim().toLowerCase();
    return s === 'discrepant(1)' || s === 'discrepant(2)' || s === 'discrepant-1' || s === 'discrepant-2';
  };

  const showCheckerActions = (record) => {
    if (!isDiscrepant(record)) return false;
    const rid = getRecordId(record);
    // Hide buttons once an action has been taken
    return rid == null || pendingActions[String(rid)] == null;
  };

  const onCheckerAction = (action, record) => {
    if (!canCheck) {
      alert('You do not have permission to approve or reject records.');
      return;
    }
    const recordId = getRecordId(record);
    if (recordId == null) return;
    const oppositeAction = action === 'approve' ? 'reject' : 'approve';
    const thisCnic = String(record?.cnic ?? record?.CNIC ?? '').replace(/-/g, '');
    const updates = { [String(recordId)]: action };
    // Auto-set opposite action for the other Discrepant row of the same CNIC
    if (thisCnic) {
      records.forEach((r) => {
        const otherId = getRecordId(r);
        if (otherId == null || String(otherId) === String(recordId)) return;
        const otherCnic = String(r?.cnic ?? r?.CNIC ?? '').replace(/-/g, '');
        if (otherCnic !== thisCnic) return;
        if (showCheckerActions(r)) {
          updates[String(otherId)] = oppositeAction;
        }
      });
    }
    setPendingActions(prev => ({ ...prev, ...updates }));
  };

  const buildSubmitDecision = (record, action) => {
    // If Register is explicitly "No" / "no" / "false" / 0, always Reject; otherwise Ok
    const registerVal = String(record?.register ?? record?.Register ?? '').trim().toLowerCase();
    const isNotRegistered = registerVal === 'no' || registerVal === 'false' || registerVal === '0';
    const decisionStatus = isNotRegistered ? 'Reject' : (action === 'approve' ? 'Ok' : 'Reject');
    const item = { decisionStatus, reason: DEFAULT_SUBMIT_REASON };
    const rawVolunteerId = record.id ?? record.Id;
    const dcid = record.decisionId ?? record.decision_id;
    if (rawVolunteerId != null && rawVolunteerId !== '') {
      item.Id = toIdNumber(rawVolunteerId);
    }
    if (dcid != null && dcid !== '') {
      item.decisionId = toIdNumber(dcid);
    }
    if (item.Id === undefined && item.decisionId === undefined) {
      const keysOrder = [
        'id',
        'Id',
        'decisionId',
        'decision_id',
        'recordId',
        'record_id',
      ];
      const rid = getRecordId(record);
      for (const k of keysOrder) {
        const v = record?.[k];
        if (v == null || v === '' || String(v) !== String(rid)) continue;
        if (k === 'id' || k === 'Id' || k === 'recordId' || k === 'record_id') {
          item.Id = toIdNumber(rid);
        } else {
          item.decisionId = toIdNumber(rid);
        }
        return item;
      }
      if (rid != null) {
        item.Id = toIdNumber(rid);
      }
    }
    return item;
  };

  // Check if records are already verified by checker
  const isAlreadyVerified = records.some((r) => {
    const reason = String(r?.reason ?? '').trim().toLowerCase();
    const checkerId = r?.checkerId ?? r?.checker_id;
    return reason === 'verified by checker';
  });

  const onSubmitActions = async () => {
    if (!canCheck) {
      alert('You do not have permission to submit checker decisions.');
      return;
    }
    if (records.length === 0 || submittingActions || isAlreadyVerified) return;
    setSubmittingActions(true);
    try {
      // Use per-row actions if set; otherwise approve all records
      // Always send all records; use pending action if set, otherwise default to 'approve'
      const decisions = records
        .map((r) => {
          const rid = getRecordId(r);
          const action = (rid != null && pendingActions[String(rid)]) || 'approve';
          return buildSubmitDecision(r, action);
        })
        .filter(Boolean);

      const nImport = Number.parseInt(String(importId), 10);
      const importIdVal = Number.isNaN(nImport) ? importId : nImport;

      await volunteerApiService.submitMakerDecisionsByImport({
        importId: importIdVal,
        checkerId: (() => {
          try {
            const token = tokenService.getAccessToken();
            const payload = JSON.parse(tokenService.safeBase64Decode(token.split('.')[1]));
            return payload.user_id || payload.id || payload.sub || null;
          } catch { return null; }
        })(),
        decisions,
      });
      setPendingActions({});
      setSubmitted(true);
    } catch (e) {
      console.error('Submit maker decisions failed', e);
    } finally {
      setSubmittingActions(false);
    }
  };

  if (loading) {
    return <IsmailiLoader message="Loading import records…" />;
  }

  if (!importId) {
    return (
      <div className="checker-import-review-page">
        <div className="review-content">
          <p>Missing import ID.</p>
          <button type="button" className="checker-back-link" onClick={() => navigate('/checker')}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checker-import-review-page">
      <Header
        title="Review import"
        subtitle={`Import ID: ${importId}`}
        onLogout={() => navigate('/login')}
      />
      <div className="review-content">
        {loadError && (
          <p className="checker-import-error" role="alert">
            {loadError}
          </p>
        )}

        <div className="search-bar">
          <input
            type="search"
            placeholder="Search CNIC or name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="records-table checker-table-cell-wrap">
          <div className="table-head">
            {tableColumns.map((f) => (
              <div key={f.label} className="head-cell">
                {f.label}
              </div>
            ))}
          </div>
          {filteredRecords.length === 0 ? (
            <div className="checker-no-records">
              {records.length === 0
                ? 'No records for this import.'
                : 'No rows match your search.'}
            </div>
          ) : (
            (() => {
              const start = (currentPage - 1) * pageSize;
              const pageRecords = filteredRecords.slice(start, start + pageSize);
              return pageRecords.map((r, idx) => {
                const startIdx = start + idx;
                const rid = getRecordId(r);
                const rowKey = rid != null ? String(rid) : `row-${startIdx}`;
                return (
                  <div key={rowKey} className="table-row">
                    {tableColumns.map((f) => (
                      <div
                        key={f.label}
                        className={`cell${f.isAction ? ' cell-action' : ''}`}
                      >
                        {f.isAction ? (
                          showCheckerActions(r) ? (
                            <div className="checker-row-actions">
                              <button
                                type="button"
                                className={`checker-btn checker-btn-approve${pendingActions[String(getRecordId(r))] === 'approve' ? ' selected' : ''}`}
                                onClick={() => onCheckerAction('approve', r)}
                                disabled={!canCheck}
                                style={{ opacity: canCheck ? 1 : 0.6, cursor: canCheck ? 'pointer' : 'not-allowed' }}
                                title={!canCheck ? 'No permission to approve' : ''}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className={`checker-btn checker-btn-reject${pendingActions[String(getRecordId(r))] === 'reject' ? ' selected' : ''}`}
                                onClick={() => onCheckerAction('reject', r)}
                                disabled={!canCheck}
                                style={{ opacity: canCheck ? 1 : 0.6, cursor: canCheck ? 'pointer' : 'not-allowed' }}
                                title={!canCheck ? 'No permission to reject' : ''}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="checker-action-empty">—</span>
                          )
                        ) : f.label === 'Decision' ? (
                          (() => {
                            const pending = pendingActions[String(getRecordId(r))];
                            if (pending === 'approve') return 'Ok';
                            if (pending === 'reject') return 'Reject';
                            return formatFieldValue(f, r);
                          })()
                        ) : (
                          formatFieldValue(f, r)
                        )}
                      </div>
                    ))}
                  </div>
                );
              });
            })()
          )}
          {filteredRecords.length > 0 && (
            <div className="pagination">
              <div className="pagination-left">
                <button
                  className="page-btn"
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
              </div>
              <div className="pagination-center">
                <div className="page-info">
                  Page {currentPage} of {Math.max(1, Math.ceil(filteredRecords.length / pageSize))} —{' '}
                  {filteredRecords.length} records
                </div>
                <button
                  className="page-btn"
                  type="button"
                  disabled={currentPage >= Math.ceil(filteredRecords.length / pageSize)}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(filteredRecords.length / pageSize), p + 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div className="checker-submit-wrap">
            <button
              type="button"
              className="approve-btn checker-submit-btn"
              onClick={onSubmitActions}
              disabled={!canCheck || records.length === 0 || submittingActions || submitted || isAlreadyVerified}
              style={{ opacity: canCheck ? 1 : 0.6 }}
              title={!canCheck ? 'You do not have permission to submit decisions' : isAlreadyVerified ? 'Already verified by checker' : ''}
            >
              {submittingActions ? 'Submitting...' : (submitted || isAlreadyVerified) ? 'Submitted' : canCheck ? 'Submit' : 'No Permission'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckerImportReviewPage;
