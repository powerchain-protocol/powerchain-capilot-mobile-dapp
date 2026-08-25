import { TokenIcon } from "@web3icons/react/dynamic";
import type {
  Web3AssetSymbol,
  Web3IconVariant,
} from "../../types/web3-assets";
import { web3Assets } from "../../data/web3-assets";

export function AssetIcon({
  symbol,
  size = 32,
  variant = "branded",
}: {
  symbol: Web3AssetSymbol;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const asset = web3Assets[symbol];

  if (asset.icon.provider === "powerchain") {
    return (
      <img
        alt={`${asset.name} icon`}
        src="/assets/tokens/pwrc.png"
        width={size}
        height={size}
        style={{
          display: "block",
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "contain",
        }}
      />
    );
  }

  return (
    <TokenIcon
      symbol={asset.icon.symbol ?? symbol}
      size={size}
      variant={variant}
      fallback={
        <span
          aria-label={`${asset.name} icon`}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.max(10, Math.floor(size * 0.32)),
            fontWeight: 700,
          }}
        >
          {symbol.slice(0, 2)}
        </span>
      }
    />
  );
}
