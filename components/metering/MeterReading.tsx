import React from 'react';
import { Text, View } from 'react-native';
export function MeterReading({ meterId, value, unit, observedAt }: { meterId: string; value: string; unit: string; observedAt: string }) {
  return <View><Text>{meterId}</Text><Text>{value} {unit}</Text><Text>{observedAt}</Text></View>;
}
