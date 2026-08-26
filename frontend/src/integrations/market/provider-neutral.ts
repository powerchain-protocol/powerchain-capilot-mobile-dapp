import { BackendMarketDataClient, JsonHttpClient } from "@powerchain/platform-clients";
import { mobileEnv } from "../../config/env";
import { getSessionToken } from "../../api/client";

const http = new JsonHttpClient({
  baseUrl: mobileEnv.apiUrl,
  getAccessToken: getSessionToken,
});

export const providerNeutralMarketData = new BackendMarketDataClient(http);
