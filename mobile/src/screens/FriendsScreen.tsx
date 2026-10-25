/**
 * FriendsScreen — DateMeUp connections hub
 *
 * Tabs: My Friends | Requests (badge) | Find People
 *
 * Flow:
 *   Find People → search by name → tap user → Send Request
 *   Requests    → Accept / Decline incoming requests
 *   My Friends  → tap friend → Add to Group (creates or selects a group)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOWS, SPACING, TYPE } from '@/constants';
import {
  DNAvatar,
  DNButton,
  DNScreenHeader,
  DNText,
} from '@/components/ui';
import { friendsAPI, usersApi, groupsAPI, invitationsAPI } from '@/services/api';
import type { Friend, FriendRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'friends' | 'requests' | 'find';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string; avatarUrl?: string }[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const [fl, rl] = await Promise.all([friendsAPI.list(), friendsAPI.requests()]);
      setFriends(fl.data.friends ?? []);
      setRequests(rl.data.requests ?? []);
      // Also load sent so we know which search results already have a pending request
      const sl = await friendsAPI.sent();
      setSentIds(new Set((sl.data.sent ?? []).map((r) => r.receiverId)));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  // Debounced user search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await usersApi.search(searchQuery.trim());
        // Filter out self and existing friends
        const friendIds = new Set(friends.map((f) => f.user.id));
        setSearchResults(
          (res.data ?? []).filter((u) => u.id !== user?.id && !friendIds.has(u.id))
        );
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, friends, user?.id]);

  const handleSendRequest = async (userId: string) => {
    setActioning((prev) => ({ ...prev, [userId]: true }));
    try {
      await friendsAPI.sendRequest(userId);
      setSentIds((prev) => new Set([...prev, userId]));
    } catch (e: any) {
      Alert.alert('Could not send request', e?.response?.data?.error ?? 'Try again.');
    } finally {
      setActioning((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    setActioning((prev) => ({ ...prev, [req.id]: true }));
    try {
      await friendsAPI.accept(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      loadFriends();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Try again.');
    } finally {
      setActioning((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const handleDecline = async (req: FriendRequest) => {
    setActioning((prev) => ({ ...prev, [req.id]: true }));
    try {
      await friendsAPI.decline(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Try again.');
    } finally {
      setActioning((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      `Remove ${friend.user.displayName}?`,
      'You can always add them again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsAPI.remove(friend.friendshipId);
              setFriends((prev) => prev.filter((f) => f.friendshipId !== friend.friendshipId));
            } catch {
              Alert.alert('Error', 'Could not remove friend. Try again.');
            }
          },
        },
      ]
    );
  };

  // Add friend to a group — find/create a group with them and navigate
  const handleAddToGroup = async (friend: Friend) => {
    try {
      // Find an existing group that contains only us + them
      const groupsRes = await groupsAPI.list();
      const groups = Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data?.groups ?? [];
      const existing = groups.find((g: any) => {
        const members: any[] = g.members ?? [];
        const memberIds = members.map((m: any) => m.userId);
        return (
          members.length === 2 &&
          memberIds.includes(user!.id) &&
          memberIds.includes(friend.user.id)
        );
      });

      if (existing) {
        navigation.navigate('GroupDetail', { groupId: existing.id, groupName: existing.name });
        return;
      }

      // Create a new group named after both of us
      const myFirst = user?.displayName?.split(' ')[0] ?? 'My';
      const theirFirst = friend.user.displayName.split(' ')[0];
      const name = `${myFirst} & ${theirFirst}`;
      const createRes = await groupsAPI.create(name);
      const newGroupId = createRes.data?.id ?? createRes.data?.group?.id;

      if (!newGroupId) {
        Alert.alert('Error', 'Could not create group. Try again.');
        return;
      }

      // Invite them by username/userId via invitation
      await invitationsAPI.create(newGroupId, 'USERNAME');
      // Navigate to the new group
      navigation.navigate('GroupDetail', { groupId: newGroupId, groupName: name });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Could not create group.');
    }
  };

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'friends', label: 'Friends', badge: undefined },
    { key: 'requests', label: 'Requests', badge: requests.length || undefined },
    { key: 'find', label: 'Find People' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DNScreenHeader
        title="Connections"
        onBack={() => navigation.goBack()}
      />

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: SPACING.gutter,
          paddingBottom: SPACING.sm,
          gap: SPACING.sm,
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 16,
                alignItems: 'center',
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.line,
                ...SHADOWS.card,
              }}
            >
              <Text style={[TYPE.buttonSm, { color: active ? colors.onPrimary : colors.ink }]}>
                {tab.label}
                {tab.badge ? ` (${tab.badge})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── My Friends ───────────────────────────────────────────────────── */}
        {activeTab === 'friends' && (
          <>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xl }} />
            ) : friends.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: SPACING.xl }}>
                <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>👋</Text>
                <DNText variant="title" color={colors.ink} style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
                  No connections yet
                </DNText>
                <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.lg }}>
                  Find people you know and add them as friends — then easily add them to any plan.
                </DNText>
                <DNButton
                  label="Find People"
                  variant="primary"
                  onPress={() => setActiveTab('find')}
                />
              </View>
            ) : (
              friends.map((friend) => (
                <View
                  key={friend.friendshipId}
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      padding: SPACING.md,
                      marginBottom: SPACING.sm,
                      gap: SPACING.sm,
                    },
                    SHADOWS.card,
                  ]}
                >
                  <DNAvatar name={friend.user.displayName} size={42} colorIndex={1} />
                  <DNText variant="rowLabel" color={colors.ink} style={{ flex: 1 }}>
                    {friend.user.displayName}
                  </DNText>
                  <DNButton
                    label="Plan date"
                    variant="primary"
                    size="compact"
                    onPress={() => handleAddToGroup(friend)}
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(friend)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingLeft: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: colors.ink2 }}>⋯</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ── Requests ─────────────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xl }} />
            ) : requests.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: SPACING.xl }}>
                <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>📬</Text>
                <DNText variant="title" color={colors.ink} style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
                  No pending requests
                </DNText>
                <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center' }}>
                  When someone adds you, you'll see their request here.
                </DNText>
              </View>
            ) : (
              requests.map((req) => {
                const name = req.sender?.displayName ?? 'Someone';
                const busy = actioning[req.id];
                return (
                  <View
                    key={req.id}
                    style={[
                      {
                        backgroundColor: colors.surface,
                        borderRadius: 18,
                        padding: SPACING.md,
                        marginBottom: SPACING.sm,
                      },
                      SHADOWS.card,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm }}>
                      <DNAvatar name={name} size={42} colorIndex={2} />
                      <View style={{ flex: 1 }}>
                        <DNText variant="rowLabel" color={colors.ink}>{name}</DNText>
                        <DNText variant="secondary" color={colors.ink2}>wants to connect</DNText>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                      <DNButton
                        label={busy ? '…' : 'Accept'}
                        variant="primary"
                        size="compact"
                        onPress={() => handleAccept(req)}
                        style={{ flex: 1 }}
                      />
                      <DNButton
                        label="Decline"
                        variant="secondary"
                        size="compact"
                        onPress={() => handleDecline(req)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── Find People ──────────────────────────────────────────────────── */}
        {activeTab === 'find' && (
          <>
            <View
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: 8,
                  marginBottom: SPACING.md,
                  gap: 8,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name…"
                placeholderTextColor={colors.ink2}
                style={{ flex: 1, color: colors.ink, fontSize: 14 }}
                autoCorrect={false}
                autoCapitalize="words"
              />
              {searching && <ActivityIndicator size="small" color={colors.primary} />}
              {!searching && searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: colors.ink2, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {searchQuery.trim().length < 2 && (
              <View style={{ alignItems: 'center', paddingTop: SPACING.lg }}>
                <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>🤝</Text>
                <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center' }}>
                  Type at least 2 characters to search for people you know.
                </DNText>
              </View>
            )}

            {searchResults.map((result) => {
              const alreadySent = sentIds.has(result.id);
              const busy = actioning[result.id];
              return (
                <View
                  key={result.id}
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 18,
                      padding: SPACING.md,
                      marginBottom: SPACING.sm,
                      gap: SPACING.sm,
                    },
                    SHADOWS.card,
                  ]}
                >
                  <DNAvatar name={result.displayName} size={42} colorIndex={0} />
                  <DNText variant="rowLabel" color={colors.ink} style={{ flex: 1 }}>
                    {result.displayName}
                  </DNText>
                  <DNButton
                    label={alreadySent ? 'Requested ✓' : busy ? 'Sending…' : 'Add Friend'}
                    variant={alreadySent ? 'secondary' : 'primary'}
                    size="compact"
                    onPress={() => !alreadySent && !busy && handleSendRequest(result.id)}
                  />
                </View>
              );
            })}

            {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: SPACING.lg }}>
                <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center' }}>
                  No users found for "{searchQuery}". They may not be on DateMeUp yet.
                </DNText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
