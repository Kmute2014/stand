import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';

export const EditResponseModal: React.FC = () => {
  const { editingResponse, setEditingResponse, updateResponse } = useAppContext();
  
  const [complete, setComplete] = useState('');
  const [plan, setPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [score, setScore] = useState(4);

  const emojis = ['😩', '😕', '😐', '😊', '😄'];

  // Sync state when editingResponse changes
  useEffect(() => {
    if (editingResponse) {
      setComplete(editingResponse.yesterday);
      setPlan(editingResponse.today);
      setBlockers(editingResponse.blockers);
      setEmoji(editingResponse.mood.emoji);
      setScore(editingResponse.mood.score);
    }
  }, [editingResponse]);

  if (!editingResponse) return null;

  const handleUpdate = () => {
    if (!complete || !plan || !blockers) {
      alert("Please fill all fields.");
      return;
    }
    
    updateResponse(editingResponse.id, {
      yesterday: complete,
      today: plan,
      blockers,
      mood: { emoji, score }
    });
    
    setEditingResponse(null);
  };

  const handleClose = () => {
    setEditingResponse(null);
  };

  return (
    <div className="modal-bg show">
      <div className="modal" style={{ width: '600px' }}>
        <div className="modal-h">
          <div className="modal-title">Edit Standup Response</div>
          <div className="modal-close" onClick={handleClose}>×</div>
        </div>
        <div className="modal-body">
          
          <div className="form-group">
            <label className="form-label text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-2">Previous workday</label>
            <textarea 
              className="form-input form-textarea" 
              placeholder="Share what you accomplished yesterday..." 
              value={complete} onChange={e => setComplete(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-2">Today's plan</label>
            <textarea 
              className="form-input form-textarea" 
              placeholder="What's on your plate today?"
              value={plan} onChange={e => setPlan(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-2">Blockers</label>
            <textarea 
              className="form-input form-textarea" 
              placeholder='Describe your blocker, or type "no" if clear...'
              value={blockers} onChange={e => setBlockers(e.target.value)}
            />
          </div>

          <div className="form-group mb-0">
            <label className="form-label text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-2">Mood check</label>
            <div className="flex flex-wrap gap-6 mt-1">
              <div>
                <div className="form-label text-[11px] mb-1.5 font-medium text-[var(--text-2)]">Emoji</div>
                <div className="flex gap-1.5">
                  {emojis.map((em, i) => (
                    <div 
                      key={em} 
                      className={`w-[42px] h-[42px] rounded-[var(--radius)] border text-[20px] flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${emoji === em ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] scale-110' : 'border-[var(--border-2)] bg-[var(--bg-4)] hover:bg-[var(--bg-5)] hover:border-[var(--border-2)]'}`}
                      onClick={() => { setEmoji(em); setScore(i + 1); }}
                    >
                      {em}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="form-label text-[11px] mb-1.5 font-medium text-[var(--text-2)]">Score</div>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(sc => (
                    <div 
                      key={sc} 
                      className={`w-[38px] h-[38px] rounded-[var(--radius)] border font-mono text-[14px] font-medium flex items-center justify-center cursor-pointer transition-all ${score === sc ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]' : 'border-[var(--border-2)] bg-[var(--bg-4)] text-[var(--text-2)] hover:bg-[var(--bg-5)] hover:text-[var(--text-1)]'}`}
                      onClick={() => { setScore(sc); setEmoji(emojis[sc-1]); }}
                    >
                      {sc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Update response</button>
        </div>
      </div>
    </div>
  );
};
