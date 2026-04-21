import React from 'react';
import { useAppContext } from '../store';

export const Toast: React.FC = () => {
  const { toastConfig } = useAppContext();

  const dotColors: Record<string, string> = {
    green: 'var(--green)',
    amber: 'var(--amber)',
    red: 'var(--red)',
    blue: 'var(--accent)'
  };

  const bgStyle = toastConfig ? dotColors[toastConfig.type] || dotColors.green : dotColors.green;

  return (
    <div className={`toast ${toastConfig?.visible ? 'show' : ''}`}>
      <div className="toast-inner">
        <div className="toast-dot" style={{ background: bgStyle, boxShadow: `0 0 6px ${bgStyle}` }}></div>
        <span>{toastConfig?.msg}</span>
      </div>
    </div>
  );
};
