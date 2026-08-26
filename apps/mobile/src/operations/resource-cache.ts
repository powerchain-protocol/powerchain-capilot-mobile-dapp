type CacheEntry<T>={value:T;fetchedAt:number};
const cache=new Map<string,CacheEntry<unknown>>();
const inFlight=new Map<string,Promise<unknown>>();
export function getCached<T>(key:string):CacheEntry<T>|null{return (cache.get(key) as CacheEntry<T>|undefined)??null;}
export function invalidateOperationalCache(prefix?:string){if(!prefix){cache.clear();return;}for(const key of cache.keys())if(key.startsWith(prefix))cache.delete(key);}
export async function dedupedLoad<T>(key:string,loader:()=>Promise<T>):Promise<T>{const existing=inFlight.get(key) as Promise<T>|undefined;if(existing)return existing;const pending=loader().then((value)=>{cache.set(key,{value,fetchedAt:Date.now()});return value;}).finally(()=>inFlight.delete(key));inFlight.set(key,pending);return pending;}
