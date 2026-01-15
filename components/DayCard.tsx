import { StyleSheet, Text, View } from 'react-native';

interface DayCardProps {
  date: string;
  amount: number;
  goal: number;
  isToday?: boolean;
}

// Get color based on progress percentage
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#10B981'; // Green when complete
  if (percentage >= 75) return '#3B82F6'; // Blue
  if (percentage >= 50) return '#60A5FA'; // Light blue
  return '#93C5FD'; // Lighter blue
};

export default function DayCard({ date, amount, goal, isToday = false }: DayCardProps) {
  const percentage = Math.min((amount / goal) * 100, 100);

  return (
    <View style={[styles.card, isToday && styles.todayCard]}>
      <View style={styles.header}>
        <Text style={[styles.date, isToday && styles.todayDate]}>{date}</Text>
        {isToday && <Text style={styles.todayBadge}>Today</Text>}
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: getProgressColor(percentage) },
            ]}
          />
        </View>
        <Text style={styles.percentageLabel}>{Math.round(percentage)}%</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.amount}>{amount.toLocaleString()}ml</Text>
        <Text style={styles.goal}>/ {goal.toLocaleString()}ml</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 12, // Reduced from 16
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4, // Reduced from 6
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  todayCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  todayDate: {
    color: '#3B82F6',
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressContainer: {
    marginBottom: 8, // Reduced from 12
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4, // Reduced from 6
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'right',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  goal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
});
