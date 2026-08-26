import type { AppRole } from "../shared/types";
import { STORAGE_KEYS, preferencesStorage } from "../storage";
import { createStore } from "./create-store";

const APP_ROLES = new Set<AppRole>([
  "consumer",
  "prosumer",
  "asset_operator",
  "energy_manager",
  "portfolio_manager",
  "finance",
  "customer_success",
  "sales",
  "compliance",
  "administrator",
]);

function parseRole(value: string | null): AppRole | null {
  return value && APP_ROLES.has(value as AppRole) ? (value as AppRole) : null;
}

export type PreferencesState = {
  hydrated: boolean;
  activeOrganizationId: string | null;
  activeRole: AppRole | null;
  lastVisitedRoute: string | null;
};

const store = createStore<PreferencesState>({
  hydrated: false,
  activeOrganizationId: null,
  activeRole: null,
  lastVisitedRoute: null,
});

export const preferencesStore = {
  ...store,
  async hydrate() {
    const [activeOrganizationId, activeRole, lastVisitedRoute] = await Promise.all([
      preferencesStorage.getItem(STORAGE_KEYS.activeOrganization),
      preferencesStorage.getItem(STORAGE_KEYS.activeRole),
      preferencesStorage.getItem(STORAGE_KEYS.lastVisitedRoute),
    ]);

    store.setState({
      hydrated: true,
      activeOrganizationId,
      activeRole: parseRole(activeRole),
      lastVisitedRoute,
    });
  },
  async setOrganization(activeOrganizationId: string | null) {
    if (activeOrganizationId) {
      await preferencesStorage.setItem(STORAGE_KEYS.activeOrganization, activeOrganizationId);
    } else {
      await preferencesStorage.removeItem(STORAGE_KEYS.activeOrganization);
    }
    store.patch({ activeOrganizationId });
  },
  async setRole(activeRole: AppRole | null) {
    if (activeRole) {
      await preferencesStorage.setItem(STORAGE_KEYS.activeRole, activeRole);
    } else {
      await preferencesStorage.removeItem(STORAGE_KEYS.activeRole);
    }
    store.patch({ activeRole });
  },
  async setLastVisitedRoute(lastVisitedRoute: string | null) {
    if (lastVisitedRoute) {
      await preferencesStorage.setItem(STORAGE_KEYS.lastVisitedRoute, lastVisitedRoute);
    } else {
      await preferencesStorage.removeItem(STORAGE_KEYS.lastVisitedRoute);
    }
    store.patch({ lastVisitedRoute });
  },
};
