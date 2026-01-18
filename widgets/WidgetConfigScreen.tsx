'use no memo'; // Disable React Compiler for widget code

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  FlexWidget,
  TextWidget,
  WidgetConfigurationScreenProps,
} from 'react-native-android-widget';

function getInitialWidgetUI() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#E0F2FE',
        borderRadius: 24,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'match_parent',
        }}
      >
        {/* Minus Button */}
        <FlexWidget
          style={{
            width: 70,
            height: 70,
            backgroundColor: '#94A3B8',
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="−"
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>

        {/* Battery */}
        <FlexWidget
          style={{
            flex: 1,
            marginHorizontal: 12,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'match_parent',
          }}
        >
          <FlexWidget
            style={{
              width: 32,
              height: 10,
              backgroundColor: '#94A3B8',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          />
          <FlexWidget
            style={{
              width: 80,
              flex: 1,
              backgroundColor: '#94A3B8',
              borderRadius: 12,
              padding: 4,
              flexDirection: 'column',
            }}
          >
            <FlexWidget
              style={{
                width: 'match_parent',
                flex: 95,
                backgroundColor: '#E2E8F0',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextWidget
                text="0%"
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1E40AF',
                }}
              />
            </FlexWidget>
            <FlexWidget
              style={{
                width: 'match_parent',
                flex: 5,
                backgroundColor: '#3B82F6',
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Plus Button */}
        <FlexWidget
          style={{
            width: 70,
            height: 70,
            backgroundColor: '#1E40AF',
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="+"
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          backgroundColor: '#1E3A5F',
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 6,
          marginTop: 8,
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="0 ml / 3500 ml"
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
        <TextWidget
          text="(Daily Goal)"
          style={{
            fontSize: 10,
            color: '#93C5FD',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export function WidgetConfigScreen({
  widgetInfo,
  setResult,
  renderWidget,
}: WidgetConfigurationScreenProps) {
  console.log('[WidgetConfig] Configuring:', widgetInfo?.widgetName);
  renderWidget(getInitialWidgetUI());
  setTimeout(() => setResult('ok'), 300);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>Adding widget...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
