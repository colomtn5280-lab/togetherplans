/**
 * CreateGroupScreen — §3f
 * Create a new group with name, description, type
 */
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE } from '@/constants';
import {
  DNButton,
  DNChip,
  DNInput,
  DNScreenHeader,
} from '@/components/ui';
import { groupsAPI } from '@/services/api';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GroupType = 'Couple' | 'Friends' | 'Family';
const GROUP_TYPES: GroupType[] = ['Couple', 'Friends', 'Family'];

export default function CreateGroupScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const [groupType, setGroupType] = useState<GroupType>('Couple');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      setNameError('Group name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await groupsAPI.create(name.trim(), description.trim() || undefined);
      const newGroup = res.data?.group ?? res.data;
      navigation.replace('GroupDetail', {
        groupId: newGroup?.id ?? 'new',
        groupName: newGroup?.name ?? name.trim(),
      });
    } catch (err: any) {
      setNameError(err?.response?.data?.error ?? 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <DNScreenHeader
        title="New group"
        rightElement={
          <DNButton
            label="Create"
            onPress={handleCreate}
            variant="primary"
            size="compact"
            loading={loading}
            disabled={!name.trim()}
          />
        }
      />

      {/* Cancel left — inject via absolute or header left */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cancel link */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: SPACING.lg, alignSelf: 'flex-start' }}
        >
          <Text style={[TYPE.button, { color: colors.ink2 }]}>Cancel</Text>
        </TouchableOpacity>

        {/* Group type chips */}
        <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 10 }]}>Group type</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: SPACING.lg, flexWrap: 'wrap' }}>
          {GROUP_TYPES.map((type, i) => (
            <DNChip
              key={type}
              label={type}
              selected={groupType === type}
              onPress={() => setGroupType(type)}
              index={i}
            />
          ))}
        </View>

        {/* Name input */}
        <DNInput
          label="Group name *"
          placeholder="e.g. Date nights ♥"
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (nameError) setNameError('');
          }}
          autoFocus
          error={nameError}
          returnKeyType="next"
        />

        {/* Description input */}
        <DNInput
          label="Description (optional)"
          placeholder="What's this group about?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 } as any}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
