/**
 * EventCardEnhanced.tsx — TIER 2 Enhancement
 * Shows event with time-until-event and formatted time display
 */

import React from 'react';

interface TimeEnrichedSuggestion {
  id: string;
  title: string;
  category: string;
  date?: string;
  timeStart?: string;
  timeUntilEvent?: number;
  timeDisplay?: string;
  isTonight?: boolean;
  image?: string;
  rating?: number;
  source: string;
}

interface EventCardEnhancedProps {
  event: TimeEnrichedSuggestion;
  onSelect?: (event: TimeEnrichedSuggestion) => void;
}

export const EventCardEnhanced: React.FC<EventCardEnhancedProps> = ({ event, onSelect }) => {
  const urgency = event.timeUntilEvent !== undefined && event.timeUntilEvent < 120;
  const isImminent = event.timeUntilEvent !== undefined && event.timeUntilEvent < 30;

  return (
    <div
      className={`event-card-enhanced ${event.isTonight ? 'is-tonight' : ''} ${isImminent ? 'is-imminent' : ''}`}
      onClick={() => onSelect?.(event)}
    >
      {event.image && (
        <div className="card-image">
          <img src={event.image} alt={event.title} />
          {isImminent && <span className="imminent-badge">⚡ NOW</span>}
          {urgency && <span className="urgent-badge">🔥 Soon</span>}
        </div>
      )}

      <div className="card-content">
        <h4 className="card-title">{event.title}</h4>

        <div className="card-meta">
          <span className="category">{event.category}</span>
          {event.rating && <span className="rating">★ {event.rating.toFixed(1)}</span>}
        </div>

        {/* TIER 2: Time display enrichment */}
        {event.timeDisplay && (
          <div className={`time-display ${event.isTonight ? 'tonight' : ''}`}>{event.timeDisplay}</div>
        )}

        {event.timeUntilEvent !== undefined && (
          <div className="time-until">
            {event.timeUntilEvent === 0
              ? '🔔 Starting now'
              : event.timeUntilEvent < 60
              ? `⏰ In ${event.timeUntilEvent} min`
              : event.timeUntilEvent < 1440
              ? `⏰ In ${Math.floor(event.timeUntilEvent / 60)} hr`
              : `⏰ In ${Math.floor(event.timeUntilEvent / 1440)} days`}
          </div>
        )}

        <div className="card-source">{event.source}</div>
      </div>

      <style>{`
        .event-card-enhanced {
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-left: 4px solid #ddd;
        }

        .event-card-enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .event-card-enhanced.is-tonight {
          border-left-color: #ffd700;
          background: #fffef8;
        }

        .event-card-enhanced.is-imminent {
          border-left-color: #ff6b6b;
          box-shadow: 0 0 12px rgba(255, 107, 107, 0.3);
        }

        .card-image {
          position: relative;
          width: 100%;
          height: 120px;
          overflow: hidden;
          background: #f0f0f0;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .imminent-badge,
        .urgent-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          z-index: 1;
        }

        .imminent-badge {
          background: #ff6b6b;
        }

        .urgent-badge {
          background: #ffa500;
        }

        .card-content {
          padding: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-title {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          color: #222;
        }

        .card-meta {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .category {
          display: inline-block;
          padding: 2px 6px;
          background: #f0f0f0;
          border-radius: 4px;
          color: #666;
          font-weight: 500;
        }

        .rating {
          color: #ff9500;
          font-weight: 600;
        }

        /* TIER 2: Time display styling */
        .time-display {
          padding: 6px 8px;
          background: #f9f9f9;
          border-left: 3px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .time-display.tonight {
          background: #fffbf0;
          border-left-color: #ffd700;
          color: #d4a800;
        }

        .time-until {
          font-size: 12px;
          color: #ff6b6b;
          font-weight: 600;
          padding: 4px 0;
        }

        .card-source {
          font-size: 10px;
          color: #999;
          margin-top: auto;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
};
