import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ClickableWidgetWrapper,
} from 'react-native-android-widget';

interface WaterWidgetProps {
  todayAmount: number;
  goal: number;
}

/**
 * Water Widget Component
 *
 * Displays on Android home screen with quick-add buttons.
 * Tapping a button adds water WITHOUT opening the app.
 */
export function WaterWidget({ todayAmount = 0, goal = 3500 }: WaterWidgetProps) {
  const progress = Math.min((todayAmount / goal) * 100, 100);
  const progressText = `${todayAmount}ml / ${goal}ml`;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="💧"
          style={{
            fontSize: 20,
            marginRight: 6,
          }}
        />
        <TextWidget
          text="Water Tracker"
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#111827',
          }}
        />
      </FlexWidget>

      {/* Progress */}
      <TextWidget
        text={progressText}
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: '#3B82F6',
          marginBottom: 4,
        }}
      />

      {/* Progress Bar Background */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 8,
          backgroundColor: '#E5E7EB',
          borderRadius: 4,
          marginBottom: 12,
        }}
      >
        {/* Progress Bar Fill */}
        <FlexWidget
          style={{
            width: `${progress}%` as any,
            height: 8,
            backgroundColor: '#3B82F6',
            borderRadius: 4,
          }}
        />
      </FlexWidget>

      {/* Quick Add Buttons */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <WaterButton amount={100} />
        <WaterButton amount={250} />
        <WaterButton amount={500} />
      </FlexWidget>
    </FlexWidget>
  );
}

/**
 * Individual water button component
 */
function WaterButton({ amount }: { amount: number }) {
  return (
    <ClickableWidgetWrapper
      clickAction="ADD_WATER"
      clickActionData={{ amount: amount.toString() }}
    >
      <FlexWidget
        style={{
          backgroundColor: '#EFF6FF',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={`+${amount}`}
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#3B82F6',
          }}
        />
        <TextWidget
          text="ml"
          style={{
            fontSize: 10,
            color: '#6B7280',
          }}
        />
      </FlexWidget>
    </ClickableWidgetWrapper>
  );
}

export default WaterWidget;
