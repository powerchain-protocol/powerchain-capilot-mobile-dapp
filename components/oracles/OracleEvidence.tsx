import React from 'react';
import { Text, View } from 'react-native';
import type { OracleObservation } from '../../types/oracles';
export function OracleEvidence({ observation }: { observation: OracleObservation }) {
  return <View><Text>{observation.provider}</Text><Text>{observation.subject}: {observation.value} {observation.unit ?? ''}</Text><Text>{observation.verified ? 'Verified' : 'Unverified'}</Text></View>;
}
