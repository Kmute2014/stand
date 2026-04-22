import React, { useState } from 'react';
import { useAppContext } from '../store';
import { db, functions } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const AddUserModal: React.FC = () => {
  const { addUser, showToast, currentUser } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'User' | 'Admin'>('User');
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'Admin';

  const handleAdd = async () => {
    if (!isAdmin) {
      showToast('Only admins can add team members.', 'red');
      return;
    }

    if (!name || !email) {
      showToast('Please fill in all required fields.', 'red');
      return;
    }

    setIsLoading(true);
    try {
      // Generate initials and color
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const colors = ['av-blue', 'av-green', 'av-amber', 'av-teal', 'av-purple'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];

      // Create user document in Firestore
      const usersCollection = collection(db, 'users');
      const docRef = await addDoc(usersCollection, {
        name,
        email,
        role,
        initials,
        avatarColor,
        status: 'Pending',
        streak: 0,
        createdAt: serverTimestamp(),
      });

      console.log(`User ${name} created in Firestore with ID: ${docRef.id}`);

      // Also update local state so user appears immediately
      addUser({
        id: docRef.id,
        name,
        email,
        role,
        initials,
        avatarColor,
        status: 'Pending',
        streak: 0,
      });

      // Generate password reset link
      let resetLink = null;
      try {
        const generateResetLink = httpsCallable(functions, 'generatePasswordResetLink');
        const result = await generateResetLink({ email });
        resetLink = (result.data as any).resetLink;
        console.log('Password reset link generated for:', email);
      } catch (resetError: any) {
        console.error('Error generating password reset link:', resetError.message);
        showToast('Warning: Could not generate password reset link', 'amber');
      }

      // Send welcome email via Netlify function (only in production)
      if (import.meta.env.PROD) {
        try {
          const response = await fetch('/.netlify/functions/send-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              email,
              role,
              resetLink,
            }),
          });

          if (response.ok) {
            showToast(`${name} added successfully! Welcome email sent with password reset link.`, 'green');
          } else {
            try {
              const errorData = await response.json();
              console.error('Email API error:', errorData);
              const errorMsg = errorData.details || errorData.error || 'Unknown error';
              showToast(`${name} added! Email failed: ${errorMsg}`, 'amber');
            } catch (parseError) {
              console.error('Failed to parse error response');
              showToast(`${name} added! Email failed (check logs)`, 'amber');
            }
          }
        } catch (emailError: any) {
          console.error('Welcome email error:', emailError.message);
          showToast(`${name} added! Email failed: ${emailError.message}`, 'amber');
        }
      } else {
        // Local development - skip email
        showToast(`${name} added successfully! (Email disabled in dev)`, 'green');
        if (resetLink) {
          console.log('Password reset link (dev):', resetLink);
        }
      }

      setName('');
      setEmail('');
      setRole('User');
      document.getElementById('modal-add-user')?.classList.remove('show');
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to add user: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-bg" id="modal-add-user">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Add team member</div>
          <div className="modal-close" onClick={() => document.getElementById('modal-add-user')?.classList.remove('show')}>×</div>
        </div>
        <div className="modal-body">
          {!isAdmin && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins can add team members. Please contact an admin.
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input type="text" className="form-input" placeholder="e.g. Abena Mensah" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin || isLoading} />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="form-input" placeholder="abena@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={!isAdmin || isLoading} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={role} onChange={e => setRole(e.target.value as any)} disabled={!isAdmin || isLoading}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team</label>
              <input type="text" className="form-input" placeholder="e.g. Engineering" disabled={!isAdmin || isLoading} />
            </div>
          </div>
          <div className="divider"></div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => document.getElementById('modal-add-user')?.classList.remove('show')} disabled={isLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={isLoading || !isAdmin}>{isLoading ? 'Adding...' : 'Add member'}</button>
        </div>
      </div>
    </div>
  );
};
