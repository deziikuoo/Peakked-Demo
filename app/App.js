import { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from './utils/safeArea';
import SplashScreen from './screens/SplashScreen';
import LoadingScreen from './screens/LoadingScreen';
import PopularScreen from './screens/PopularScreen';
import ChatScreen from './screens/ChatScreen';
import CompareScreen from './screens/CompareScreen';
import MyGamesScreen from './screens/MyGamesScreen';
import NexaScreen from './screens/NexaScreen';
import AppBackground from './components/AppBackground';
import { GameCacheProvider } from './context/GameCacheContext';
import { WatchlistProvider, useWatchlist } from './context/WatchlistContext';
import { themes } from './theme/colors';
import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';
import {
  Inter_400Regular,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const Tab = createBottomTabNavigator();
const colors = themes.darkNeon;

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

function MainTabs() {
  const { watchlist } = useWatchlist();
  return (
    <View style={styles.tabsWrapper}>
      <AppBackground />
      <View style={styles.tabContent}>
        <Tab.Navigator
          screenOptions={({ navigation }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
            sceneStyle: [
              styles.transparentScene,
              Platform.OS === 'web' && !navigation.isFocused() && { display: 'none' },
            ].filter(Boolean),
          })}
        >
      <Tab.Screen
        name="Popular"
        component={PopularScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Nexa"
        component={NexaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Compare"
        component={CompareScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-compare" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyGames"
        component={MyGamesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          tabBarLabel: 'My Games',
          tabBarBadge: watchlist.length > 0 ? watchlist.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary },
        }}
      />
        </Tab.Navigator>
      </View>
    </View>
  );
}

export default function App() {
  const [phase, setPhase] = useState('splash'); // 'splash' | 'loading' | 'ready'

  const [nexaFontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    Inter_400Regular,
    Inter_700Bold,
  });

  const handleSplashFadeComplete = useCallback(() => setPhase('ready'), []);

  return (
    <GestureHandlerRootView style={styles.appRoot}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {phase === 'splash' && (
          <SplashScreen onFadeComplete={handleSplashFadeComplete} />
        )}
        {phase === 'ready' && (
          <GameCacheProvider>
            <WatchlistProvider>
            <NavigationContainer theme={navTheme}>
              {nexaFontsLoaded ? (
                <MainTabs />
              ) : (
                <View style={styles.appRoot}>
                  <LoadingScreen />
                </View>
              )}
            </NavigationContainer>
            </WatchlistProvider>
          </GameCacheProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1 },
  tabsWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContent: {
    flex: 1,
  },
  transparentScene: {
    backgroundColor: 'transparent',
  },
});
