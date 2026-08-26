import React from 'react';
import { Text, View } from 'react-native';
export function ExchangeStatus({ label, status }: { label: string; status: 'online' | 'degraded' | 'offline' }) {
  return <View><Text>{label}</Text><Text>{status}</Text></View>;
}
