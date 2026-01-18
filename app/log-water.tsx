import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { addWater } from '@/storage/waterStorage';
import {
  parseWaterAmount,
  isValidAmount,
  formatAmount,
} from '@/utils/parseWaterAmount';

/**
 * Deep link handler for voice assistant commands
 * URL format: watertracker://log-water?amount=350
 *
 * This screen:
 * 1. Parses the amount from URL params
 * 2. Adds water to storage
 * 3. Shows confirmation
 * 4. Auto-navigates to home after delay
 */
export default function LogWaterScreen() {
  const params = useLocalSearchParams<{ amount?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing'
  );
  const [message, setMessage] = useState('Processing...');
  const [addedAmount, setAddedAmount] = useState<number | null>(null);

  useEffect(() => {
    async function processVoiceCommand() {
      try {
        const rawAmount = params.amount;

        if (!rawAmount) {
          setStatus('error');
          setMessage('No amount specified');
          redirectToHome();
          return;
        }

        // Parse the amount (handles "350", "350ml", "half liter", etc.)
        const parseResult = parseWaterAmount(rawAmount);

        if (!parseResult.success || !parseResult.amount) {
          setStatus('error');
          setMessage(parseResult.error || 'Could not parse amount');
          redirectToHome();
          return;
        }

        const amount = parseResult.amount;

        if (!isValidAmount(amount)) {
          setStatus('error');
          setMessage('Amount must be between 1ml and 5000ml');
          redirectToHome();
          return;
        }

        // Add water to storage
        await addWater(amount);

        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAddedAmount(amount);
        setStatus('success');
        setMessage(`Added ${formatAmount(amount)}!`);

        // Auto-navigate to home after 2 seconds
        redirectToHome(2000);
      } catch (error) {
        console.error('Error processing voice command:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStatus('error');
        setMessage('Failed to log water');
        redirectToHome();
      }
    }

    function redirectToHome(delay = 1500) {
      setTimeout(() => {
        router.replace('/');
      }, delay);
    }

    processVoiceCommand();
  }, [params.amount, router]);

  const styles = createStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.message}>{message}</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.successMessage}>{message}</Text>
            {addedAmount && (
              <Text style={styles.amount}>{formatAmount(addedAmount)}</Text>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorMessage}>{message}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    checkmark: {
      fontSize: 80,
      color: '#10B981',
      marginBottom: 16,
    },
    errorIcon: {
      fontSize: 80,
      color: '#DC2626',
      marginBottom: 16,
      fontWeight: 'bold',
    },
    message: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 16,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 24,
      fontWeight: '600',
      color: '#10B981',
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 18,
      fontWeight: '500',
      color: '#DC2626',
      textAlign: 'center',
    },
    amount: {
      fontSize: 56,
      fontWeight: '700',
      color: '#3B82F6',
      marginTop: 16,
    },
  });
