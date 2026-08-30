import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { groupsAPI, proposalsAPI } from '@/services/api';
import { Group, Proposal, RootStackParamList } from '@/types';
import { COLORS, SPACING } from '@/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
  route: RouteProp<RootStackParamList, 'GroupDetail'>;
};

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId, groupName } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [groupRes] = await Promise.all([groupsAPI.get(groupId)]);
      setGroup(groupRes.data.group);
      setProposals(groupRes.data.proposals || []);
    } catch {
      Alert.alert('Error', 'Could not load group');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [groupId]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const statusColor = (s: string) => {
    if (s === 'ACCEPTED') return COLORS.success;
    if (s === 'REJECTED') return COLORS.error;
    if (s === 'COUNTERED') return COLORS.warning;
    return COLORS.primary;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={proposals}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={() => (
          <View style={styles.headerSection}>
            {group?.description && <Text style={styles.description}>{group.description}</Text>}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateProposal', { groupId })}>
                <Text style={styles.actionBtnText}>+ Proposal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => navigation.navigate('InviteMembers', { groupId })}>
                <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Invite</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Proposals</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No proposals yet. Create one to get started!</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProposalDetail', { proposalId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            {item.description && <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>}
            <Text style={styles.cardMeta}>{item.options.length} options · {new Date(item.createdAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: SPACING.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { marginBottom: SPACING.md },
  description: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.sm, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  actionBtnTextSecondary: { color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 15 },
});
