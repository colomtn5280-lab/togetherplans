/**
 * CreateProposalScreen — category-picker redesign
 * Pick 3–5 categories (or custom) → send to group.
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { CATEGORIES, CUSTOM_CATEGORY, Category } from '@/constants/categories';
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

// ── Selected option chip ───────────────────────────────────────────────────────
function SelectedChip({
  label,
  onRemove,
  colors,
}: {
  label: string;
  onRemove: () => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        borderRadius: 20,
        paddingVertical: 6,
        paddingLeft: 12,
        paddingRight: 8,
        marginRight: SPACING.xs,
        marginBottom: SPACING.xs,
      }}
    >
      <DNText variant="secondary" color={colors.primary} style={{ marginRight: 6 }}>
        {label}
      </DNText>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Category card ──────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  selected,
  disabled,
  onPress,
  colors,
}: {
  cat: Category;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled && !selected}
      activeOpacity={0.75}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderRadius: 16,
          padding: SPACING.md,
          marginBottom: SPACING.sm,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : colors.line,
          opacity: disabled && !selected ? 0.45 : 1,
        },
        SHADOWS.card,
      ]}
    >
      {/* Emoji */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: selected ? colors.primary : colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}
      >
        <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <DNText variant="rowLabel" color={selected ? colors.primary : colors.ink}>
          {cat.name}
        </DNText>
        <DNText variant="secondary" color={selected ? colors.primary : colors.ink2} style={{ marginTop: 2 }}>
          {cat.tagline}
        </DNText>
      </View>

      {/* Checkmark */}
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: SPACING.sm,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreateProposalScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { groupId } = route.params;

  // Apply incoming suggestion from Suggestions screen
  const incomingSuggestion = route.params?.addSuggestion;
  const appliedSuggestionRef = React.useRef<string | null>(null);

  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateInput, setDateInput] = useState('');

  // Selected category names (max 5)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Custom option
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const [titleError, setTitleError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apply incoming suggestion from Discover
  React.useEffect(() => {
    if (incomingSuggestion && appliedSuggestionRef.current !== incomingSuggestion.name) {
      appliedSuggestionRef.current = incomingSuggestion.name;
      const label = incomingSuggestion.name;
      setSelectedCategories((prev) => {
        if (prev.includes(label) || prev.length >= 5) return prev;
        return [...prev, label];
      });
    }
  }, [incomingSuggestion]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, name];
    });
  };

  const removeCategory = (name: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== name));
  };

  const handleAddCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (selectedCategories.includes(trimmed) || selectedCategories.length >= 5) return;
    setSelectedCategories((prev) => [...prev, trimmed]);
    setCustomText('');
    setShowCustomInput(false);
  };

  const handleFromDiscover = () => {
    navigation.navigate('Suggestions', { groupId, returnTo: 'CreateProposal' });
  };

  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    } else {
      setTitleError('');
    }
    if (selectedCategories.length < 3) {
      setOptionsError('Pick at least 3 options');
      valid = false;
    } else if (selectedCategories.length > 5) {
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
      const options = selectedCategories.map((name) => {
        const cat = CATEGORIES.find((c) => c.name === name);
        return {
          name,
          category: cat ? name : 'Custom',
          description: cat?.tagline ?? '',
          address: '',
        };
      });
      const res = await proposalsAPI.create(groupId, title.trim(), selectedDate.toISOString(), options);
      navigation.navigate('ProposalDetail', { proposalId: res.data.id });
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

  const atMax = selectedCategories.length >= 5;

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
            setDateInput(selectedDate.toISOString().slice(0, 16));
            setShowDateModal(true);
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 12 }}>📅</Text>
          <View style={{ flex: 1 }}>
            <DNText variant="rowLabel" color={colors.ink}>Date &amp; Time</DNText>
            <DNText variant="secondary" color={colors.ink2}>{dateLabel} · {timeLabel}</DNText>
          </View>
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>›</Text>
        </TouchableOpacity>

        {/* Date/time picker modal */}
        <Modal
          transparent
          animationType="slide"
          visible={showDateModal}
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: SPACING.xl,
              }}
            >
              <DNText variant="heading" color={colors.ink} style={{ marginBottom: SPACING.md }}>
                Set date &amp; time
              </DNText>
              <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.sm }}>
                Enter in ISO format: YYYY-MM-DDTHH:MM
              </DNText>
              <TextInput
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="2025-06-01T19:00"
                placeholderTextColor={colors.ink2}
                style={[
                  TYPE.body,
                  {
                    color: colors.ink,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 12,
                    padding: SPACING.md,
                    marginBottom: SPACING.lg,
                  },
                ]}
                autoCapitalize="none"
                keyboardType="ascii-capable"
              />
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity
                  onPress={() => setShowDateModal(false)}
                  style={{
                    flex: 1,
                    padding: SPACING.md,
                    borderRadius: 12,
                    backgroundColor: colors.line,
                    alignItems: 'center',
                  }}
                >
                  <Text style={[TYPE.body, { color: colors.ink }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const parsed = new Date(dateInput);
                    if (!isNaN(parsed.getTime())) {
                      setSelectedDate(parsed);
                    }
                    setShowDateModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: SPACING.md,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={[TYPE.body, { color: colors.onPrimary }]}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Options section header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm }}>
          <DNText variant="section" color={colors.ink2} style={{ flex: 1 }}>
            Pick what you&apos;re open to
          </DNText>
          <DNSticker
            label={`${selectedCategories.length} / 5`}
            color={selectedCategories.length >= 3 ? colors.limeSoft : colors.primarySoft}
            textColor={selectedCategories.length >= 3 ? colors.lime : colors.primary}
            rotationIndex={1}
          />
        </View>

        <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.md }}>
          Choose 3–5 date vibes for your group to vote on.
        </DNText>

        {/* Selected chips */}
        {selectedCategories.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
            {selectedCategories.map((name) => (
              <SelectedChip
                key={name}
                label={name}
                onRemove={() => removeCategory(name)}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* Options error */}
        {optionsError ? (
          <DNText variant="secondary" color={colors.error} style={{ marginBottom: SPACING.sm }}>
            {optionsError}
          </DNText>
        ) : null}

        {/* Category cards */}
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.name}
            cat={cat}
            selected={selectedCategories.includes(cat.name)}
            disabled={atMax}
            onPress={() => toggleCategory(cat.name)}
            colors={colors}
          />
        ))}

        {/* Custom option — always LAST */}
        {showCustomInput ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: SPACING.md,
              marginBottom: SPACING.sm,
              borderWidth: 1.5,
              borderColor: colors.primary,
              ...SHADOWS.card,
            }}
          >
            <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: 8 }}>
              {CUSTOM_CATEGORY.emoji} Custom option
            </DNText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                placeholder="e.g. Pottery class downtown"
                placeholderTextColor={colors.ink2}
                style={[TYPE.body, { flex: 1, color: colors.ink }]}
                autoFocus
                onSubmitEditing={handleAddCustom}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddCustom}
                disabled={!customText.trim() || atMax}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  opacity: !customText.trim() || atMax ? 0.4 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setShowCustomInput(false); setCustomText(''); }} style={{ marginTop: 8 }}>
              <DNText variant="secondary" color={colors.ink2}>Cancel</DNText>
            </TouchableOpacity>
          </View>
        ) : (
          !atMax && (
            <TouchableOpacity
              onPress={() => setShowCustomInput(true)}
              activeOpacity={0.75}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: SPACING.md,
                  marginBottom: SPACING.sm,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  borderStyle: 'dashed',
                },
                SHADOWS.card,
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.md,
                }}
              >
                <Text style={{ fontSize: 22 }}>{CUSTOM_CATEGORY.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <DNText variant="rowLabel" color={colors.ink}>{CUSTOM_CATEGORY.name}</DNText>
                <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 2 }}>
                  {CUSTOM_CATEGORY.tagline}
                </DNText>
              </View>
            </TouchableOpacity>
          )
        )}

        {/* From Discover button */}
        <DNButton
          label="✦ Let me Browse Discover"
          variant="tonal"
          onPress={handleFromDiscover}
          style={{ marginTop: SPACING.sm, marginBottom: SPACING.lg }}
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
