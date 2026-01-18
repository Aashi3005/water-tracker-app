const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Android Google Assistant App Actions
 *
 * This plugin:
 * 1. Creates actions.xml file for Google Assistant
 * 2. Adds meta-data to AndroidManifest.xml
 */

const ACTIONS_XML = `<?xml version="1.0" encoding="utf-8"?>
<actions>
  <!-- Custom action for logging water with amount -->
  <action intentName="actions.intent.OPEN_APP_FEATURE">
    <fulfillment urlTemplate="watertracker://log-water{?amount}">
      <parameter-mapping
        intentParameter="feature"
        urlParameter="amount" />
    </fulfillment>
  </action>
</actions>
`;

function withAndroidAppActions(config) {
  // Step 1: Create actions.xml file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Write actions.xml
      const actionsPath = path.join(xmlDir, 'actions.xml');
      fs.writeFileSync(actionsPath, ACTIONS_XML.trim());

      console.log('Created actions.xml for Google Assistant App Actions');

      return config;
    },
  ]);

  // Step 2: Add meta-data to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];

    if (mainApplication) {
      // Initialize meta-data array if not exists
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      // Check if already added
      const alreadyExists = mainApplication['meta-data'].some(
        (item) => item.$?.['android:name'] === 'com.google.android.actions'
      );

      if (!alreadyExists) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.google.android.actions',
            'android:resource': '@xml/actions',
          },
        });
        console.log('Added App Actions meta-data to AndroidManifest.xml');
      }
    }

    return config;
  });

  return config;
}

module.exports = withAndroidAppActions;
