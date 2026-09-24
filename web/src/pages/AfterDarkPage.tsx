/**
 * AfterDarkPage.tsx — TIER 1, 2, 3 Integration
 * Full After Dark experience page
 */

import React, { useState, useEffect } from 'react';
import { AfterDarkControls } from '../components/AfterDarkControls';
import { EventCardEnhanced } from '../components/EventCardEnhanced';

interface AfterDarkPageProps {
  lat: number;
  lng: number;
  onClose?: () => void;
}

export const AfterDarkPage: React.FC<AfterDarkPageProps> = ({ lat, lng, onClose }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [nightStartsAt, setNightStartsAt] = useState<'early' | 'standard' | 'late'>('standard');
  const [includeFamilyEvents, setIncludeFamilyEvents] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load events when After Dark is enabled
  useEffect(() => {
    if (!isEnabled) {
      setEvents([]);
      return;
    }

    const loadAfterDarkEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/after-dark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            nightStartsAt,
            includeFamilyEvents,
            radius: 60, // Default 60 mile radius
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Sort by relevance score (romantic-boosted)
          const sorted = data.sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          setEvents(sorted);
        }
      } catch (error) {
        console.error('Failed to load After Dark events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAfterDarkEvents();
  }, [isEnabled, nightStartsAt, includeFamilyEvents, lat, lng]);

  // Load analytics stats (TIER 3)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/after-dark/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    if (isEnabled) {
      loadStats();
    }
  }, [isEnabled]);

  return (
    <div className="after-dark-page">
      <div className="page-header">
        <h1>💕 Plan a Spontaneous Date</h1>
        <p>Find what's happening tonight — just for the two of you</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <AfterDarkControls
        nightStartsAt={nightStartsAt}
        onNightStartChange={setNightStartsAt}
        isAfterDarkEnabled={isEnabled}
        onAfterDarkToggle={setIsEnabled}
        includeFamilyEvents={includeFamilyEvents}
        onFamilyToggle={setIncludeFamilyEvents}
      />

      {/* TIER 3: Stats and trending — romantic focus */}
      {isEnabled && stats && (
        <div className="after-dark-stats">
          <h3>💃 Trending for Couples Tonight</h3>
          <div className="trending-tags">
            {stats.trendingNow?.map((tag: string) => (
              <span key={tag} className="trending-tag">
                {tag}
              </span>
            ))}
          </div>
          <p className="peak-hours">Peak hours: {stats.peakHours?.join(', ')}</p>
        </div>
      )}

      {/* Events Grid — sorted by romantic relevance */}
      {isEnabled && (
        <div className="events-section">
          <h2>
            {loading ? '⏳ Finding your perfect night...' : `✨ ${events.length} Perfect Moments Tonight`}
          </h2>

          {events.length === 0 && !loading && (
            <div className="empty-state">
              <p>💭 Nothing found yet. Try expanding the time window or distance radius.</p>
            </div>
          )}

          <div className="events-grid">
            {events.map((event) => (
              <EventCardEnhanced
                key={event.id}
                event={event}
                onSelect={(e) => {
                  console.log('Selected event for proposal:', e);
                  // TODO: Navigate to proposal builder with this event pre-selected
                  // This should open the "Plan this" flow from the product review
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!isEnabled && (
        <div className="welcome-message">
          <h2>🌹 The perfect night is waiting</h2>
          <p>Discover romantic activities happening tonight — Wine tastings, live music, dinner dates, comedy shows, and more.</p>
          <button onClick={() => setIsEnabled(true)} className="enable-btn">
            Find Tonight's Vibe 💕
          </button>
        </div>
      )}

      <style>{`
        .after-dark-page {
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
          background: linear-gradient(135deg, #faf8f3 0%, #f5eee8 100%);
          min-height: 100vh;
        }

        .page-header {
          position: relative;
          margin-bottom: 24px;
          text-align: center;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #d4617f 0%, #8b5a7d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          margin: 0;
          font-size: 14px;
          color: #8b5a7d;
        }

        .close-btn {
          position: absolute;
          top: 0;
          right: 0;
          padding: 8px 12px;
          border: none;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 1);
        }

        /* TIER 3: Romantic stats section */
        .after-dark-stats {
          background: linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          border-left: 4px solid #d4617f;
        }

        .after-dark-stats h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #8b5a7d;
        }

        .trending-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .trending-tag {
          display: inline-block;
          padding: 6px 12px;
          background: #d4617f;
          color: #fff;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .peak-hours {
          margin: 0;
          font-size: 12px;
          color: #8b5a7d;
        }

        .events-section {
          margin-top: 24px;
        }

        .events-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #222;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: #fff;
          border-radius: 12px;
          color: #666;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .welcome-message {
          text-align: center;
          padding: 60px 20px;
        }

        .welcome-message h2 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 600;
          background: linear-gradient(135deg, #d4617f 0%, #8b5a7d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-message p {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #666;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .enable-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #d4617f 0%, #8b5a7d 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 12px rgba(212, 97, 127, 0.3);
        }

        .enable-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(212, 97, 127, 0.4);
        }

        @media (max-width: 768px) {
          .events-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .welcome-message {
            padding: 40px 20px;
          }

          .welcome-message h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};
