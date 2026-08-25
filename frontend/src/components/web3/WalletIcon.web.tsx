import { WalletIcon as Web3WalletIcon } from "@web3icons/react/dynamic";
import type {
  Web3IconVariant,
  Web3WalletId,
} from "../../types/web3-assets";
import { web3Wallets } from "../../data/web3-assets";

export function WalletIcon({
  wallet = "generic",
  size = 28,
  variant = "branded",
}: {
  wallet?: Web3WalletId;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const item = web3Wallets[wallet];

  if (!item.iconName) {
    return (
      <span
        aria-label="Wallet"
        style={{
          display: "inline-flex",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ◫
      </span>
    );
  }

  return (
    <Web3WalletIcon
      name={item.iconName}
      size={size}
      variant={variant}
      fallback="◫"
    />
  );
}
