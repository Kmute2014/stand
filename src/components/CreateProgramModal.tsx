import React, { useState } from 'react';
import { useAppContext } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

export const CreateProgramModal: React.FC = () => {
  const { showToast, currentUser, users } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user has permission to create programs
  const canCreateProgram = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  const handleCreate = async () => {
    if (!canCreateProgram) {
      showToast('Only admins and project managers can create programs.', 'red');
      return;
    }

    if (!name.trim()) {
      showToast('Program name is required.', 'red');
      return;
    }

    if (!selectedOwnerId) {
      showToast('Program owner is required.', 'red');
      return;
    }

    setIsLoading(true);
    try {
      const selectedOwner = users.find(u => u.id === selectedOwnerId);
      if (!selectedOwner) {
        showToast('Selected owner not found.', 'red');
        return;
      }

      // Create program document in Firestore
      const programsCollection = collection(db, 'programs');
      const docRef = await addDoc(programsCollection, {
        name: name.trim(),
        description: description.trim(),
        owner: {
          id: selectedOwner.id,
          name: selectedOwner.name,
          email: selectedOwner.email,
          role: selectedOwner.role,
        },
        projects: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`Program "${name}" created in Firestore with ID: ${docRef.id}`);
      showToast(`Program "${name}" created successfully!`, 'green');

      // Reset form
      setName('');
      setDescription('');
      setSelectedOwnerId('');
      document.getElementById('modal-create-program')?.classList.remove('show');
    } catch (error: any) {
      console.error('Error creating program:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to create program: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  const availableOwners = users.filter(user => 
    user.role === 'Admin' || user.role === 'Project Manager/Scrum Master'
  );

  return (
    <div className="modal-bg" id="modal-create-program">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Create New Program</div>
          <div className="modal-close" onClick={() => document.getElementById('modal-create-program')?.classList.remove('show')}>×</div>
        </div>
        <div className="modal-body">
          {!canCreateProgram && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can create programs. Please contact an admin.
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Program Name *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. WorkPhelo ERP" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={!canCreateProgram || isLoading} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              placeholder="Brief description of the program..."
              rows={3}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              disabled={!canCreateProgram || isLoading} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Program Owner *</label>
            <select 
              className="form-input form-select" 
              value={selectedOwnerId} 
              onChange={e => setSelectedOwnerId(e.target.value)} 
              disabled={!canCreateProgram || isLoading}
            >
              <option value="">Select a program owner...</option>
              {availableOwners.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            {availableOwners.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No eligible owners found. Only Admins and Project Managers can own programs.
              </div>
            )}
          </div>

          <div className="divider"></div>
        </div>
        <div className="modal-foot">
          <button 
            className="btn" 
            onClick={() => document.getElementById('modal-create-program')?.classList.remove('show')} 
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate} 
            disabled={isLoading || !canCreateProgram || !name.trim() || !selectedOwnerId}
          >
            {isLoading ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
};
