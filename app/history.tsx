import DayCard from '@/components/DayCard';
import { getGoal, getHistory } from '@/storage/waterStorage';
import { formatDate, formatDateShort, getDaysAgo, isToday } from '@/utils/date';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HistoryEntry {
  date: string;
  dateString: string; // YYYY-MM-DD format
  amount: number;
  goal: number;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(3500);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get history and goal in parallel
      const [historyData, currentGoal] = await Promise.all([
        getHistory(),
        getGoal(),
      ]);

      setGoal(currentGoal);

      // Generate last 7 days
      const entries: HistoryEntry[] = [];

      for (let i = 0; i < 7; i++) {
        const date = getDaysAgo(i);
        const dateString = formatDate(date);
        const amount = historyData[dateString] || 0;
        const displayDate = formatDateShort(date);

        // Add "Today" label for today
        const dateLabel = isToday(date) ? 'Today' : displayDate;

        entries.push({
          date: dateLabel,
          dateString,
          amount,
          goal: currentGoal,
        });
      }

      setHistory(entries);
    } catch (error) {
      if (__DEV__) console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderItem = useCallback(({ item }: { item: HistoryEntry }) => {
    // Parse date string (YYYY-MM-DD) to Date object
    const [year, month, day] = item.dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    return (
      <DayCard
        date={item.date}
        amount={item.amount}
        goal={item.goal}
        isToday={isToday(dateObj)}
      />
    );
  }, []);

  const renderEmpty = useMemo(() => () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No history available</Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.dateString}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshing={loading}
        onRefresh={loadHistory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingTop: 4, // Minimal top padding
    paddingBottom: 16, // Reduced bottom padding
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, // Reduced from 100
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
});
