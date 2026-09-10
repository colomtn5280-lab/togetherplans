import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { proposalsAPI } from '@/services/api';
import { Suggestion, RootStackParamList } from '@/types';
import { COLORS, SPACING } from '@/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateProposal'>;
  route: RouteProp<RootStackParamList, 'CreateProposal'>;
};

export default function CreateProposalScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await proposalsAPI.suggestions();
      // API returns a plain array
      setSuggestions(Array.isArray(res.data) ? res.data : []);
    } catch {
      Alert.alert('Error', 'Could not load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Proposal title is required');
    setLoading(true);
    try {
      const res = await proposalsAPI.create(
        groupId, title.trim(), description.trim() || undefined,
        scheduledFor.trim() || undefined,
      );
      navigation.replace('ProposalDetail', { proposalId: res.data.id });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not create proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Proposal Title *</Text>
      <TextInput style={styles.input} placeholder="Dinner this weekend, Movie night..."
        value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="What are you thinking?"
        value={description} onChangeText={setDescription} multiline numberOfLines={3}
        placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.label}>Date / Time (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. Saturday evening, Dec 14"
        value={scheduledFor} onChangeText={setScheduledFor}
        placeholderTextColor={COLORS.textSecondary} />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Proposal</Text>}
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.suggestionsHeader}>
        <Text style={styles.sectionTitle}>Need ideas?</Text>
        <TouchableOpacity onPress={loadSuggestions} disabled={loadingSuggestions}>
          <Text style={styles.loadLink}>{loadingSuggestions ? 'Loading...' : 'Load suggestions'}</Text>
        </TouchableOpacity>
      </View>

      {suggestions.map((s, i) => (
        <TouchableOpacity key={`${s.name}-${i}`} style={styles.suggestionCard} onPress={() => {
          setTitle(s.name);
          setDescription(s.description);
        }}>
          <Text style={styles.suggestionTitle}>{s.name}</Text>
          <Text style={styles.suggestionMeta}>{s.category}{s.address ? ` · ${s.address}` : ''}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.surface },
  multiline: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  suggestionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  loadLink: { color: COLORS.primary, fontWeight: '600' },
  suggestionCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  suggestionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  suggestionMeta: { fontSize: 13, color: COLORS.textSecondary },
});
