import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessApi } from '../api/client';

export interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  phone?: string;
  priceRange: string;
  tags: string[];
  tier: string;
  active: boolean;
  verified: boolean;
  // Onboarding & subscription fields
  featuredCategory?: string;
  radiusMiles?: number;
  logoUrl?: string;
  heroImageUrl?: string;
  subscriptionTier?: 'free' | 'featured' | 'premium';
  subscriptionRenewsAt?: string;
  platformIds?: {
    ticketmaster?: string;
    songkick?: string;
    opentable?: string;
    resy?: string;
    eventbrite?: string;
  };
}

export function useBusinessAuth() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('business_token');
    if (!token) {
      navigate('/business/login', { replace: true });
      setLoading(false);
      return;
    }

    businessApi
      .getMe()
      .then((res) => {
        setBusiness((res.data as { business: BusinessProfile }).business);
      })
      .catch(() => {
        localStorage.removeItem('business_token');
        navigate('/business/login', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const signOut = () => {
    localStorage.removeItem('business_token');
    navigate('/business/login');
  };

  return { business, loading, signOut, setBusiness };
}
