import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widget-task-handler';

// Register the widget task handler
registerWidgetTaskHandler(widgetTaskHandler);

// Import expo-router entry point
import 'expo-router/entry';
