import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { groupsAPI } from '@/services/api';
import { Group, RootStackParamList } from '@/types';
import { COLORS, SPACING } from '@/constants';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function GroupsScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.list();
      setGroups(res.data);
    } catch {
      Alert.alert('Error', 'Could not load your plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchGroups(); }, []));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Plans</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptyText}>Create a group and invite your partner or friends to start planning.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('CreateGroup')}>
            <Text style={styles.emptyButtonText}>Create First Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: SPACING.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, paddingTop: SPACING.lg },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  cardDate: { fontSize: 12, color: COLORS.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  emptyButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
