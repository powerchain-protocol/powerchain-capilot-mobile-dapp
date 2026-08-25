import { NetworkIcon as Web3NetworkIcon } from "@web3icons/react/dynamic";
import type {
  Web3IconVariant,
  Web3NetworkId,
} from "../../types/web3-assets";
import { web3Networks } from "../../data/web3-assets";

export function NetworkIcon({
  network,
  size = 28,
  variant = "branded",
}: {
  network: Web3NetworkId;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const item = web3Networks[network];

  return (
    <Web3NetworkIcon
      network={item.iconNetwork}
      size={size}
      variant={variant}
      fallback={item.shortName.slice(0, 2)}
    />
  );
}
