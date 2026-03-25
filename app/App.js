import { useState, useCallback, useRef, useReducer } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
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
import TabBarBrushedMetalSweep from './components/TabBarBrushedMetalSweep';
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

/** Web demo: fixed portrait width (~Pixel Pro XL logical CSS px, e.g. 9/10 Pro XL class). */
const WEB_DEMO_MAX_WIDTH = 430;

function TabBarWithBrushedMetal(props) {
  const dimsRef = useRef({ w: 0, h: 0 });
  const [, bumpLayout] = useReducer((n) => n + 1, 0);
  return (
    <View
      style={styles.tabBarScanHost}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        const prev = dimsRef.current;
        if (width !== prev.w || height !== prev.h) {
          dimsRef.current = { w: width, h: height };
          bumpLayout();
        }
      }}
    >
      <BottomTabBar {...props} />
      <TabBarBrushedMetalSweep
        width={dimsRef.current.w}
        height={dimsRef.current.h}
      />
    </View>
  );
}

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
          tabBar={(tabBarProps) => <TabBarWithBrushedMetal {...tabBarProps} />}
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

function WebDemoFrame({ children }) {
  return (
    <View style={styles.webChrome}>
      <View style={[styles.webPhone, styles.webPhoneShadow]}>{children}</View>
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

  const appBody = (
    <>
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
    </>
  );

  return (
    <GestureHandlerRootView style={styles.appRoot}>
      <SafeAreaProvider>
        {Platform.OS === 'web' ? <WebDemoFrame>{appBody}</WebDemoFrame> : appBody}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1 },
  webChrome: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    alignItems: 'center',
    backgroundColor: '#070708',
  },
  webPhone: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_DEMO_MAX_WIDTH,
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  webPhoneShadow:
    Platform.OS === 'web'
      ? {
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.07), 0 20px 80px rgba(0,0,0,0.75)',
        }
      : {},
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
  tabBarScanHost: {
    position: 'relative',
  },
});
