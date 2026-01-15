import { StyleSheet, View, ScrollView, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWater } from '@/hooks/useWater';
import ProgressRing from '@/components/ProgressRing';
import WaterButton from '@/components/WaterButton';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Get color based on progress value (0-1)
const getProgressColor = (progress: number): string => {
  if (progress >= 1) return '#10B981'; // Green when complete
  if (progress >= 0.75) return '#3B82F6'; // Blue
  if (progress >= 0.5) return '#60A5FA'; // Light blue
  return '#93C5FD'; // Lighter blue
};

export default function HomeScreen() {
  const router = useRouter();
  const { consumed, goal, progress, loading, error, addWater, undo, canUndo, lastAddedAmount } = useWater();
  const [addingWater, setAddingWater] = useState(false);
  const [undoing, setUndoing] = useState(false);
  // AppState handling is already done in useWater hook

  const handleAddWater = async (amount: number) => {
    try {
      setAddingWater(true);
      // Haptic feedback on add water
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await addWater(amount);
    } catch (err) {
      Alert.alert('Error', 'Failed to add water. Please try again.');
      if (__DEV__) console.error('Error adding water:', err);
    } finally {
      setAddingWater(false);
    }
  };

  const handleUndo = async () => {
    try {
      setUndoing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await undo();
    } catch (err) {
      Alert.alert('Error', 'Failed to undo. Please try again.');
      if (__DEV__) console.error('Error undoing:', err);
    } finally {
      setUndoing(false);
    }
  };

  // Memoize calculated values to prevent unnecessary recalculations
  const { progressValue, displayAmount, progressPercentage } = useMemo(() => {
    const safeConsumed = Math.max(consumed, 0);
    const progressVal = goal > 0 ? Math.min(Math.max(consumed / goal, 0), 1) : 0;
    const progressPct = Math.round(Math.min(progress, 100));

    return {
      progressValue: progressVal,
      displayAmount: safeConsumed,
      progressPercentage: progressPct,
    };
  }, [consumed, goal, progress]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Stay Hydrated</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/history');
                }}
                activeOpacity={0.7}>
                <Ionicons name="time-outline" size={24} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/settings');
                }}
                activeOpacity={0.7}>
                <Ionicons name="settings-outline" size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>Track your daily water intake</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressRing
            progress={progressValue}
            size={280}
            strokeWidth={12}
            color={getProgressColor(progressValue)}
            backgroundColor="#E5E7EB">
            <Text style={styles.amount}>{displayAmount.toLocaleString()}</Text>
            <Text style={styles.unit}>ml</Text>
            <Text style={styles.goal}>of {goal.toLocaleString()}ml</Text>
            <Text style={styles.percentage}>{progressPercentage}%</Text>
          </ProgressRing>
        </View>

        {canUndo && lastAddedAmount && (
          <View style={styles.undoContainer}>
            <TouchableOpacity
              style={styles.undoButton}
              onPress={handleUndo}
              disabled={undoing}
              activeOpacity={0.7}>
              <Text style={styles.undoButtonText}>
                {undoing ? 'Undoing...' : `Undo +${lastAddedAmount}ml`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <Text style={styles.buttonsTitle}>Quick Add</Text>
          <View style={styles.buttonsRow}>
            <WaterButton
              amount={100}
              onPress={() => handleAddWater(100)}
              disabled={addingWater}
              loading={addingWater}
            />
            <WaterButton
              amount={250}
              onPress={() => handleAddWater(250)}
              disabled={addingWater}
              loading={addingWater}
            />
            <WaterButton
              amount={500}
              onPress={() => handleAddWater(500)}
              disabled={addingWater}
              loading={addingWater}
            />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{displayAmount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Consumed (ml)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{goal.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Daily Goal (ml)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progressPercentage}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    width: '100%',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: -4,
  },
  goal: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 8,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  undoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  undoButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  undoButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  buttonsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});
