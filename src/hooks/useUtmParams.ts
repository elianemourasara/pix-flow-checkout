
import { useEffect, useState } from 'react';
import { UTMData } from '@/types/checkout';

/**
 * Hook to capture UTM parameters from URL
 */
export const useUtmParams = () => {
  const [utmParams, setUtmParams] = useState<UTMData>({});
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const utmData: UTMData = {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined
    };
    
    // Filter out undefined values
    const filteredUtmData = Object.entries(utmData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    setUtmParams(filteredUtmData);
    
    // Also store in sessionStorage for persistence across pages
    sessionStorage.setItem('utm_params', JSON.stringify(filteredUtmData));
  }, []);
  
  return utmParams;
};

/**
 * Function to get UTM params from sessionStorage
 */
export const getStoredUtmParams = (): UTMData => {
  const storedParams = sessionStorage.getItem('utm_params');
  return storedParams ? JSON.parse(storedParams) : {};
};
