import { useWater } from '@/hooks/useWater';
import { clearWaterData } from '@/storage/waterStorage';
import { scheduleWaterReminders } from '@/utils/notifications';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Reminder interval options (in minutes)
const REMINDER_INTERVALS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
];

// Time format validation (HH:mm)
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;


export default function SettingsScreen() {
  const { goal, setGoal, reminderInterval, setReminderInterval, wakeTime, sleepTime, setWakeTime, setSleepTime, loading, refresh } = useWater();
  const [goalInput, setGoalInput] = useState('');
  const [wakeTimeInput, setWakeTimeInput] = useState('');
  const [sleepTimeInput, setSleepTimeInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [resetting, setResetting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const wakeTimeInputRef = useRef<TextInput>(null);
  const sleepTimeInputRef = useRef<TextInput>(null);
  const wakeTimeInputContainerRef = useRef<View>(null);
  const sleepTimeInputContainerRef = useRef<View>(null);

  // Load current values when component mounts
  useEffect(() => {
    if (goal) {
      setGoalInput(goal.toString());
    }
    if (wakeTime) {
      setWakeTimeInput(wakeTime);
    }
    if (sleepTime) {
      setSleepTimeInput(sleepTime);
    }
  }, [goal, wakeTime, sleepTime]);

  const handleSaveGoal = async () => {
    const newGoal = parseInt(goalInput, 10);

    // Validate input
    if (isNaN(newGoal) || newGoal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
      setGoalInput(goal.toString());
      return;
    }

    if (newGoal > 10000) {
      Alert.alert('Invalid Input', 'Daily goal cannot exceed 10,000ml.');
      setGoalInput(goal.toString());
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setGoal(newGoal);
      Alert.alert('Success', `Daily goal updated to ${newGoal.toLocaleString()}ml`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal. Please try again.');
      setGoalInput(goal.toString());
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all water tracking data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await clearWaterData();
              await refresh(); // Refresh to update UI
              Alert.alert('Success', 'All data has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleSelectInterval = async (value: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setReminderInterval(value);
      setShowDropdown(false);

      // Calculate notifications based on interval
      const intervalLabel = REMINDER_INTERVALS.find((item) => item.value === value)?.label || `${value} minutes`;

      // Calculate wake-sleep duration in minutes
      const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
      const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
      const wakeMinutes = wakeHour * 60 + wakeMin;
      const sleepMinutes = sleepHour * 60 + sleepMin;
      const totalMinutes = sleepMinutes > wakeMinutes
        ? sleepMinutes - wakeMinutes
        : (24 * 60 - wakeMinutes) + sleepMinutes;

      const notificationCount = Math.floor(totalMinutes / value);
      const glassSize = Math.ceil(goal / notificationCount);

      // Schedule notifications
      try {
        await scheduleWaterReminders(goal, glassSize, wakeTime, sleepTime);
        Alert.alert(
          'Success',
          `Notifications scheduled!\n\n• ${notificationCount} reminders per day\n• Every ${intervalLabel}\n• ${glassSize}ml per reminder`
        );
      } catch (scheduleError) {
        Alert.alert('Success', `Reminder interval updated to ${intervalLabel}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder interval. Please try again.');
    }
  };

  const handleSaveWakeTime = async () => {
    // Validate time format (HH:mm)
    if (!TIME_REGEX.test(wakeTimeInput)) {
      Alert.alert('Invalid Input', 'Please enter time in HH:mm format (e.g., 07:00)');
      setWakeTimeInput(wakeTime);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setWakeTime(wakeTimeInput);

      // Calculate glass size based on reminder interval
      const [wakeHour, wakeMin] = wakeTimeInput.split(':').map(Number);
      const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
      const wakeMinutes = wakeHour * 60 + wakeMin;
      const sleepMinutes = sleepHour * 60 + sleepMin;
      const totalMinutes = sleepMinutes > wakeMinutes
        ? sleepMinutes - wakeMinutes
        : (24 * 60 - wakeMinutes) + sleepMinutes;

      const notificationCount = Math.floor(totalMinutes / reminderInterval);
      const glassSize = Math.ceil(goal / notificationCount);

      // Schedule notifications with updated wake time
      try {
        await scheduleWaterReminders(goal, glassSize, wakeTimeInput, sleepTime);
        Alert.alert('Success', `Wake time updated to ${wakeTimeInput} and ${notificationCount} notifications scheduled`);
      } catch (scheduleError) {
        Alert.alert('Success', `Wake time updated to ${wakeTimeInput}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update wake time. Please try again.');
      setWakeTimeInput(wakeTime);
    }
  };

  // Helper function to scroll input into view
  const scrollToInput = (containerRef: React.RefObject<View | null>) => {
    if (!containerRef.current || !scrollViewRef.current) return;

    // Use a longer delay to ensure keyboard is fully shown
    setTimeout(() => {
      containerRef.current?.measure((_x, _y, _width, _height, _pageX, pageY) => {
        // Scroll to show the input with some padding above
        scrollViewRef.current?.scrollTo({
          y: pageY - 150, // Add padding above input
          animated: true,
        });
      });
    }, 200);
  };

  const handleSaveSleepTime = async () => {
    // Validate time format (HH:mm)
    if (!TIME_REGEX.test(sleepTimeInput)) {
      Alert.alert('Invalid Input', 'Please enter time in HH:mm format (e.g., 22:00)');
      setSleepTimeInput(sleepTime);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setSleepTime(sleepTimeInput);

      // Calculate glass size based on reminder interval
      const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
      const [sleepHour, sleepMin] = sleepTimeInput.split(':').map(Number);
      const wakeMinutes = wakeHour * 60 + wakeMin;
      const sleepMinutes = sleepHour * 60 + sleepMin;
      const totalMinutes = sleepMinutes > wakeMinutes
        ? sleepMinutes - wakeMinutes
        : (24 * 60 - wakeMinutes) + sleepMinutes;

      const notificationCount = Math.floor(totalMinutes / reminderInterval);
      const glassSize = Math.ceil(goal / notificationCount);

      // Schedule notifications with updated sleep time
      try {
        await scheduleWaterReminders(goal, glassSize, wakeTime, sleepTimeInput);
        Alert.alert('Success', `Sleep time updated to ${sleepTimeInput} and ${notificationCount} notifications scheduled`);
      } catch (scheduleError) {
        Alert.alert('Success', `Sleep time updated to ${sleepTimeInput}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update sleep time. Please try again.');
      setSleepTimeInput(sleepTime);
    }
  };

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
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}>
        {/* Daily Goal Section */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Daily Water Goal</Text>
          <Text style={styles.sectionDescription}>
            Set your daily water intake target in milliliters (ml)
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Enter daily goal"
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.inputUnit}>ml</Text>
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveGoal}
            activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Save Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Interval Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Interval</Text>
          <Text style={styles.sectionDescription}>
            How often should you be reminded to drink water?
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowDropdown(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}>
            <Text style={styles.dropdownText}>
              {REMINDER_INTERVALS.find((item) => item.value === reminderInterval)?.label ||
                'Select interval'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Wake Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wake Time</Text>
          <Text style={styles.sectionDescription}>
            Set your wake up time (HH:mm format)
          </Text>
          <View 
            ref={wakeTimeInputContainerRef}
            style={styles.inputContainer}
            onLayout={() => {
              // Ensure input is visible when container is laid out
            }}>
            <TextInput
              ref={wakeTimeInputRef}
              style={styles.input}
              value={wakeTimeInput}
              onChangeText={setWakeTimeInput}
              placeholder="07:00"
              keyboardType="default"
              maxLength={5}
              onFocus={() => {
                scrollToInput(wakeTimeInputContainerRef);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveWakeTime}
            activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Save Wake Time</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Time</Text>
          <Text style={styles.sectionDescription}>
            Set your sleep time (HH:mm format)
          </Text>
          <View 
            ref={sleepTimeInputContainerRef}
            style={styles.inputContainer}
            onLayout={() => {
              // Ensure input is visible when container is laid out
            }}>
            <TextInput
              ref={sleepTimeInputRef}
              style={styles.input}
              value={sleepTimeInput}
              onChangeText={setSleepTimeInput}
              placeholder="22:00"
              keyboardType="default"
              maxLength={5}
              onFocus={() => {
                scrollToInput(sleepTimeInputContainerRef);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSleepTime}
            activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Save Sleep Time</Text>
          </TouchableOpacity>
        </View>

        {/* Reset Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Text style={styles.sectionDescription}>
            Permanently delete all water tracking data
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
            onPress={handleResetData}
            disabled={resetting}
            activeOpacity={0.7}>
            {resetting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.resetButtonText}>Reset All Data</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Reminder Interval</Text>
            {REMINDER_INTERVALS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalOption,
                  reminderInterval === item.value && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectInterval(item.value)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.modalOptionText,
                    reminderInterval === item.value && styles.modalOptionTextSelected,
                  ]}>
                  {item.label}
                </Text>
                {reminderInterval === item.value && (
                  <Text style={styles.modalOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowDropdown(false)}
              activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for keyboard
    flexGrow: 1,
    paddingTop: 0, 
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12, // Reduced from 16
    marginHorizontal: 16,
    padding: 16, // Reduced from 20
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  firstSection: {
    marginTop: 0, // No margin for first section
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3, // Reduced from 8
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 5, // Reduced from 16
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 5, // Reduced from 12
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  resetButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  modalOptionSelected: {
    backgroundColor: '#DBEAFE',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modalOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalOptionCheck: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
