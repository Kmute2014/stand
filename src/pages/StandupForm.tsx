import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Check } from 'lucide-react';

export const StandupForm: React.FC = () => {
  const { submitStandup, currentUser } = useAppContext();
  
  const [complete, setComplete] = useState('');
  const [plan, setPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [score, setScore] = useState(4);

  const emojis = ['😩', '😕', '😐', '😊', '😄'];

  const handleSubmit = () => {
    if (!complete || !plan || !blockers) {
      alert("Please fill all fields.");
      return;
    }

    submitStandup({
      userId: currentUser?.id || '5',
      date: 'Apr 20',
      yesterday: complete,
      today: plan,
      blockers,
      mood: { emoji, score }
    });

    setComplete('');
    setPlan('');
    setBlockers('');
  };

  const filledCount = [complete, plan, blockers].filter(field => field.trim().length > 0).length + 1; // +1 for mood
  const progressPercentage = (filledCount / 4) * 100;

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Daily standup</div>
            <div className="ph-sub">// Mon Apr 20, 2026 · share your update with the team</div>
          </div>
          <div className="w-64">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>PROGRESS</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[620px]">
        
        {/* Q1 */}
        <div className="bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-3.5 transition-colors focus-within:border-[var(--accent-border)]">
          <div className="font-mono text-[10px] text-[var(--text-3)] mb-1.5 tracking-wider uppercase">01 / Previous workday</div>
          <div className="text-[14px] font-medium text-[var(--text-1)] mb-3 leading-snug">What did you complete in your previous workday?</div>
          <textarea 
            className="form-input form-textarea" 
            placeholder="Share what you accomplished yesterday..." 
            value={complete} onChange={e => setComplete(e.target.value)}
          />
        </div>

        {/* Q2 */}
        <div className="bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-3.5 transition-colors focus-within:border-[var(--accent-border)]">
          <div className="font-mono text-[10px] text-[var(--text-3)] mb-1.5 tracking-wider uppercase">02 / Today's plan</div>
          <div className="text-[14px] font-medium text-[var(--text-1)] mb-3 leading-snug">What are you planning to work on today?</div>
          <textarea 
            className="form-input form-textarea" 
            placeholder="What's on your plate today?"
            value={plan} onChange={e => setPlan(e.target.value)}
          />
        </div>

        {/* Q3 */}
        <div className="bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-3.5 transition-colors focus-within:border-[var(--accent-border)]">
          <div className="font-mono text-[10px] text-[var(--text-3)] mb-1.5 tracking-wider uppercase">03 / Blockers</div>
          <div className="text-[14px] font-medium text-[var(--text-1)] mb-3 leading-snug">Great. Do you have any blockers? If so, just tell me. Otherwise please say: <span className="font-mono text-[var(--accent)] tracking-tighter">"no"</span></div>
          <textarea 
            className="form-input form-textarea" 
            placeholder='Describe your blocker, or type "no" if clear...'
            value={blockers} onChange={e => setBlockers(e.target.value)}
          />
          <div className="text-[11px] text-[var(--text-3)] mt-2">⚡ If you have a blocker, the admin will be notified automatically by email.</div>
        </div>

        {/* Q4 */}
        <div className="bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-3.5 transition-colors">
          <div className="font-mono text-[10px] text-[var(--text-3)] mb-1.5 tracking-wider uppercase">04 / Mood check</div>
          <div className="text-[14px] font-medium text-[var(--text-1)] mb-3 leading-snug">How are you feeling today?</div>
          
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

        <div className="flex items-center justify-between mt-2 pt-2">
          <button className="btn">Save draft</button>
          <div className="flex gap-2">
            <button className="btn">Preview</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <Check className="w-3.5 h-3.5" />
              Submit standup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
