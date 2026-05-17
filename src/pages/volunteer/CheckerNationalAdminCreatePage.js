import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import { EVENTS } from '../../constants/volunteerConstants';
import { tokenService } from '../../services/tokenService';
import volunteerApiService from '../../services/volunteerApi';
import './CheckerNationalAdminCreatePage.css';

const emptyRow = () => ({
  cnic: '',
  name: '',
  eventName: '',
  dutyType: '',
  accessLevel: '',
});

const isNationalAdminScope = () =>
  String(tokenService.getUserScope() || '').trim().toLowerCase() === 'national admin';

const CheckerNationalAdminCreatePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [rows, setRows] = useState([emptyRow()]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const canUsePage = useMemo(() => isNationalAdminScope(), []);

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );

    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${index}.${field}`];
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const validate = () => {
    const nextErrors = {};

    rows.forEach((row, index) => {
      ['cnic', 'name', 'eventName', 'dutyType', 'accessLevel'].forEach((field) => {
        if (!String(row[field] || '').trim()) {
          nextErrors[`${index}.${field}`] = 'Required';
        }
      });
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildApiPayload = () => {
    const userId = tokenService.getUserId();

    return rows.map((row, index) => ({
      volunteerRecordId: null,
      makerId: userId,
      reason: 'Direct Ok by National Admin',
      recordNumber: index + 1,
      cnic: String(row.cnic || '').trim(),
      name: String(row.name || '').trim(),
      event: String(row.eventName || '').trim(),
      accessLevel: String(row.accessLevel || '').trim(),
      dutyType: String(row.dutyType || '').trim(),
      recordStatus: 'checker',
      register: 'Yes',
      checkerId: userId,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!canUsePage) {
      setErrors({ page: 'This page is only available to National Admin users.' });
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await volunteerApiService.insertOkMakerDecisions(buildApiPayload());
      navigate('/checker');
    } catch (error) {
      setErrors({
        page: error.message || 'Failed to create print records.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!canUsePage) {
    return (
      <div className="national-admin-create-page">
        <Header
          title="Create Print Records"
          subtitle="National Admin"
          onLogout={handleLogout}
        />
        <div className="national-admin-create-content">
          <button
            type="button"
            className="national-admin-back-btn"
            onClick={() => navigate('/checker')}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <div className="national-admin-empty-state" role="alert">
            This page is only available to National Admin users.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="national-admin-create-page">
      <Header
        title="Create Print Records"
        subtitle="National Admin"
        onLogout={handleLogout}
      />

      <main className="national-admin-create-content">
        <div className="national-admin-top-actions">
          <button
            type="button"
            className="national-admin-back-btn"
            onClick={() => navigate('/checker')}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="national-admin-form">
          <div className="national-admin-form-header">
            <h2>Ready for Print Entry</h2>
            <button
              type="button"
              className="national-admin-add-btn"
              onClick={addRow}
              disabled={submitting}
              title="Add row"
            >
              <Plus size={18} />
              Add Row
            </button>
          </div>

          {errors.page && (
            <p className="national-admin-error-message" role="alert">
              {errors.page}
            </p>
          )}

          <div className="national-admin-table" role="table">
            <div className="national-admin-table-head" role="row">
              <div role="columnheader">CNIC</div>
              <div role="columnheader">Name</div>
              <div role="columnheader">Event Name</div>
              <div role="columnheader">Access Level</div>
              <div role="columnheader">Duty Type</div>
              <div role="columnheader" aria-label="Actions" />
            </div>

            {rows.map((row, index) => (
                <div className="national-admin-table-row" role="row" key={index}>
                  <div role="cell">
                    <input
                      type="text"
                      value={row.cnic}
                      onChange={(e) => updateRow(index, 'cnic', e.target.value)}
                      className={errors[`${index}.cnic`] ? 'field-error' : ''}
                      disabled={submitting}
                      placeholder="CNIC"
                    />
                    {submitted && errors[`${index}.cnic`] && (
                      <span className="national-admin-field-error">Required</span>
                    )}
                  </div>

                  <div role="cell">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      className={errors[`${index}.name`] ? 'field-error' : ''}
                      disabled={submitting}
                      placeholder="Name"
                    />
                    {submitted && errors[`${index}.name`] && (
                      <span className="national-admin-field-error">Required</span>
                    )}
                  </div>

                  <div role="cell">
                    <select
                      value={row.eventName}
                      onChange={(e) => updateRow(index, 'eventName', e.target.value)}
                      className={errors[`${index}.eventName`] ? 'field-error' : ''}
                      disabled={submitting}
                    >
                      <option value="">Select event</option>
                      {EVENTS.map((eventOption) => (
                        <option key={eventOption.id} value={eventOption.name}>
                          {eventOption.name}
                        </option>
                      ))}
                    </select>
                    {submitted && errors[`${index}.eventName`] && (
                      <span className="national-admin-field-error">Required</span>
                    )}
                  </div>

                  <div role="cell">
                    <input
                      type="text"
                      value={row.accessLevel}
                      onChange={(e) => updateRow(index, 'accessLevel', e.target.value)}
                      className={errors[`${index}.accessLevel`] ? 'field-error' : ''}
                      disabled={submitting}
                      placeholder="Access Level"
                    />
                    {submitted && errors[`${index}.accessLevel`] && (
                      <span className="national-admin-field-error">Required</span>
                    )}
                  </div>

                  <div role="cell">
                    <input
                      type="text"
                      value={row.dutyType}
                      onChange={(e) => updateRow(index, 'dutyType', e.target.value)}
                      className={errors[`${index}.dutyType`] ? 'field-error' : ''}
                      disabled={submitting}
                      placeholder="Duty Type"
                    />
                    {submitted && errors[`${index}.dutyType`] && (
                      <span className="national-admin-field-error">Required</span>
                    )}
                  </div>

                  <div className="national-admin-row-actions" role="cell">
                    <button
                      type="button"
                      className="national-admin-icon-btn"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1 || submitting}
                      title="Remove row"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
            ))}
          </div>

          <div className="national-admin-submit-row">
            <button type="submit" className="national-admin-submit-btn" disabled={submitting}>
              <Check size={18} />
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckerNationalAdminCreatePage;
