import { useEffect } from "react";
import { Stack } from "expo-router";
import { OperationalCommandMenu } from "../../src/components/navigation";
import { siteStore } from "../../src/store/site-store";

export default function AppLayout() {
  useEffect(() => { void siteStore.hydrate(); }, []);
  return <>
    <Stack screenOptions={{ headerShown: false }} />
    <OperationalCommandMenu />
  </>;
}
