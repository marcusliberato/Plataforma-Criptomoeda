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
  fetchHomeHighlights,
  formatPercent,
  formatPrice,
} from './marketData.js';

export default function MarketHighlights({ onOpenMarket }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const nextItems = await fetchHomeHighlights();
      setItems(nextItems);
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
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mercado cripto</Text>
        <Text style={styles.subtitle}>Últimas 24h</Text>
      </View>

      {status === 'loading' ? <ActivityIndicator color='#5b63ff' /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {items.map((item) => (
          <View key={item.symbol} style={styles.card}>
            <Text style={styles.symbol}>{item.asset}</Text>
            <Text style={styles.price}>R$ {formatPrice(item.lastPrice)}</Text>
            <Text style={[styles.change, item.changePercent >= 0 ? styles.up : styles.down]}>
              {formatPercent(item.changePercent)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.linkButton} onPress={onOpenMarket}>
        <Text style={styles.linkText}>Exibir mercado completo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    color: '#6b7280',
    fontWeight: '600',
  },
  cards: {
    gap: 14,
    paddingRight: 12,
  },
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ececf4',
    gap: 10,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    color: '#4b5563',
    fontSize: 18,
  },
  change: {
    fontSize: 16,
    fontWeight: '700',
  },
  up: {
    color: '#12824d',
  },
  down: {
    color: '#c03838',
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#5b36d8',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#c03838',
  },
});
