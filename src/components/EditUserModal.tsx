import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';

export const EditUserModal: React.FC = () => {
  const { editingUser, setEditingUser, updateUser, currentUser, showToast } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'User' | 'Admin'>('User');
  const [status, setStatus] = useState<'Active' | 'Pending'>('Active');

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'Admin';

  // Sync state when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setRole(editingUser.role as any);
      setStatus(editingUser.status);
    }
  }, [editingUser]);

  if (!editingUser) return null;

  if (!isAdmin) {
    return (
      <div className="modal-bg show">
        <div className="modal">
          <div className="modal-h">
            <div className="modal-title">Edit team member</div>
            <div className="modal-close" onClick={() => setEditingUser(null)}>×</div>
          </div>
          <div className="modal-body">
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins can edit team members. Please contact an admin.
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn" onClick={() => setEditingUser(null)}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdate = () => {
    if (!name || !email) {
      showToast('Please fill in all required fields.', 'red');
      return;
    }

    updateUser(editingUser.id, {
      name,
      email,
      role,
      status
    });

    setEditingUser(null);
  };

  const handleClose = () => {
    setEditingUser(null);
  };

  return (
    <div className="modal-bg show">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Edit team member</div>
          <div className="modal-close" onClick={handleClose}>×</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input type="text" className="form-input" placeholder="e.g. Abena Mensah" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="form-input" placeholder="abena@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={role} onChange={e => setRole(e.target.value as any)}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-input form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save changes</button>
        </div>
      </div>
    </div>
  );
};
