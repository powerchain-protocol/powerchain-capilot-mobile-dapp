import type { PropsWithChildren } from "react";
import { AccountProvider } from "../src/features/account";
import { SolanaWalletProvider } from "../src/integrations/solana";
import { PowerChainThemeProvider } from "../src/theme";

export function RootProviders({ children }: PropsWithChildren) {
  return (
    <PowerChainThemeProvider defaultTheme="light">
      <AccountProvider>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </AccountProvider>
    </PowerChainThemeProvider>
  );
}
