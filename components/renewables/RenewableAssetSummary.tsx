import React from 'react';
import { Text, View } from 'react-native';
export function RenewableAssetSummary({ name, kind, capacity }: { name: string; kind: 'solar' | 'wind' | 'hydro' | 'storage'; capacity: string }) {
  return <View accessibilityLabel={`${name} ${kind} ${capacity}`}><Text>{name}</Text><Text>{kind} · {capacity}</Text></View>;
}
