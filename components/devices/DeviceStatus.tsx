import React from 'react';
import { Text, View } from 'react-native';
export function DeviceStatus({ name, status }: { name: string; status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  return <View><Text>{name}</Text><Text>{status}</Text></View>;
}
