import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants';
import { RootStackParamList } from '@/types';

// Auth screens
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';

// App screens
import GroupsScreen from '@/screens/GroupsScreen';
import GroupDetailScreen from '@/screens/GroupDetailScreen';
import CreateGroupScreen from '@/screens/CreateGroupScreen';
import InviteMembersScreen from '@/screens/InviteMembersScreen';
import ProposalDetailScreen from '@/screens/ProposalDetailScreen';
import CreateProposalScreen from '@/screens/CreateProposalScreen';
import SuggestionsScreen from '@/screens/SuggestionsScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Plans' }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={({ route }) => ({ title: route.params.groupName })} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Plan' }} />
            <Stack.Screen name="InviteMembers" component={InviteMembersScreen} options={{ title: 'Invite People' }} />
            <Stack.Screen name="ProposalDetail" component={ProposalDetailScreen} options={{ title: 'Proposal' }} />
            <Stack.Screen name="CreateProposal" component={CreateProposalScreen} options={{ title: 'New Proposal' }} />
            <Stack.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Discover Activities' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
