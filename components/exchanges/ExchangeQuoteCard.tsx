import React from 'react';
import { Text, View } from 'react-native';
import type { ExchangeQuote } from '../../types/exchanges';
export function ExchangeQuoteCard({ quote }: { quote: ExchangeQuote }) {
  return <View><Text>{quote.exchange}</Text><Text>{quote.inputAmount} {quote.inputAsset} → {quote.outputAmount} {quote.outputAsset}</Text><Text>Read-only quote</Text></View>;
}
