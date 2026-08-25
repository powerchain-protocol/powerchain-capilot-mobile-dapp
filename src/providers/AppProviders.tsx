import type { PropsWithChildren } from "react";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { AccountProvider } from "../features/account";
import { NetworkProvider } from "../features/network";
import { SolanaWalletProvider } from "../integrations/solana";
import { PowerChainThemeProvider } from "../theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PowerChainThemeProvider defaultTheme="light">
        <NetworkProvider>
          <AccountProvider>
            <SolanaWalletProvider>
              {children}
            </SolanaWalletProvider>
          </AccountProvider>
        </NetworkProvider>
      </PowerChainThemeProvider>
    </SafeAreaProvider>
  );
}
