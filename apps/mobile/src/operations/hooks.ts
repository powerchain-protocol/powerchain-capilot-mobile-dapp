import { useCallback } from "react";
import { getTwin, listAlarms, listEvents, listSites } from "./client";
import { useOperationalResource } from "./useOperationalResource";
export function useOperationalSites(){const loader=useCallback(()=>listSites(),[]);return useOperationalResource("operations:sites",loader,{staleTimeMs:60_000,refreshIntervalMs:120_000});}
export function useSiteTwin(siteId:string|null){const loader=useCallback(()=>{if(!siteId)throw new Error("Site is required.");return getTwin(siteId);},[siteId]);return useOperationalResource(siteId?`operations:twin:${siteId}`:null,loader,{staleTimeMs:10_000,refreshIntervalMs:30_000});}
export function useSiteAlarms(siteId:string|null){const loader=useCallback(()=>{if(!siteId)throw new Error("Site is required.");return listAlarms(siteId);},[siteId]);return useOperationalResource(siteId?`operations:alarms:${siteId}`:null,loader,{staleTimeMs:10_000,refreshIntervalMs:30_000});}
export function useSiteEvents(siteId:string|null){const loader=useCallback(()=>{if(!siteId)throw new Error("Site is required.");return listEvents(siteId);},[siteId]);return useOperationalResource(siteId?`operations:events:${siteId}`:null,loader,{staleTimeMs:10_000,refreshIntervalMs:30_000});}
