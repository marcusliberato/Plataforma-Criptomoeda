import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fetchExchangePairs,
  formatPercent,
  formatPrice,
  formatVolume,
} from './marketData.js';
import { platformTheme } from '../../theme/platformTheme.js';

function ExchangeCard({ title, count, items }) {
  return (
    <View style={styles.exchangeCard}>
      <View style={styles.exchangeHeader}>
        <Text style={styles.exchangeTitle}>{title}</Text>
        <Text style={styles.exchangeCount}>{count} pares</Text>
      </View>

      {items.map((item) => (
        <View key={`${title}-${item.symbol}`} style={styles.pairItem}>
          <View>
            <Text style={styles.pairSymbol}>{item.symbol}</Text>
            <Text style={styles.pairVolume}>Volume {formatVolume(item.quoteVolume)}</Text>
          </View>
          <View>
            <Text style={styles.pairPrice}>US$ {formatPrice(item.lastPrice)}</Text>
            <Text style={[styles.pairChange, item.changePercent >= 0 ? styles.up : styles.down]}>
              {formatPercent(item.changePercent)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MarketOverview() {
  const [binance, setBinance] = useState([]);
  const [bybit, setBybit] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const [binancePairs, bybitPairs] = await Promise.all([
        fetchExchangePairs('binance'),
        fetchExchangePairs('bybit'),
      ]);
      setBinance(binancePairs);
      setBybit(bybitPairs);
      setStatus('ok');
    } catch (nextError) {
      setError(nextError.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Mercado</Text>
        <Pressable style={styles.refreshButton} onPress={load}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </Pressable>
      </View>

      {status === 'loading' ? <ActivityIndicator color={platformTheme.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        <ExchangeCard title='Binance' count={binance.length} items={binance} />
        <ExchangeCard title='Bybit' count={bybit.length} items={bybit} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: platformTheme.titleText,
  },
  refreshButton: {
    backgroundColor: platformTheme.controlBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: platformTheme.controlRadius,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
  },
  refreshText: {
    color: platformTheme.accent,
    fontWeight: '700',
  },
  grid: {
    gap: 14,
    paddingRight: 12,
  },
  exchangeCard: {
    width: 330,
    backgroundColor: platformTheme.cardBackground,
    borderRadius: platformTheme.surfaceRadius,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
    ...platformTheme.surfaceShadow,
  },
  exchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exchangeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  exchangeCount: {
    color: platformTheme.accent,
    fontWeight: '600',
  },
  pairItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: platformTheme.controlBorder,
    borderRadius: platformTheme.controlRadius,
    padding: 12,
    backgroundColor: platformTheme.controlBackground,
  },
  pairSymbol: {
    fontWeight: '700',
    fontSize: 16,
  },
  pairVolume: {
    color: platformTheme.mutedText,
    marginTop: 4,
  },
  pairPrice: {
    textAlign: 'right',
    fontWeight: '700',
  },
  pairChange: {
    marginTop: 4,
    textAlign: 'right',
  },
  up: {
    color: '#12824d',
  },
  down: {
    color: '#c03838',
  },
  error: {
    color: '#c03838',
  },
});
