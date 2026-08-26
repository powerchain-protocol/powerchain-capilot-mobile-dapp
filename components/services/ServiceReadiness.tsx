import React from 'react';
import { Text, View } from 'react-native';
export function ServiceReadiness({ service, status }: { service: string; status: 'ready' | 'degraded' | 'unavailable' | 'not_configured' }) {
  return <View><Text>{service}</Text><Text>{status}</Text></View>;
}
