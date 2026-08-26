export type EntityId = string;
export type OrganizationId = string;
export type UserId = string;
export type IsoDateString = string;

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type AsyncState<T> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: Error };

export type AppRole =
  | "consumer"
  | "prosumer"
  | "asset_operator"
  | "energy_manager"
  | "portfolio_manager"
  | "finance"
  | "customer_success"
  | "sales"
  | "compliance"
  | "administrator";

export type DataMode = "demo" | "live" | "tba";
export type SolanaCluster = "devnet" | "mainnet-beta";
export type SuiNetwork = "devnet" | "testnet" | "mainnet";
