import type { PropsWithChildren } from "react";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { AccountProvider } from "../features/account";
import { NetworkProvider } from "../features/network";
import { SolanaWalletProvider } from "../integrations/solana";
import { PowerChainThemeProvider } from "../theme";
import { PwrcCreditsProvider } from "../features/credits";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PowerChainThemeProvider defaultTheme="light">
        <NetworkProvider>
          <AccountProvider>
            <PwrcCreditsProvider>
              <SolanaWalletProvider>
                {children}
              </SolanaWalletProvider>
            </PwrcCreditsProvider>
          </AccountProvider>
        </NetworkProvider>
      </PowerChainThemeProvider>
    </SafeAreaProvider>
  );
}
