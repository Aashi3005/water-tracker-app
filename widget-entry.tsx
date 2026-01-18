'use no memo'; // Disable React Compiler for widget code

/**
 * Widget ko Android ko register karao
 * This file MUST be imported in index.js BEFORE expo-router/entry
 */
import { registerWidgetConfigurationScreen, registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widget-task-handler';
import { WidgetConfigScreen } from './widgets/WidgetConfigScreen';

console.log('[Widget Entry] Registering widget handlers...');

registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigScreen);

console.log('[Widget Entry] Registration complete!');

