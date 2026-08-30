import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { groupsAPI } from '@/services/api';
import { RootStackParamList } from '@/types';
import { COLORS, SPACING } from '@/constants';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreateGroup'> };

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Group name is required');
    setLoading(true);
    try {
      const res = await groupsAPI.create(name.trim(), description.trim() || undefined);
      navigation.replace('GroupDetail', { groupId: res.data.id, groupName: res.data.name });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Plan Name *</Text>
      <TextInput style={styles.input} placeholder="Date night, Weekend trip, Dinner plans..."
        value={name} onChangeText={setName} placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="What's this plan about?"
        value={description} onChangeText={setDescription} multiline numberOfLines={3}
        placeholderTextColor={COLORS.textSecondary} />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Plan</Text>}
      </TouchableOpacity>
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
});
