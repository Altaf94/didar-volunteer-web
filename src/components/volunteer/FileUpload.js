// ============================================
// FILE UPLOAD COMPONENT
// Handles Excel file upload for volunteer data
// ============================================

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { colors } from '../../theme';
import { REGIONS, DATA_SOURCES } from '../../constants/volunteerConstants';
import { tokenService } from '../../services/tokenService';
import { parseExcelFile, validateExcelFormat, convertExcelToVolunteerData } from '../../utils/excelParser';
import './FileUpload.css';

const FileUpload = ({
  onUpload,
  region,
  onSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(region || '');
  // Determine whether region selection should be disabled based on token scope
  // If user scope is 'regional' -> disable Region (use token's region_id)
  // If user scope is 'national'  -> enable Region selection
  const userScope = tokenService.getUserScope();
  const isRegionDisabled = userScope === 'regional';
  const [selectedSource, setSelectedSource] = useState('');
  // Source Entity ID removed per request
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationPassed, setValidationPassed] = useState(false);
  const [, setValidationErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [, setEventsSamePassed] = useState(false);
  const [, setCapacityPassed] = useState(false);
  const [, setParsedRowCount] = useState(0);
  const fileInputRef = useRef(null);
  

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      onError?.('Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    // reset validation state while we parse
    setValidationPassed(false);
    setValidationErrors([]);
    setEventsSamePassed(false);
    setCapacityPassed(false);
    setParsedRowCount(0);
    setSelectedFile(file);
    setIsValidating(true);
    // parse and run validations
    parseExcelFile(file)
      .then(async (data) => {
        let localEventsSamePassed = true;
        let capacityErrors = [];
        // list of validation steps
        const checks = ['FORMAT', 'ROW_COUNT', 'CNIC_FORMAT', 'EVENTS_SAME', 'EVENT_CAPACITY'];
        const errors = [];

        checks.forEach((check) => {
          switch (check) {
            case 'FORMAT': {
              const required = ['cnic', 'name'];
              const res = validateExcelFormat(data, required);
              if (!res.isValid) errors.push(res.error || 'Invalid format');
              break;
            }
            case 'ROW_COUNT': {
              if (!data || data.length < 2) {
                errors.push('No data rows found');
              }
              break;
            }
            case 'CNIC_FORMAT': {
              // basic CNIC format: digits and optional dashes (allow short check)
              try {
                const rows = data.slice(1);
                const cnicIndex = (data[0] || []).map(h => h?.toString().toLowerCase()).indexOf('cnic');
                if (cnicIndex >= 0) {
                  const invalids = [];
                  rows.forEach((r, idx) => {
                    const val = r[cnicIndex]?.toString().trim();
                    if (val && !/^\d{13}$/.test(val.replace(/-/g, '')) ) {
                      if (invalids.length < 5) invalids.push(`row ${idx + 2}: ${val}`);
                    }
                  });
                  if (invalids.length > 0) errors.push(`Invalid CNIC format (${invalids.join('; ')})`);
                }
              } catch (e) {
                // ignore
              }
              break;
            }
            case 'EVENTS_SAME': {
              try {
                const headers = (data[0] || []).map(h => h?.toString().toLowerCase());
                // look for a header that likely represents event name/number
                const eventHeaderIndex = headers.findIndex(h => h && (h.includes('event') || h.includes('event_name') || h.includes('eventname')));
                if (eventHeaderIndex >= 0) {
                  const rows = data.slice(1);
                  const values = new Set();
                  rows.forEach((r) => {
                    const v = (r[eventHeaderIndex] || '').toString().trim();
                    if (v) values.add(v);
                  });
                  if (values.size > 1) {
                    errors.push('Event names are not the same across the file');
                    localEventsSamePassed = false;
                  } else {
                    localEventsSamePassed = true;
                  }
                }
              } catch (e) {
                // ignore
              }
              break;
            }
            default:
              break;
          }
        });

        // EVENT_CAPACITY requires an API call; run it if header info is present and no prior errors
        if (!errors.length) {
          // find header indices for event, access level and duty
          const headers = (data[0] || []).map(h => h?.toString().toLowerCase());
          const eventHeaderIndex = headers.findIndex(h => h && (h.includes('event') || h.includes('event_name') || h.includes('eventname') || h.includes('event number') || h.includes('event_number') || h.includes('eventno')));
          const accessHeaderIndex = headers.findIndex(h => h && (h.includes('access') || h.includes('access_level') || h.includes('accesslevel') || h.includes('access level')));
          const dutyHeaderIndex = headers.findIndex(h => h && (h.includes('duty') || h.includes('duty_type') || h.includes('dutytype') || h.includes('duty type') || h.includes('dutytype')));

          if (eventHeaderIndex >= 0 && accessHeaderIndex >= 0 && dutyHeaderIndex >= 0) {
            try {
              const token = await tokenService.getValidAccessToken();
              const resp = await fetch('http://127.0.0.1:8001/api/event-access-level-duty-requirements', {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!resp.ok) {
                throw new Error(`Capacity API responded with ${resp.status}`);
              }

              const requirements = await resp.json();

              // build counts from file
              const rows = data.slice(1);
              // store parsed row count for later import API call
              setParsedRowCount(rows.length);
              const counts = {};
              rows.forEach((r) => {
                const ev = (r[eventHeaderIndex] || '').toString().trim();
                const ac = (r[accessHeaderIndex] || '').toString().trim();
                const du = (r[dutyHeaderIndex] || '').toString().trim();
                if (ev && ac && du) {
                  const key = `${ev.toLowerCase()}|${ac.toLowerCase()}|${du.toLowerCase()}`;
                  counts[key] = (counts[key] || 0) + 1;
                }
              });

              

              // debug: show counts
              // console.debug('File counts summary:', counts);

              // compare against requirements by iterating file counts
              const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
              const tokens = (s) => normalize(s).split(/\s+/).filter(Boolean);

              const findMatchingRequirement = (evPart) => {
                const evNorm = normalize(evPart);
                if (!evNorm) return null;

                // exact or substring match
                let found = requirements.find(r => normalize(r.event) === evNorm || normalize(r.event).includes(evNorm) || evNorm.includes(normalize(r.event)));
                if (found) return found;

                // token intersection with requirement event
                const evTokens = tokens(evPart);
                found = requirements.find(r => {
                  const rTokens = tokens(r.event);
                  return rTokens.some(t => evTokens.includes(t)) || evTokens.some(t => rTokens.includes(t));
                });
                if (found) return found;

                // try matching by region label
                found = requirements.find(r => {
                  const regionMatch = REGIONS.find(reg => evNorm.includes(reg.label.toLowerCase()));
                  return regionMatch && normalize(r.event).includes(regionMatch.label.toLowerCase());
                });
                if (found) return found;

                return null;
              };

              for (const [k, fileCount] of Object.entries(counts)) {
                const parts = k.split('|').map(p => p.trim());
                const evPart = parts[0] || '';
                const accessPart = parts[1] || '';
                const dutyPart = parts[2] || '';

                // try to find matching requirement event (robust)
                let matchEvt = findMatchingRequirement(evPart);

                // fallback: if no event match, try to find any requirement that contains the matching access/duty
                if (!matchEvt) {
                  for (const r of requirements) {
                    const al = (r.accessLevels || []).find(a => {
                      const an = (a.accessLevel || '').toString().toLowerCase();
                      return an === accessPart.toLowerCase() || an.includes(accessPart.toLowerCase()) || accessPart.toLowerCase().includes(an);
                    });
                    if (!al) continue;
                    const du = (al.duties || []).find(d => {
                      const dn = (d.dutyType || d.duty || '').toString().toLowerCase();
                      return dn === dutyPart.toLowerCase() || dn.includes(dutyPart.toLowerCase()) || dutyPart.toLowerCase().includes(dn);
                    });
                    if (du) { matchEvt = r; break; }
                  }
                }

                if (!matchEvt) {
                  // no requirement for this event — skip capacity check (do not show missing-requirement messages)
                  continue;
                }

                // find access level
                const matchAccess = (matchEvt.accessLevels || []).find(al => {
                  const an = (al.accessLevel || '').toString().toLowerCase();
                  return an === accessPart.toLowerCase() || an.includes(accessPart.toLowerCase()) || accessPart.toLowerCase().includes(an);
                });

                if (!matchAccess) {
                  // no matching access level found for this event — skip
                  continue;
                }

                // find duty
                const matchDuty = (matchAccess.duties || []).find(d => {
                  const dn = (d.dutyType || d.duty || '').toString().toLowerCase();
                  return dn === dutyPart.toLowerCase() || dn.includes(dutyPart.toLowerCase()) || dutyPart.toLowerCase().includes(dn);
                });

                if (!matchDuty) {
                  // no matching duty found for this access level — skip
                  continue;
                }

                const remaining = Number(matchDuty.remaining ?? matchDuty.remaining_count ?? 0);
                const requiredCount = Number(matchDuty.requiredCount ?? matchDuty.required_count ?? 0);

                if (fileCount > remaining) {
                  const existing = requiredCount - remaining;
                  const msg = `Access: "${matchAccess.accessLevel}", Duty "${matchDuty.dutyType || matchDuty.duty}" already has "${existing}" volunteers so cannot process this file`;
                  errors.push(msg);
                  capacityErrors.push(msg);
                }
              }
              
            } catch (err) {
              errors.push(`Failed to validate event capacities: ${err.message || err}`);
              capacityErrors.push(`Failed to validate event capacities: ${err.message || err}`);
            }
            // set capacityPassed state from local array
            setCapacityPassed((capacityErrors || []).length === 0);
          }

        }

        // set eventsSamePassed state from local result
        setEventsSamePassed(localEventsSamePassed);

        const allPassed = errors.length === 0 && localEventsSamePassed && (capacityErrors || []).length === 0;
        if (allPassed) {
          setValidationPassed(true);
          setValidationErrors([]);
        } else {
          setValidationPassed(false);
          setValidationErrors(errors);
          onError?.(errors.join(' | '));
        }
      })
      .catch((err) => {
        setValidationPassed(false);
        setValidationErrors([err.message || 'Failed to parse file']);
        onError?.(err.message || 'Failed to parse file');
      })
      .finally(() => setIsValidating(false));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    const effectiveRegion = isRegionDisabled ? (tokenService.getUserRegionId() || '') : selectedRegion;

    if (!selectedFile || (!isRegionDisabled && !selectedRegion) || !selectedSource) {
      onError?.('Please fill in all required fields');
      return;
    }

    setIsUploading(true);

    try {
      // Parse Excel file and convert to volunteer data
      const excelData = await parseExcelFile(selectedFile);
      const volunteers = convertExcelToVolunteerData(excelData);

      // debug: show parsed volunteers and incoming headers to verify mapping
      // eslint-disable-next-line no-console
      console.debug('Excel headers:', excelData && excelData[0]);
      // eslint-disable-next-line no-console
      console.debug('Parsed volunteers (first 20):', volunteers.slice(0, 20));

      if (!volunteers || volunteers.length === 0) {
        throw new Error('No valid volunteer data found in Excel file');
      }

      // CNIC_USAGE: check that CNICs exist in registration table before uploading
      const cnicApiBase = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001';
      const cnicTokenForCheck = await tokenService.getValidAccessToken();
      const cnicCheckHeaders = { 'Content-Type': 'application/json' };
      if (cnicTokenForCheck) cnicCheckHeaders.Authorization = `Bearer ${cnicTokenForCheck}`;
      const cnicsToCheck = [...new Set(volunteers.map(v => v.cnic.replace(/-/g, '')).filter(Boolean))];
      let notFoundCnics = new Set();
      if (cnicsToCheck.length > 0) {
        const cnicResp = await fetch(`${cnicApiBase}/api/cnic-usage/batch`, {
          method: 'POST',
          headers: cnicCheckHeaders,
          body: JSON.stringify({ cnics: cnicsToCheck }),
        });
        if (!cnicResp.ok) {
          const txt = await cnicResp.text().catch(() => '');
          throw new Error(`CNIC usage check failed: ${cnicResp.status} ${txt}`);
        }
        const cnicResult = await cnicResp.json().catch(() => null);
        // Extract list of CNICs not found in registration table
        const notFoundList = Array.isArray(cnicResult?.notFound) ? cnicResult.notFound : (cnicResult?.not_found || []);
        notFoundCnics = new Set(notFoundList.map(c => String(c).replace(/-/g, '')));
        // Continue with upload even if some CNICs are not found in registration table
      }

      // Get token for authorization and extract userId from token payload
      const token = await tokenService.getValidAccessToken();
      let userId = null;
      try {
        const payloadPart = token?.split('.')?.[1];
        if (payloadPart) {
          const payload = JSON.parse(tokenService.safeBase64Decode(payloadPart));
          userId = payload.user_id || payload.id || payload.sub || null;
        }
      } catch (e) {
        // ignore
      }

      // Register import batch first
      const importBatchResp = await fetch('http://127.0.0.1:8001/api/import-batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          recordCount: volunteers.length,
          userId,
        }),
      });

      if (!importBatchResp.ok) {
        const txt = await importBatchResp.text();
        throw new Error(`Import batch registration failed: ${importBatchResp.status} ${txt}`);
      }

      const importBatchResult = await importBatchResp.json();
      // determine import id from response (backend returns importFileId)
      const importId = importBatchResult?.importFileId ?? importBatchResult?.id ?? importBatchResult?.import_id ?? null;

      // Send all records in a single batch to /api/volunteers/records
      const recordsUrl = 'http://127.0.0.1:8001/api/volunteers/records';
      const recordsPayload = volunteers.map(v => {
        const cnicNormalized = v.cnic.replace(/-/g, '');
        const isRegistered = !notFoundCnics.has(cnicNormalized);
        return {
          Sno: v.rowNumber,
          userId: userId,
          cnic: v.cnic,
          name: v.name,
          // send descriptive strings for event, accessLevel and dutyType when available
          event: v.eventName && v.eventName.length ? v.eventName : (v.eventNumber != null ? String(v.eventNumber) : ''),
          accessLevel: v.accessLevelName && v.accessLevelName.length ? v.accessLevelName : (v.accessLevel != null ? String(v.accessLevel) : ''),
          dutyType: v.dutyType != null ? String(v.dutyType) : '',
          importId: importId,
          decisionStatus: 'pending',
          register: isRegistered ? 'Yes' : 'No',
        };
      });

      // debug: inspect payload to verify accessLevel/dutyType presence
      // eslint-disable-next-line no-console
      console.debug('Uploading recordsPayload:', recordsPayload);

      const batchResp = await fetch(recordsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordsPayload),
      });

      if (!batchResp.ok) {
        const txt = await batchResp.text().catch(() => '');
        throw new Error(`Batch upload failed: ${batchResp.status} ${txt}`);
      }

      const batchResult = await batchResp.json().catch(() => null);
      const totalRecords = recordsPayload.length;
      const validRecords = batchResult?.validRecords ?? batchResult?.successCount ?? totalRecords;
      const discrepantRecords = batchResult?.discrepantRecords ?? batchResult?.failedCount ?? (totalRecords - validRecords);

      const result = await onUpload({
        file: selectedFile,
        region: effectiveRegion,
        source: selectedSource,
        uploadMeta: {
          importBatch: importBatchResult,
          totalRecords,
          validRecords,
          discrepantRecords,
          batchResult,
          recordsPayload,
        },
      });

      onSuccess?.(result);
      
      // Reset form
      setSelectedFile(null);
      setSelectedRegion(region || '');
      setSelectedSource('');
    } catch (error) {
      onError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    // clear input and validation state when file is removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValidationPassed(false);
    setValidationErrors([]);
    setEventsSamePassed(false);
    setCapacityPassed(false);
    setParsedRowCount(0);
  };

  return (
    <div className="file-upload-container">
      {/* Region Selection: hidden for regional-scope users, enabled for national */}
      {!isRegionDisabled && (
        <div className="file-upload-field">
          <label className="file-upload-label">Region *</label>
          <select
            className="file-upload-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Select Region</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Data Source Selection */}
      <div className="file-upload-field">
        <label className="file-upload-label">Data Source *</label>
        <select
          className="file-upload-select"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="">Select Data Source</option>
          {DATA_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source Entity ID removed */}

      {/* File Drop Zone */}
      <div
        className={`file-upload-dropzone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {selectedFile ? (
          <div className="file-upload-preview">
            <div className="file-upload-file-info">
              <FileSpreadsheet size={40} color={colors.primary} />
              <div className="file-upload-file-details">
                <span className="file-upload-file-name">{selectedFile.name}</span>
                <span className="file-upload-file-size">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
            <button className="file-upload-remove-btn" onClick={removeFile}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="file-upload-placeholder">
            <Upload size={40} color={colors.primary} />
            <p className="file-upload-text">
              Drag & drop your Excel file here, or <span>browse</span>
            </p>
            <p className="file-upload-hint">Supports .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        className={`file-upload-btn ${isUploading ? 'uploading' : ''}`}
        onClick={handleUpload}
        disabled={
          !(selectedFile && selectedSource && (isRegionDisabled || selectedRegion) && validationPassed) || isUploading || isValidating
        }
      >
        {isUploading ? (
          <>
            <span className="file-upload-spinner" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload & Validate
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
