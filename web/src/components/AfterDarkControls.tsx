/**
 * AfterDarkControls.tsx — TIER 1 & 2 UI
 * Shows night start time picker and After Dark toggle
 */

import React, { useState } from 'react';

interface AfterDarkControlsProps {
  nightStartsAt: 'early' | 'standard' | 'late';
  onNightStartChange: (time: 'early' | 'standard' | 'late') => void;
  isAfterDarkEnabled: boolean;
  onAfterDarkToggle: (enabled: boolean) => void;
  includeFamilyEvents: boolean;
  onFamilyToggle: (include: boolean) => void;
}

const NIGHT_LABELS = {
  early: '🌅 Early Evening (5 PM)',
  standard: '🌙 Standard (7 PM)',
  late: '🌛 Late Night (10 PM)',
};

export const AfterDarkControls: React.FC<AfterDarkControlsProps> = ({
  nightStartsAt,
  onNightStartChange,
  isAfterDarkEnabled,
  onAfterDarkToggle,
  includeFamilyEvents,
  onFamilyToggle,
}) => {
  return (
    <div className="after-dark-controls">
      <h3>🌙 After Dark Settings</h3>

      {/* Toggle After Dark */}
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={isAfterDarkEnabled}
            onChange={(e) => onAfterDarkToggle(e.target.checked)}
          />
          <span> Enable After Dark Mode</span>
        </label>
        <p className="help-text">Show evening-friendly activities and filter by time</p>
      </div>

      {/* Night Start Time Picker */}
      {isAfterDarkEnabled && (
        <div className="control-group">
          <label>When does night start for you?</label>
          <div className="night-time-options">
            {(['early', 'standard', 'late'] as const).map((time) => (
              <button
                key={time}
                className={`night-time-btn ${nightStartsAt === time ? 'active' : ''}`}
                onClick={() => onNightStartChange(time)}
              >
                {NIGHT_LABELS[time]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Family Events Toggle */}
      {isAfterDarkEnabled && (
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={includeFamilyEvents}
              onChange={(e) => onFamilyToggle(e.target.checked)}
            />
            <span> Include family-friendly activities</span>
          </label>
        </div>
      )}

      <style>{`
        .after-dark-controls {
          padding: 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          margin-bottom: 16px;
          color: #fff;
        }

        .after-dark-controls h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .control-group {
          margin-bottom: 16px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          font-size: 14px;
          margin-bottom: 8px;
          cursor: pointer;
        }

        .control-group input[type='checkbox'] {
          margin-right: 8px;
          cursor: pointer;
        }

        .help-text {
          font-size: 12px;
          color: #aaa;
          margin: 4px 0 0 0;
        }

        .night-time-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .night-time-btn {
          padding: 10px 12px;
          border: 2px solid #444;
          border-radius: 8px;
          background: #0a0e27;
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
          text-align: left;
        }

        .night-time-btn:hover {
          border-color: #ffd700;
          background: #1a1a2e;
        }

        .night-time-btn.active {
          border-color: #ffd700;
          background: #2a2a4e;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
        }
      `}</style>
    </div>
  );
};
