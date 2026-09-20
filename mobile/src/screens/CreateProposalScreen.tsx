/**
 * CreateProposalScreen — 3i
 * HANDOFF_README spec: full redesign
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE, SHADOWS } from '@/constants';
import {
  DNButton,
  DNInput,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { proposalsAPI } from '@/services/api';
import type { RootStackParamList } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'CreateProposal'>;

// Random emoji per index
const CATEGORY_EMOJIS = ['🍕', '🍣', '🎭', '🎬', '🌿', '🎵', '🍷', '🏃', '🎨', '😂'];

interface OptionRow {
  id: string;
  name: string;
  category: string;
  address: string;
  emoji: string;
}

function makeOption(): OptionRow {
  return {
    id: String(Date.now() + Math.random()),
    name: '',
    category: '',
    address: '',
    emoji: CATEGORY_EMOJIS[Math.floor(Math.random() * CATEGORY_EMOJIS.length)],
  };
}

export default function CreateProposalScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { groupId } = route.params;

  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [options, setOptions] = useState<OptionRow[]>([makeOption(), makeOption(), makeOption()]);
  const [titleError, setTitleError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 5) {
      setOptions((prev) => [...prev, makeOption()]);
    }
  };

  const deleteOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, field: keyof OptionRow, value: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleFromDiscover = () => {
    navigation.navigate('Suggestions', { groupId });
  };

  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    } else {
      setTitleError('');
    }
    if (options.length < 3) {
      setOptionsError('Add at least 3 options');
      valid = false;
    } else if (options.length > 5) {
      setOptionsError('Maximum 5 options');
      valid = false;
    } else {
      setOptionsError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await proposalsAPI.create(groupId, title.trim(), undefined, selectedDate.toISOString());
      navigation.goBack();
    } catch (e) {
      console.warn('Failed to create proposal', e);
    } finally {
      setSubmitting(false);
    }
  };

  const rowStyle: object = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  };

  const dateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const timeLabel = selectedDate.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <DNScreenHeader
        title="New proposal"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <DNInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What are we planning?"
          error={titleError}
        />

        {/* Date row */}
        <TouchableOpacity
          style={rowStyle}
          onPress={() => {
            // On a real device, you'd open a native date picker here.
            // Using a basic increment for demo purposes.
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 12 }}>📅</Text>
          <View style={{ flex: 1 }}>
            <DNText variant="rowLabel" color={colors.ink}>Date</DNText>
            <DNText variant="secondary" color={colors.ink2}>{dateLabel}</DNText>
          </View>
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>›</Text>
        </TouchableOpacity>

        {/* Time row */}
        <View style={[rowStyle, { marginBottom: SPACING.lg }]}>
          <Text style={{ fontSize: 18, marginRight: 12 }}>🕐</Text>
          <View style={{ flex: 1 }}>
            <DNText variant="rowLabel" color={colors.ink}>Time</DNText>
            <DNText variant="secondary" color={colors.ink2}>{timeLabel}</DNText>
          </View>
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>›</Text>
        </View>

        {/* Options header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
          <DNText variant="section" color={colors.ink2} style={{ flex: 1 }}>
            Options
          </DNText>
          <DNSticker
            label={`${options.length} of 5`}
            color={colors.limeSoft}
            textColor={colors.lime}
            rotationIndex={1}
          />
        </View>

        {optionsError ? (
          <DNText variant="secondary" color={colors.error} style={{ marginBottom: SPACING.sm }}>
            {optionsError}
          </DNText>
        ) : null}

        {/* Option rows */}
        {options.map((opt) => (
          <View
            key={opt.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              padding: SPACING.md,
              marginBottom: SPACING.sm,
              ...SHADOWS.card,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Emoji blob */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
              </View>

              {/* Inline name input */}
              <TextInput
                value={opt.name}
                onChangeText={(v) => updateOption(opt.id, 'name', v)}
                placeholder="Option name"
                placeholderTextColor={colors.ink2}
                style={[TYPE.rowLabel, { flex: 1, color: colors.ink }]}
              />

              {/* Delete menu */}
              <TouchableOpacity onPress={() => deleteOption(opt.id)} style={{ padding: 4 }}>
                <Text style={[TYPE.secondary, { color: colors.ink2, fontSize: 20 }]}>⋯</Text>
              </TouchableOpacity>
            </View>

            {(opt.category || opt.address) && (
              <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 4, marginLeft: 44 }}>
                {[opt.category, opt.address].filter(Boolean).join(' · ')}
              </DNText>
            )}
          </View>
        ))}

        {/* Add your own dashed row */}
        {options.length < 5 && (
          <TouchableOpacity
            onPress={addOption}
            style={{
              borderWidth: 1.5,
              borderColor: colors.line,
              borderStyle: 'dashed',
              borderRadius: 18,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            <DNText variant="secondary" color={colors.ink2}>+ Add your own</DNText>
          </TouchableOpacity>
        )}

        {/* From Discover button */}
        <DNButton
          label="✦ From Discover"
          variant="tonal"
          onPress={handleFromDiscover}
          style={{ marginBottom: SPACING.lg }}
        />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.bg,
          paddingHorizontal: SPACING.gutter,
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          paddingTop: SPACING.md,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <DNButton
          label="Send to group ♥"
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
