import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import {
  FlexWidget,
  TextWidget,
  ColorProp,
} from 'react-native-android-widget';

const STORAGE_KEY = '@water_tracker_data';

interface WaterData {
  entries: Record<string, number>;
  goal: number;
}

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getWaterData(): Promise<WaterData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading water data:', error);
  }
  return { entries: {}, goal: 3500 };
}

async function saveWaterData(data: WaterData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving water data:', error);
  }
}

async function addWaterToStorage(amount: number): Promise<number> {
  const data = await getWaterData();
  const today = getToday();

  if (!data.entries[today]) {
    data.entries[today] = 0;
  }

  data.entries[today] += amount;
  await saveWaterData(data);

  return data.entries[today];
}

async function getTodayTotal(): Promise<{ amount: number; goal: number }> {
  const data = await getWaterData();
  const today = getToday();
  return {
    amount: data.entries[today] || 0,
    goal: data.goal || 3500,
  };
}

// Simple Water Widget Component
function WaterWidgetUI({ todayAmount, goal }: { todayAmount: number; goal: number }) {
  const progress = Math.min(Math.round((todayAmount / goal) * 100), 100);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff' as ColorProp,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget
          text="💧 Water Tracker"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1f2937' as ColorProp,
          }}
        />
      </FlexWidget>

      {/* Progress Text */}
      <TextWidget
        text={`${todayAmount}ml / ${goal}ml (${progress}%)`}
        style={{
          fontSize: 14,
          color: '#3b82f6' as ColorProp,
          fontWeight: 'bold',
        }}
      />

      {/* Buttons Row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: '#dbeafe' as ColorProp,
            borderRadius: 8,
            padding: 12,
            flex: 1,
            marginRight: 4,
            alignItems: 'center',
          }}
          clickAction="ADD_WATER"
          clickActionData={{ amount: '100' }}
        >
          <TextWidget
            text="+100ml"
            style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' as ColorProp }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#dbeafe' as ColorProp,
            borderRadius: 8,
            padding: 12,
            flex: 1,
            marginHorizontal: 4,
            alignItems: 'center',
          }}
          clickAction="ADD_WATER"
          clickActionData={{ amount: '250' }}
        >
          <TextWidget
            text="+250ml"
            style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' as ColorProp }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#dbeafe' as ColorProp,
            borderRadius: 8,
            padding: 12,
            flex: 1,
            marginLeft: 4,
            alignItems: 'center',
          }}
          clickAction="ADD_WATER"
          clickActionData={{ amount: '500' }}
        >
          <TextWidget
            text="+500ml"
            style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' as ColorProp }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps
): Promise<React.ReactElement> {
  const { clickAction, clickActionData } = props;

  // Handle click action - add water
  if (clickAction === 'ADD_WATER' && clickActionData?.amount) {
    const amount = parseInt(String(clickActionData.amount), 10);
    if (amount > 0) {
      await addWaterToStorage(amount);
      console.log(`Widget: Added ${amount}ml water`);
    }
  }

  // Get current data
  const { amount: todayAmount, goal } = await getTodayTotal();

  // Return widget UI
  return <WaterWidgetUI todayAmount={todayAmount} goal={goal} />;
}
