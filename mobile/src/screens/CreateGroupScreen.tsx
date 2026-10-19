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
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE } from '@/constants';
import {
  DNButton,
  DNChip,
  DNInput,
  DNScreenHeader,
} from '@/components/ui';
import { groupsAPI } from '@/services/api';
import { requestATT } from '@/services/att';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GroupType = 'Couple' | 'Friends' | 'Family';
const GROUP_TYPES: GroupType[] = ['Couple', 'Friends', 'Family'];

export default function CreateGroupScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [groupType, setGroupType] = useState<GroupType>('Couple');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      setNameError(t('createGroup.nameRequired'));
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    const typeMap: Record<GroupType, string> = {
      Couple: 'COUPLE',
      Friends: 'FRIENDS',
      Family: 'FAMILY',
    };
    try {
      const res = await groupsAPI.create(
        name.trim(),
        description.trim() || undefined,
        typeMap[groupType],
      );
      const newGroup = res.data?.group ?? res.data;
      // Post-value ATT prompt: user just created their first group.
      // Fire and forget — don't block navigation on the result.
      requestATT().catch(() => {});
      navigation.replace('GroupDetail', {
        groupId: newGroup?.id ?? 'new',
        groupName: newGroup?.name ?? name.trim(),
      });
    } catch (err: any) {
      setNameError(err?.response?.data?.error ?? t('createGroup.failedCreate'));
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
        title={t('createGroup.title')}
        rightElement={
          <DNButton
            label={t('createGroup.create')}
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
          <Text style={[TYPE.button, { color: colors.ink2 }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>

        {/* Group type chips */}
        <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 10 }]}>{t('createGroup.groupType')}</Text>
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
          label={t('createGroup.groupNameLabel')}
          placeholder={t('createGroup.namePlaceholder')}
          value={name}
          onChangeText={(tx) => {
            setName(tx);
            if (nameError) setNameError('');
          }}
          autoFocus
          error={nameError}
          returnKeyType="next"
        />

        {/* Description input */}
        <DNInput
          label={t('createGroup.descriptionLabel')}
          placeholder={t('createGroup.descriptionPlaceholder')}
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
