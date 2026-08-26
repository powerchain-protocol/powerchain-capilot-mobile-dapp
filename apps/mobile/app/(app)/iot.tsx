import { ScreenToolbar, ResponsiveGrid } from "../../src/components/layout";
import { EmptyState, Screen, Section } from "../../src/components/ui";
import { DeviceStatusCard } from "../../src/components/operations";
import { useIotDevices } from "../../src/hooks/useIotDevices";

export default function IotDevicesScreen() {
  const devices = useIotDevices();
  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Physical infrastructure"
        title="IoT Devices"
        description="Smart meters, gateways, inverters, battery controllers, EV chargers and sensors."
        actions={[{ label: "Refresh", icon: "refresh", onPress: () => void devices.refresh(), variant: "primary" }]}
      />
      <Section title="Connected devices">
        {devices.data?.length ? (
          <ResponsiveGrid minItemWidth={280}>
            {devices.data.map((device) => <DeviceStatusCard key={device.id} device={device} />)}
          </ResponsiveGrid>
        ) : (
          <EmptyState
            title={devices.loading ? "Loading devices" : "No devices available"}
            description={devices.error?.message ?? "No IoT devices are registered for this organization."}
            actionLabel={!devices.loading ? "Retry" : undefined}
            onAction={!devices.loading ? () => void devices.refresh() : undefined}
          />
        )}
      </Section>
    </Screen>
  );
}
