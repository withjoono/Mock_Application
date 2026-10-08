import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './lib/contexts/AuthContext';
import MainScreen from './screens/MainScreen';
import StandardScoreInputScreen from './screens/StandardScoreInputScreen';
import CollegeSelectScreen from './screens/CollegeSelectScreen';
import SupportStatusScreen from './screens/SupportStatusScreen';
import SupportCutScreen from './screens/SupportCutScreen';
import StrategyScreen from './screens/StrategyScreen';
import SupportStrategyScreen from './screens/SupportStrategyScreen';
import MockApplyScreen from './screens/MockApplyScreen';
import ScoreAnalysisScreen from './screens/ScoreAnalysisScreen';
import SeasonApplyScreen from './screens/SeasonApplyScreen';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={MainScreen} />
      <Stack.Screen name="ScoreInput" component={StandardScoreInputScreen} />
      <Stack.Screen name="CollegeSelect" component={CollegeSelectScreen} />
      <Stack.Screen name="SupportStatus" component={SupportStatusScreen} />
      <Stack.Screen name="SupportCut" component={SupportCutScreen} />
      <Stack.Screen name="Strategy" component={StrategyScreen} />
      <Stack.Screen name="SupportStrategy" component={SupportStrategyScreen} />
      <Stack.Screen name="MockApply" component={MockApplyScreen} />
      <Stack.Screen name="ScoreAnalysis" component={ScoreAnalysisScreen} />
      <Stack.Screen name="SeasonApply" component={SeasonApplyScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});