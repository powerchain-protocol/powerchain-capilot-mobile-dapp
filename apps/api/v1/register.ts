import type { FastifyInstance } from "fastify";
import { registerHealthRoutes } from "../src/routes/health";
import { registerAuthRoutes } from "../src/routes/auth";
import { registerAccountRoutes } from "../src/routes/account";
import { registerOnboardingRoutes } from "../src/routes/onboarding";
import { registerWalletRoutes } from "../src/routes/wallets";
import { registerMarketRoutes } from "../src/routes/market";
import { registerAiRoutes } from "../src/routes/ai";
import { registerSolanaRoutes } from "../src/routes/solana";
import { registerSessionRoutes } from "../src/routes/sessions";
import { registerConversationRoutes } from "../src/routes/conversations";
import { registerMarketPriceRoutes } from "../src/routes/market-price";
import { registerIntegrationRoutes } from "../src/routes/integrations";
import { registerConfigRoutes } from "../src/routes/config";
import { registerMcpRoutes } from "../src/routes/mcp";
import { registerSuiRoutes } from "../src/routes/sui";
import { registerCreditRoutes } from "../src/routes/credits";
import { registerPaymentKernelRoutes } from "../src/routes/payment-kernel";
import { registerCorsRoutes } from "../src/routes/cors";
import { registerCapilotMobileRoutes } from "../src/routes/capilot-mobile";
import { registerSystemSolanaRoutes } from "../src/routes/system-solana";
import { registerSystemPlatformRoutes } from "../src/routes/system-platform";
import { registerApiV1DocsRoutes } from "./docs";
import { registerOperationsRoutes } from "../src/routes/operations";
import { registerChatRoutes } from "../src/routes/chat";
import { registerAgentRoutes } from "../src/routes/agents";
import { registerLoraRoutes } from "../src/routes/lora";
import { registerLlmRoutes } from "../src/routes/llm";
import { registerMemoryRoutes } from "../src/routes/memory";

/**
 * Canonical PowerChain API-v1 registration boundary.
 * Route implementation modules remain independently testable under src/routes.
 */
export async function registerApiV1(app: FastifyInstance) {
  await registerApiV1DocsRoutes(app);
  await registerCapilotMobileRoutes(app);
  await registerCorsRoutes(app);
  await registerHealthRoutes(app);
  await registerConfigRoutes(app);
  await registerOperationsRoutes(app);
  await registerMcpRoutes(app);
  await registerAuthRoutes(app);
  await registerAccountRoutes(app);
  await registerOnboardingRoutes(app);
  await registerWalletRoutes(app);
  await registerMarketRoutes(app);
  await registerAiRoutes(app);
  await registerChatRoutes(app);
  await registerAgentRoutes(app);
  await registerLoraRoutes(app);
  await registerLlmRoutes(app);
  await registerMemoryRoutes(app);
  await registerSolanaRoutes(app);
  await registerSystemSolanaRoutes(app);
  await registerSystemPlatformRoutes(app);
  await registerSuiRoutes(app);
  await registerSessionRoutes(app);
  await registerConversationRoutes(app);
  await registerMarketPriceRoutes(app);
  await registerIntegrationRoutes(app);
  await registerCreditRoutes(app);
  await registerPaymentKernelRoutes(app);
}
