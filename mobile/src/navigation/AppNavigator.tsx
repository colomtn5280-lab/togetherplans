/**
 * AppNavigator — DateNight v2
 * Custom floating dock tab bar, Onboarding flow, theme-aware header.
 */
import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Compass, User } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useDeepLink } from '@/hooks/useDeepLink';
import { usePushToken } from '@/hooks/usePushToken';
import { useNotificationTap } from '@/hooks/useNotificationTap';
import { useTheme } from '@/contexts/ThemeContext';
import { PlanBuilderProvider } from '@/contexts/PlanBuilderContext';
import PlanBuilderStrip from '@/components/PlanBuilderStrip';
import { COLORS, RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import { RootStackParamList } from '@/types';

// Auth screens
import WelcomeScreen from '@/screens/WelcomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';

// App screens
import GroupsScreen from '@/screens/GroupsScreen';
import GroupDetailScreen from '@/screens/GroupDetailScreen';
import CreateGroupScreen from '@/screens/CreateGroupScreen';
import InviteMembersScreen from '@/screens/InviteMembersScreen';
import ProposalDetailScreen from '@/screens/ProposalDetailScreen';
import CreateProposalScreen from '@/screens/CreateProposalScreen';
import SuggestionsScreen from '@/screens/SuggestionsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ShareCardScreen from '@/screens/ShareCardScreen';
import AfterDarkScreen from '@/screens/AfterDarkScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const ONBOARDED_KEY = 'hasOnboarded';

// ─── Custom Dock Tab Bar ───────────────────────────────────────────────────────
function DockTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const DOCK_H = 68;
  const bottom = insets.bottom + 32;

  const tabIcons: Record<string, (color: string, size: number) => React.ReactNode> = {
    Groups:      (c, s) => <Calendar color={c} size={s} strokeWidth={2} />,
    Suggestions: (c, s) => <Compass  color={c} size={s} strokeWidth={2} />,
    Profile:     (c, s) => <User     color={c} size={s} strokeWidth={2} />,
  };
  const tabLabels: Record<string, string> = {
    Groups:      'Plans',
    Suggestions: 'Discover',
    Profile:     'Profile',
  };

  return (
    <View
      style={[
        styles.dock,
        {
          bottom,
          backgroundColor: colors.surface,
          borderTopLeftRadius: RADII.dock.topLeft,
          borderTopRightRadius: RADII.dock.topRight,
          borderBottomRightRadius: RADII.dock.bottomRight,
          borderBottomLeftRadius: RADII.dock.bottomLeft,
          height: DOCK_H,
          ...SHADOWS.dock,
        },
      ]}
      pointerEvents="box-none"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = tabLabels[route.name] ?? route.name;
        const iconColor = isFocused ? colors.onPrimary : colors.ink2;
        const iconSize = 22;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            activeOpacity={0.85}
            style={[
              styles.tabItem,
              isFocused && {
                backgroundColor: colors.primary,
                height: 48,
                borderRadius: 24,
                paddingHorizontal: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              },
            ]}
          >
            {tabIcons[route.name]?.(iconColor, iconSize)}
            {isFocused ? (
              <Text
                style={{
                  fontFamily: 'Sora_700Bold',
                  fontSize: 13,
                  color: colors.onPrimary,
                }}
              >
                {label}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: 'DMSans_600SemiBold',
                  fontSize: 11,
                  color: colors.ink2,
                  marginTop: 2,
                }}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
  },
  tabItem: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <DockTabBar {...props} />}
      screenOptions={{
        headerTintColor: colors.primary,
        headerShown: false,
      }}
    >
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Plans' }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Authenticated side-effect hooks ──────────────────────────────────────────
function AuthenticatedHooks() {
  useDeepLink();
  usePushToken();
  useNotificationTap();
  return null;
}

// ─── Root Navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setHasOnboarded(v === '1'));
  }, [user]);

  if (isLoading || (user && hasOnboarded === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <PlanBuilderProvider>
      <NavigationContainer>
        <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontFamily: 'Sora_700Bold', fontSize: 17, color: colors.ink },
        }}
      >
        {!user ? (
          // ── Auth stack ──────────────────────────────────────────────────────
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : (
          // ── Authenticated stack ─────────────────────────────────────────────
          <>
            {/* Show onboarding first time after register */}
            {!hasOnboarded ? (
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ headerShown: false, gestureEnabled: false }}
              />
            ) : null}
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupDetail"
              component={GroupDetailScreen}
              options={({ route }) => ({ title: route.params.groupName })}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{ title: 'New Plan' }}
            />
            <Stack.Screen
              name="InviteMembers"
              component={InviteMembersScreen}
              options={{ title: 'Invite People' }}
            />
            <Stack.Screen
              name="ProposalDetail"
              component={ProposalDetailScreen}
              options={{ title: 'Proposal' }}
            />
            <Stack.Screen
              name="CreateProposal"
              component={CreateProposalScreen}
              options={{ title: 'New Proposal' }}
            />
            <Stack.Screen
              name="Suggestions"
              component={SuggestionsScreen}
              options={{ title: 'Discover Activities' }}
            />
            <Stack.Screen
              name="ShareCard"
              component={ShareCardScreen}
              options={{ title: 'Share', headerShown: false }}
            />
            <Stack.Screen
              name="AfterDark"
              component={AfterDarkScreen}
              options={{ title: 'After Dark 🌙', headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
      {user && <AuthenticatedHooks />}
      <PlanBuilderStrip />
    </NavigationContainer>
    </PlanBuilderProvider>
  );
}
