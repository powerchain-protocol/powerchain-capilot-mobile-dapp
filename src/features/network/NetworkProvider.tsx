import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type NetworkContextValue = {
  state: NetInfoState | null;
  connected: boolean;
  internetReachable: boolean;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => NetInfo.addEventListener(setState), []);

  const value = useMemo(
    () => ({
      state,
      connected: state?.isConnected !== false,
      internetReachable: state?.isInternetReachable !== false,
    }),
    [state],
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  const value = useContext(NetworkContext);
  if (!value) {
    throw new Error("useNetworkStatus must be used inside NetworkProvider");
  }
  return value;
}
