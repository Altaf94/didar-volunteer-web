import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../apiBaseUrl';
import './Admin.css';

const ADMIN_PIN = '1207';

const emptyForm = {
  email: '',
  password: '',
  full_name: '',
  role_id: '2',
  scope: '',
  region_id: '',
  is_active: true,
};

const emptyEditForm = {
  id: null,
  email: '',
  full_name: '',
  role_id: '2',
  scope: '',
  region_id: '',
  is_active: true,
};

const Admin = () => {
  const [pin, setPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(
    sessionStorage.getItem('admin_pin_unlocked') === 'true'
  );
  const [pinError, setPinError] = useState('');

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [editModal, setEditModal] = useState({
    open: false,
    form: emptyEditForm,
  });

  const [passwordModal, setPasswordModal] = useState({
    open: false,
    user: null,
    newPassword: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });

    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 6000);
  };

  const readError = async (response) => {
    try {
      const data = await response.json();

      if (data?.errors && Array.isArray(data.errors)) {
        const first = data.errors[0];

        if (first?.loc?.includes('email')) {
          return 'Please enter a valid email address, e.g. test@example.com';
        }

        return first?.msg || 'Request validation failed';
      }

      return (
        data?.message ||
        data?.detail?.message ||
        data?.detail ||
        `Request failed with status ${response.status}`
      );
    } catch {
      return `Request failed with status ${response.status}`;
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();

    if (pin.trim() === ADMIN_PIN) {
      sessionStorage.setItem('admin_pin_unlocked', 'true');
      setPinUnlocked(true);
      setPinError('');
      return;
    }

    setPinError('Invalid PIN');
  };

  const lockAdmin = () => {
    sessionStorage.removeItem('admin_pin_unlocked');
    setPinUnlocked(false);
    setPin('');
    setUsers([]);
  };

  const fetchUsers = async () => {
    setTableLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();

      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      showAlert('error', error.message || 'Failed to load users.');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (pinUnlocked) {
      fetchUsers();
    }
  }, [pinUnlocked]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password.trim();
    const cleanName = form.full_name.trim();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      showAlert('error', 'Email, full name and password are required.');
      return;
    }

    if (cleanPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: cleanEmail,
        password: cleanPassword,
        full_name: cleanName,
        role_id: Number(form.role_id),
        scope: form.scope.trim() || null,
        region_id: form.region_id ? Number(form.region_id) : null,
        is_active: Boolean(form.is_active),
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      showAlert('success', 'User added successfully.');
      resetForm();
      fetchUsers();
    } catch (error) {
      showAlert('error', error.message || 'Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  const parseBulkUsers = () => {
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const usersPayload = [];

    for (let i = 0; i < lines.length; i += 1) {
      const parts = lines[i].split(',').map((part) => part.trim());

      if (parts.length < 4) {
        throw new Error(
          `Row ${i + 1} invalid. Format: email,full_name,password,role_id,scope,region_id,is_active`
        );
      }

      usersPayload.push({
        email: parts[0],
        full_name: parts[1],
        password: parts[2],
        role_id: Number(parts[3]),
        scope: parts[4] || null,
        region_id: parts[5] ? Number(parts[5]) : null,
        is_active:
          parts[6] === undefined || parts[6] === ''
            ? true
            : String(parts[6]).toLowerCase() === 'true',
      });
    }

    return usersPayload;
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();

    setBulkResult(null);

    let usersPayload = [];

    try {
      usersPayload = parseBulkUsers();
    } catch (error) {
      showAlert('error', error.message);
      return;
    }

    if (usersPayload.length === 0) {
      showAlert('error', 'Please paste at least one user row.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          users: usersPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();

      setBulkResult(data);
      showAlert('success', data?.message || 'Bulk users added successfully.');
      setBulkText('');
      fetchUsers();
    } catch (error) {
      showAlert('error', error.message || 'Failed to bulk add users.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditModal({
      open: true,
      form: {
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || '',
        role_id: String(user.role_id || '2'),
        scope: user.scope || '',
        region_id: user.region_id || '',
        is_active: Boolean(user.is_active),
      },
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      form: emptyEditForm,
    });
  };

  const handleEditChange = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const editForm = editModal.form;

    if (!editForm.id) {
      return;
    }

    const cleanEmail = editForm.email.trim().toLowerCase();
    const cleanName = editForm.full_name.trim();

    if (!cleanEmail || !cleanName) {
      showAlert('error', 'Email and full name are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: cleanEmail,
        full_name: cleanName,
        role_id: Number(editForm.role_id),
        scope: editForm.scope.trim() || null,
        region_id: editForm.region_id ? Number(editForm.region_id) : null,
        is_active: Boolean(editForm.is_active),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${editForm.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      showAlert('success', 'User updated successfully.');
      closeEditModal();
      fetchUsers();
    } catch (error) {
      showAlert('error', error.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user.email}?`
    );

    if (!confirmDelete) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      showAlert('success', 'User deleted successfully.');
      fetchUsers();
    } catch (error) {
      showAlert('error', error.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setPasswordModal({
      open: true,
      user,
      newPassword: '',
    });
  };

  const closePasswordModal = () => {
    setPasswordModal({
      open: false,
      user: null,
      newPassword: '',
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordModal.user) {
      return;
    }

    const newPassword = passwordModal.newPassword.trim();

    if (!newPassword) {
      showAlert('error', 'New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${passwordModal.user.id}/password`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            new_password: newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      showAlert('success', 'Password changed successfully.');
      closePasswordModal();
    } catch (error) {
      showAlert('error', error.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    const role = Number(roleId);

    if (role === 1) return 'Admin';
    if (role === 2) return 'National Maker';
    if (role === 3) return 'National Checker';
    if (role === 5) return 'Regional Maker';
    if (role === 6) return 'Regional Checker';

    return `Role ${roleId}`;
  };

  if (!pinUnlocked) {
    return (
      <div className="admin-pin-page">
        <div className="admin-pin-card">
          <div className="admin-pin-logo">
            <img src="/ismaililogo.png" alt="Logo" />
          </div>

          <h1>Admin Access</h1>
          <p>Enter admin PIN to continue</p>

          {pinError && <div className="admin-alert error">{pinError}</div>}

          <form onSubmit={handlePinSubmit}>
            <div className="admin-field">
              <label>PIN</label>
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            <button type="submit" className="admin-pin-btn">
              Unlock Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <img src="/ismaililogo.png" alt="Logo" className="admin-logo" />

            <div>
              <h1>Admin Panel</h1>
              <p>Manage users, passwords and access</p>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={fetchUsers}
              disabled={tableLoading}
            >
              {tableLoading ? 'Refreshing...' : 'Refresh'}
            </button>

            <button type="button" className="admin-lock-btn" onClick={lockAdmin}>
              Lock
            </button>
          </div>
        </div>

        {alert.message && (
          <div className={`admin-alert ${alert.type}`}>{alert.message}</div>
        )}

        <div className="admin-card">
          <h2>Add New User</h2>

          <form className="admin-form" onSubmit={handleAddUser}>
            <div className="admin-grid">
              <div className="admin-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Password</label>
                <input
                  type="text"
                  placeholder="Initial password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Role</label>
                <select
                  value={form.role_id}
                  onChange={(e) => handleChange('role_id', e.target.value)}
                >
                  <option value="1">Admin</option>
                  <option value="2">National Maker</option>
                  <option value="3">National Checker</option>
                  <option value="5">Regional Maker</option>
                  <option value="6">Regional Checker</option>
                </select>
              </div>

              <div className="admin-field">
                <label>Scope</label>
                <input
                  type="text"
                  placeholder="national / regional"
                  value={form.scope}
                  onChange={(e) => handleChange('scope', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Region ID</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={form.region_id}
                  onChange={(e) => handleChange('region_id', e.target.value)}
                />
              </div>
            </div>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
              <span>Active user</span>
            </label>

            <div className="admin-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add User'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h2>Bulk Add Users</h2>

          <p className="bulk-help">
            Paste one user per line:
            <br />
            <strong>email,full_name,password,role_id,scope,region_id,is_active</strong>
          </p>

          <form onSubmit={handleBulkAdd}>
            <textarea
              className="bulk-textarea"
              placeholder={`test1@example.com,Test One,TEST123456,2,national,1,true\ntest2@example.com,Test Two,TEST123456,3,national,1,true`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />

            <div className="admin-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Bulk Add Users'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setBulkText('');
                  setBulkResult(null);
                }}
                disabled={loading}
              >
                Clear Bulk
              </button>
            </div>
          </form>

          {bulkResult && (
            <div className="bulk-result">
              <p>{bulkResult.message}</p>

              {bulkResult.skipped?.length > 0 && (
                <div>
                  <strong>Skipped:</strong>
                  <pre>{JSON.stringify(bulkResult.skipped, null, 2)}</pre>
                </div>
              )}

              {bulkResult.errors?.length > 0 && (
                <div>
                  <strong>Errors:</strong>
                  <pre>{JSON.stringify(bulkResult.errors, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h2>Users</h2>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan="9" className="admin-empty">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="admin-empty">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.full_name}</td>
                      <td>{getRoleName(user.role_id)}</td>
                      <td>{user.scope || '-'}</td>
                      <td>{user.region_id || '-'}</td>
                      <td>
                        <span
                          className={
                            user.is_active
                              ? 'admin-badge active'
                              : 'admin-badge inactive'
                          }
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString()
                          : '-'}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="small edit"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="small"
                            onClick={() => openPasswordModal(user)}
                          >
                            Password
                          </button>

                          <button
                            type="button"
                            className="small danger"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Edit User</h2>

            <form onSubmit={handleUpdateUser}>
              <div className="admin-field">
                <label>Email</label>
                <input
                  type="email"
                  value={editModal.form.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editModal.form.full_name}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Role</label>
                <select
                  value={editModal.form.role_id}
                  onChange={(e) => handleEditChange('role_id', e.target.value)}
                >
                  <option value="1">Admin</option>
                  <option value="2">Maker</option>
                  <option value="3">Checker</option>
                  <option value="5">Maker</option>
                  <option value="6">Checker</option>
                </select>
              </div>

              <div className="admin-field">
                <label>Scope</label>
                <input
                  type="text"
                  value={editModal.form.scope}
                  onChange={(e) => handleEditChange('scope', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Region ID</label>
                <input
                  type="number"
                  value={editModal.form.region_id}
                  onChange={(e) => handleEditChange('region_id', e.target.value)}
                />
              </div>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={editModal.form.is_active}
                  onChange={(e) =>
                    handleEditChange('is_active', e.target.checked)
                  }
                />
                <span>Active user</span>
              </label>

              <div className="admin-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update User'}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Change Password</h2>

            <p>
              User: <strong>{passwordModal.user?.email}</strong>
            </p>

            <form onSubmit={handlePasswordChange}>
              <div className="admin-field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordModal.newPassword}
                  onChange={(e) =>
                    setPasswordModal((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="admin-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={closePasswordModal}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;