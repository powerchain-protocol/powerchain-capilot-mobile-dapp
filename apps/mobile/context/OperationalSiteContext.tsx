import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useOperationalSites } from '@/hooks/useOperationalSites';
import type { EnergySiteSummary } from '@/types/operations';

type Value = {
  sites: EnergySiteSummary[];
  selectedSiteId?: string;
  selectedSite?: EnergySiteSummary;
  setSelectedSiteId: (siteId: string | undefined) => void;
  error?: string;
  isLoading: boolean;
  refresh: () => Promise<boolean>;
};

const OperationalSiteContext = createContext<Value | null>(null);

export function OperationalSiteProvider({ children }: PropsWithChildren) {
  const query = useOperationalSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>();

  useEffect(() => {
    if (!query.sites.length) { setSelectedSiteId(undefined); return; }
    if (!selectedSiteId || !query.sites.some((site) => site.id === selectedSiteId)) setSelectedSiteId(query.sites[0].id);
  }, [query.sites, selectedSiteId]);

  const selectedSite = query.sites.find((site) => site.id === selectedSiteId);
  const value = useMemo(() => ({ sites: query.sites, selectedSiteId, selectedSite, setSelectedSiteId, error: query.error, isLoading: query.isLoading, refresh: query.refresh }), [query.sites, selectedSiteId, selectedSite, query.error, query.isLoading, query.refresh]);
  return <OperationalSiteContext.Provider value={value}>{children}</OperationalSiteContext.Provider>;
}

export function useOperationalSite() {
  const value = useContext(OperationalSiteContext);
  if (!value) throw new Error('useOperationalSite must be used inside OperationalSiteProvider.');
  return value;
}
