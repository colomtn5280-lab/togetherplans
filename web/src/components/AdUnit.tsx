import { useEffect, useRef } from 'react';
import { useAdsActive } from '../hooks/useAdConfig';

interface Props {
  slot: string;           // AdSense ad slot ID
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * AdUnit — renders an AdSense unit when ads are enabled.
 * Returns null (zero DOM) when feature flag is off.
 * Re-pushes on every mount so React Router SPA navigation gets fresh impressions.
 */
export function AdUnit({ slot, format = 'auto', style, className }: Props) {
  const active = useAdsActive('web');
  const pushed = useRef(false);

  useEffect(() => {
    if (!active || pushed.current) return;
    try {
      // @ts-expect-error adsbygoogle is a global injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Silent — never crash for ads
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className={className} style={{ textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9071368122045876"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
