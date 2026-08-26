import React from 'react';
import { Text, View } from 'react-native';
export function EnergyMetric({ label, value, unit }: { label: string; value: string; unit: 'W' | 'kW' | 'MW' | 'Wh' | 'kWh' | 'MWh' }) {
  return <View><Text>{label}</Text><Text>{value} {unit}</Text></View>;
}
