import { STORAGE_KEYS, preferencesStorage } from "../storage";
import { createStore } from "./create-store";
type SiteState={hydrated:boolean;activeSiteId:string|null};
const store=createStore<SiteState>({hydrated:false,activeSiteId:null});
export const siteStore={...store,async hydrate(){const activeSiteId=await preferencesStorage.getItem(STORAGE_KEYS.activeSite);store.setState({hydrated:true,activeSiteId});return activeSiteId;},async setActiveSite(activeSiteId:string|null){if(activeSiteId)await preferencesStorage.setItem(STORAGE_KEYS.activeSite,activeSiteId);else await preferencesStorage.removeItem(STORAGE_KEYS.activeSite);store.patch({activeSiteId});}};
export function useActiveSiteId(){return siteStore.useStore((state)=>state.activeSiteId);}
