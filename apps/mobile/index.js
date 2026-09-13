import { AppRegistry } from 'react-native';
import * as RNScreens from 'react-native-screens';

if (RNScreens) {
  if (!RNScreens.compatibilityFlags) {
    try {
      RNScreens.compatibilityFlags = {};
    } catch (e) {}
  }
  if (!RNScreens.ScreenStackItem) {
    try {
      RNScreens.ScreenStackItem = RNScreens.Screen || RNScreens.default;
    } catch (e) {}
  }
}

import App from './App';

AppRegistry.registerComponent('InfinityHubMobile', () => App);
