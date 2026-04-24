import React, { useState } from 'react';
import { useAppContext } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Priority } from '../types/project';

export const CreateEpicModal: React.FC = () => {
  const { showToast, currentUser, projects, programs } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user has permission to create epics
  const canCreateEpic = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  const handleCreate = async () => {
    if (!canCreateEpic) {
      showToast('Only admins and project managers can create epics.', 'red');
      return;
    }

    if (!name.trim()) {
      showToast('Epic name is required.', 'red');
      return;
    }

    if (!selectedProjectId) {
      showToast('Please select a project.', 'red');
      return;
    }

    setIsLoading(true);
    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const selectedProgram = programs.find(p => p.id === selectedProject?.programId);

      if (!selectedProject) {
        showToast('Selected project not found.', 'red');
        return;
      }

      if (!selectedProgram) {
        showToast('Selected program not found.', 'red');
        return;
      }

      // Create epic document in Firestore
      const epicsCollection = collection(db, 'epics');
      const docRef = await addDoc(epicsCollection, {
        name: name.trim(),
        description: description.trim(),
        priority,
        order: 1, // Will be updated later when multiple epics exist
        columns: [], // Empty kanban columns initially
        sprintId: null, // Can span multiple sprints
        projectId: selectedProjectId,
        programId: selectedProgram.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`Epic "${name}" created in Firestore with ID: ${docRef.id}`);

      showToast(`Epic "${name}" created successfully!`, 'green');

      // Reset form
      setName('');
      setDescription('');
      setPriority('Medium');
      setSelectedProjectId('');
      document.getElementById('modal-create-epic')?.classList.remove('show');
    } catch (error: any) {
      console.error('Error creating epic:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to create epic: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="modal-bg" id="modal-create-epic">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Create New Epic</div>
          <div className="modal-close" onClick={() => document.getElementById('modal-create-epic')?.classList.remove('show')}>×</div>
        </div>
        <div className="modal-body">
          {!canCreateEpic && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can create epics. Please contact an admin.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Epic Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Employee Onboarding Module"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!canCreateEpic || isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Brief description of the epic and its scope..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canCreateEpic || isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority *</label>
            <select
              className="form-input form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              disabled={!canCreateEpic || isLoading}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className={`mt-2 p-2 rounded border text-sm ${getPriorityColor(priority)}`}>
              <strong>Priority: {priority}</strong> - This determines the epic's importance and urgency
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project *</label>
            <select
              className="form-input form-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={!canCreateEpic || isLoading}
            >
              <option value="">Select a project...</option>
              {projects.map(project => {
                const program = programs.find(p => p.id === project.programId);
                return (
                  <option key={project.id} value={project.id}>
                    {project.name} ({program?.name || 'Unknown Program'})
                  </option>
                );
              })}
            </select>
            {projects.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No projects available. Please create a project first.
              </div>
            )}
          </div>

          <div className="divider"></div>
        </div>
        <div className="modal-foot">
          <button
            className="btn"
            onClick={() => document.getElementById('modal-create-epic')?.classList.remove('show')}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isLoading || !canCreateEpic || !name.trim() || !selectedProjectId}
          >
            {isLoading ? 'Creating...' : 'Create Epic'}
          </button>
        </div>
      </div>
    </div>
  );
};
