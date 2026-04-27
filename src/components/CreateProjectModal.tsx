import React, { useState } from 'react';
import { useAppContext } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

export const CreateProjectModal: React.FC = () => {
  const { showToast, currentUser, users, programs } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user has permission to create projects
  const canCreateProject = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  const handleCreate = async () => {
    if (!canCreateProject) {
      showToast('Only admins and project managers can create projects.', 'red');
      return;
    }

    if (!name.trim()) {
      showToast('Project name is required.', 'red');
      return;
    }

    if (!startDate || !endDate) {
      showToast('Start and end dates are required.', 'red');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast('End date must be after start date.', 'red');
      return;
    }

    if (!selectedOwnerId) {
      showToast('Project owner is required.', 'red');
      return;
    }

    if (!selectedProgramId) {
      showToast('Please select a program.', 'red');
      return;
    }

    setIsLoading(true);
    try {
      const selectedOwner = validUsers.find(u => u.id === selectedOwnerId);
      const selectedProgram = validPrograms.find(p => p.id === selectedProgramId);

      if (!selectedOwner) {
        showToast('Selected owner not found.', 'red');
        return;
      }

      if (!selectedProgram) {
        showToast('Selected program not found.', 'red');
        return;
      }

      const teamMemberUsers = validUsers.filter(u => selectedTeamMembers.includes(u.id));

      // Create project document in Firestore
      const projectsCollection = collection(db, 'projects');
      const docRef = await addDoc(projectsCollection, {
        name: name.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'Product Backlog',
        owner: {
          id: selectedOwner.id,
          name: selectedOwner.name,
          email: selectedOwner.email,
          role: selectedOwner.role,
        },
        teamMembers: teamMemberUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
        })),
        programId: selectedProgramId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`Project "${name}" created in Firestore with ID: ${docRef.id}`);

      // Create default Product Backlog for the project
      const backlogCollection = collection(db, 'productBacklogs');
      await addDoc(backlogCollection, {
        projectId: docRef.id,
        name: 'Product Backlog',
        description: `Default product backlog for ${name}`,
        items: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create default project statuses
      const statusesCollection = collection(db, 'projectStatuses');
      const defaultStatuses = [
        { name: 'Backlog', order: 1, color: '#6B7280' },
        { name: 'Ready', order: 2, color: '#3B82F6' },
        { name: 'In Progress', order: 3, color: '#F59E0B' },
        { name: 'Done', order: 4, color: '#10B981' },
      ];

      for (const status of defaultStatuses) {
        await addDoc(statusesCollection, {
          projectId: docRef.id,
          ...status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showToast(`Project "${name}" created successfully with default backlog and statuses!`, 'green');

      // Reset form
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setSelectedOwnerId('');
      setSelectedTeamMembers([]);
      setSelectedProgramId('');
      document.getElementById('modal-create-project')?.classList.remove('show');
    } catch (error: any) {
      console.error('Error creating project:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to create project: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  // Add error boundary check for users data
  const validUsers = users.filter(user =>
    user && user.id && user.name && user.role
  );

  const availableOwners = validUsers.filter(user =>
    user.role === 'Admin' || user.role === 'Project Manager/Scrum Master'
  );

  // Add error boundary check for programs data
  const validPrograms = programs.filter(program =>
    program && program.id && program.name && program.owner
  );

  const handleTeamMemberToggle = (userId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Early return if essential data is not available
  if (!currentUser || !users || !programs) {
    return (
      <div className="modal-bg" id="modal-create-project">
        <div className="modal">
          <div className="modal-h">
            <div className="modal-title">Create New Project</div>
            <div className="modal-close" onClick={() => document.getElementById('modal-create-project')?.classList.remove('show')}>×</div>
          </div>
          <div className="modal-body">
            <div className="text-center py-8">
              <div className="text-amber-600">Loading data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-bg" id="modal-create-project">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Create New Project</div>
          <div className="modal-close" onClick={() => document.getElementById('modal-create-project')?.classList.remove('show')}>×</div>
        </div>
        <div className="modal-body">
          {!canCreateProject && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can create projects. Please contact an admin.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. HR Phelo"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canCreateProject || isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Brief description of the project..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canCreateProject || isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={!canCreateProject || isLoading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={!canCreateProject || isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Program *</label>
            <select
              className="form-input form-select"
              value={selectedProgramId}
              onChange={e => setSelectedProgramId(e.target.value)}
              disabled={!canCreateProject || isLoading}
            >
              <option value="">Select a program...</option>
              {validPrograms.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name} (Owner: {program.owner?.name || 'Unknown'})
                </option>
              ))}
            </select>
            {validPrograms.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No programs available. Please create a program first.
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Project Owner *</label>
            <select
              className="form-input form-select"
              value={selectedOwnerId}
              onChange={e => setSelectedOwnerId(e.target.value)}
              disabled={!canCreateProject || isLoading}
            >
              <option value="">Select a project owner...</option>
              {availableOwners.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            {availableOwners.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No eligible owners found. Only Admins and Project Managers can own projects.
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Team Members</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {validUsers.map(user => (
                <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeamMembers.includes(user.id)}
                    onChange={() => handleTeamMemberToggle(user.id)}
                    disabled={!canCreateProject || isLoading}
                    className="form-checkbox"
                  />
                  <span className="text-sm">
                    {user.name} ({user.role})
                  </span>
                </label>
              ))}
            </div>
            {validUsers.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No users available for team assignment.
              </div>
            )}
          </div>

          <div className="divider"></div>
        </div>
        <div className="modal-foot">
          <button
            className="btn"
            onClick={() => document.getElementById('modal-create-project')?.classList.remove('show')}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isLoading || !canCreateProject || !name.trim() || !startDate || !endDate || !selectedOwnerId || !selectedProgramId}
          >
            {isLoading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
