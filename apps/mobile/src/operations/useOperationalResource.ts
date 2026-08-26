import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { dedupedLoad, getCached } from "./resource-cache";
export function useOperationalResource<T>(key:string|null,loader:()=>Promise<T>,options:{staleTimeMs?:number;refreshIntervalMs?:number}={}){
 const staleTimeMs=options.staleTimeMs??15_000; const refreshIntervalMs=options.refreshIntervalMs??30_000;
 const initial=useMemo(()=>key?getCached<T>(key):null,[key]);
 const [data,setData]=useState<T|null>(initial?.value??null); const [error,setError]=useState<Error|null>(null); const [loading,setLoading]=useState(!initial); const [updatedAt,setUpdatedAt]=useState<number|null>(initial?.fetchedAt??null);
 const refresh=useCallback(async(force=false)=>{if(!key)return null;const cached=getCached<T>(key);if(!force&&cached&&Date.now()-cached.fetchedAt<staleTimeMs){setData(cached.value);setUpdatedAt(cached.fetchedAt);setLoading(false);return cached.value;}setLoading(!cached);try{const value=await dedupedLoad(key,loader);setData(value);setUpdatedAt(Date.now());setError(null);return value;}catch(e){setError(e instanceof Error?e:new Error("Operational request failed."));return null;}finally{setLoading(false);}},[key,loader,staleTimeMs]);
 useEffect(()=>{void refresh(false);},[refresh]);
 useEffect(()=>{if(!key||refreshIntervalMs<=0)return;const timer=setInterval(()=>void refresh(false),refreshIntervalMs);return()=>clearInterval(timer);},[key,refresh,refreshIntervalMs]);
 useEffect(()=>{const subscription=AppState.addEventListener("change",(state)=>{if(state==="active")void refresh(true);});return()=>subscription.remove();},[refresh]);
 return {data,error,loading,stale:Boolean(data&&error),updatedAt:updatedAt?new Date(updatedAt).toISOString():null,refresh:()=>refresh(true)};
}
