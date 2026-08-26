export const APP_ROUTES = {
  overview: "/(app)/(tabs)",
  actionCenter: "/(app)/(tabs)/action-center",
  copilot: "/(app)/(tabs)/copilot",
  assets: "/(app)/(tabs)/assets",
  systems: "/(app)/(tabs)/integrations",
  credits: "/(app)/copilot-credits",
  batchApprovals: "/(app)/approvals/batch",
  reports: "/(app)/reports",
  settlementReview: "/(app)/settlements/review",
  serviceHealth: "/(app)/service-health",
  diagnostics: "/(app)/diagnostics",
  energy: "/(app)/energy",
  energyFlow: "/(app)/energy/flow",
  iot: "/(app)/iot",
  depin: "/(app)/depin",
  settings: "/(app)/settings",
} as const;

export const PRIMARY_TABS = [
  { key: "index", label: "Overview", icon: "view-dashboard-outline", href: APP_ROUTES.overview },
  { key: "action-center", label: "Actions", icon: "checkbox-marked-circle-outline", href: APP_ROUTES.actionCenter },
  { key: "copilot", label: "Copilot", icon: "robot-outline", href: APP_ROUTES.copilot },
  { key: "assets", label: "Assets", icon: "solar-panel-large", href: APP_ROUTES.assets },
  { key: "integrations", label: "Systems", icon: "server-network", href: APP_ROUTES.systems },
] as const;

export function assetDetailRoute(assetId: string) {
  return `/(app)/assets/${encodeURIComponent(assetId)}` as const;
}

export function actionDetailRoute(actionId: string) {
  return `/(app)/actions/${encodeURIComponent(actionId)}` as const;
}
