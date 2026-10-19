/**
 * CreateProposalScreen — FINALIZE step (rewritten)
 *
 * Receives options[] from PlanBuilderContext (via strip) or from Suggestions
 * as route params. Shows plan summary, title, date/time picker, group selector,
 * preview modal, and send button.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlanBuilder } from '@/contexts/PlanBuilderContext';
import { SPACING, SHADOWS } from '@/constants';
import { CATEGORIES, getCategoryColorById } from '@/constants/categories';
import {
  DNButton,
  DNInput,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { proposalsAPI, groupsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { ActivityOption, Group, PlanBuilderOption, RootStackParamList } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'CreateProposal'>;

// ── Helper: category → colour/emoji ───────────────────────────────────────────
function getCategoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.name === category || c.id === category)?.emoji ?? '📍';
}
function getCategoryColor(category: string): string {
  return getCategoryColorById(category);
}

// ── Thumbnail (image or emoji fallback) ───────────────────────────────────────
function OptionThumbnail({ opt }: { opt: PlanBuilderOption }) {
  const [err, setErr] = useState(false);
  if (opt.imageUrl && !err) {
    return (
      <Image
        source={{ uri: opt.imageUrl }}
        style={{ width: 60, height: 60, borderRadius: 12 }}
        resizeMode="cover"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: getCategoryColor(opt.category),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 26 }}>{getCategoryEmoji(opt.category)}</Text>
    </View>
  );
}

// ── Option card for "Your Plan" list ──────────────────────────────────────────
function PlanOptionCard({
  opt,
  onRemove,
  colors,
}: {
  opt: PlanBuilderOption;
  onRemove: () => void;
  colors: any;
}) {
  const priceStr = opt.priceLevel ? '$'.repeat(opt.priceLevel) : null;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: SPACING.sm,
          marginBottom: SPACING.sm,
          gap: SPACING.sm,
        },
        SHADOWS.card,
      ]}
    >
      <OptionThumbnail opt={opt} />
      <View style={{ flex: 1 }}>
        <DNText variant="rowLabel" color={colors.ink} numberOfLines={1}>
          {opt.name}
        </DNText>
        {opt.address && (
          <DNText variant="secondary" color={colors.ink2} numberOfLines={1}>
            {opt.address}
          </DNText>
        )}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          {opt.rating != null && (
            <DNText variant="secondary" color={colors.lime}>
              ★ {opt.rating.toFixed(1)}
            </DNText>
          )}
          {priceStr && (
            <DNText variant="secondary" color={colors.ink2}>
              {priceStr}
            </DNText>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.ink2, fontSize: 16, lineHeight: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({
  visible,
  onClose,
  opts,
  title,
  partnerName,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  opts: PlanBuilderOption[];
  title: string;
  partnerName: string;
  colors: any;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '85%',
            padding: SPACING.gutter,
            paddingBottom: 40,
          }}
        >
          <DNText variant="heading" color={colors.ink} style={{ marginBottom: 4 }}>
            Preview
          </DNText>
          <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.md }}>
            What {partnerName} will see
          </DNText>

          <ScrollView showsVerticalScrollIndicator={false}>
            <DNText variant="title" color={colors.ink} style={{ marginBottom: SPACING.sm }}>
              {title || 'Date night'}
            </DNText>
            {opts.map((opt) => (
              <View
                key={opt.id}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.bg,
                    borderRadius: 14,
                    padding: SPACING.sm,
                    marginBottom: SPACING.sm,
                    gap: SPACING.sm,
                  },
                ]}
              >
                <OptionThumbnail opt={opt} />
                <View style={{ flex: 1 }}>
                  <DNText variant="rowLabel" color={colors.ink}>{opt.name}</DNText>
                  {opt.address && (
                    <DNText variant="secondary" color={colors.ink2}>{opt.address}</DNText>
                  )}
                </View>
                {/* Greyed vote button */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.4,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>♥</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <DNButton
            label="Close Preview"
            variant="secondary"
            onPress={onClose}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Format date label ─────────────────────────────────────────────────────────
function formatDateLabel(d: Date): string {
  return (
    d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

// ── Smart title suggestion ────────────────────────────────────────────────────
function suggestTitle(opts: PlanBuilderOption[]): string {
  if (opts.length === 0) return '';
  const categories = opts.map((o) => o.category);
  // All events on same date
  const dates = opts.filter((o) => o.eventDate).map((o) => o.eventDate!.slice(0, 10));
  if (dates.length > 0 && new Set(dates).size === 1) {
    const d = new Date(dates[0]);
    const day = d.toLocaleDateString(undefined, { weekday: 'long' });
    return `Date night · ${day}`;
  }
  const hasDining = categories.some((c) =>
    c.includes('Dining') || c.includes('Restaurant') || c.includes('Cooking'),
  );
  const hasEntertainment = categories.some((c) =>
    c.includes('Music') || c.includes('Theater') || c.includes('Comedy') || c.includes('Movie'),
  );
  if (hasDining && hasEntertainment) {
    const diner = opts.find((o) =>
      o.category.includes('Dining') || o.category.includes('Restaurant'),
    );
    const show = opts.find((o) =>
      o.category.includes('Music') || o.category.includes('Theater'),
    );
    if (diner && show) return `${diner.name.split(' ').slice(0, 2).join(' ')} + ${show.name.split(' ').slice(0, 2).join(' ')}`;
  }
  const firstCat = categories[0];
  return `${firstCat} Night`;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreateProposalScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const { options: pbOptions, addOption, removeOption, clearPlan, groupId: pbGroupId } = usePlanBuilder();

  const routeGroupId = route.params?.groupId ?? pbGroupId ?? '';

  // Merge PlanBuilder options with any route-passed options (from Finalize button)
  const routeOptions: PlanBuilderOption[] = route.params?.options ?? [];
  // Use route options if provided, otherwise use PlanBuilder context
  const [localOptions, setLocalOptions] = useState<PlanBuilderOption[]>(() => {
    return routeOptions.length > 0 ? routeOptions : pbOptions;
  });

  // Apply any incoming single suggestion from route params
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    const s = route.params?.addSuggestion;
    if (s && appliedRef.current !== s.name) {
      appliedRef.current = s.name;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setLocalOptions((prev) => {
        if (prev.length >= 5) return prev;
        if (prev.some((o) => o.name === s.name)) return prev;
        return [...prev, { id, ...s }];
      });
    }
  }, [route.params?.addSuggestion]);

  // Sync from PlanBuilder if no route options
  useEffect(() => {
    if (routeOptions.length === 0) {
      setLocalOptions(pbOptions);
    }
  }, [pbOptions]);

  const handleRemoveOption = (id: string) => {
    setLocalOptions((prev) => prev.filter((o) => o.id !== id));
    removeOption(id);
  };

  // Earliest eventDate → pre-fill date
  const earliestEventDate = localOptions
    .filter((o) => o.eventDate)
    .map((o) => new Date(o.eventDate!))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  const [title, setTitle] = useState(() => suggestTitle(localOptions));
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (earliestEventDate) return earliestEventDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(routeGroupId);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Preview
  const [previewVisible, setPreviewVisible] = useState(false);

  // Success overlay
  const [successVisible, setSuccessVisible] = useState(false);
  const [createdProposalId, setCreatedProposalId] = useState<string>('');
  const [partnerName, setPartnerName] = useState('your partner');

  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [optionsError, setOptionsError] = useState('');

  // Solo-start: zero-group users get a personal space auto-created on send
  const isSoloStart = groupsLoaded && groups.length === 0 && !selectedGroupId;
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || '';

  // Update title suggestion when options change
  useEffect(() => {
    if (!title || title === suggestTitle([])) {
      setTitle(suggestTitle(localOptions));
    }
  }, [localOptions]);

  // Load groups
  useEffect(() => {
    groupsAPI
      .list()
      .then((res) => {
        const gs: Group[] = Array.isArray(res.data) ? res.data : res.data?.groups ?? [];
        setGroups(gs);
        if (!selectedGroupId && gs.length > 0) {
          setSelectedGroupId(gs[0].id);
        }
        // Find partner name from first group with 2 members
        const g = gs.find((g2) => g2.id === (selectedGroupId || gs[0]?.id));
        if (g?.members && g.members.length === 2) {
          const partner = g.members.find((m) => m.userId !== (globalThis as any).__userId);
          if (partner) {
            setPartnerName(partner.user?.displayName ?? 'your partner');
          }
        }
      })
      .catch(() => {})
      .finally(() => setGroupsLoaded(true));
  }, []);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(date);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return next;
      });
      if (Platform.OS === 'android') setShowTimePicker(true);
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    } else setTitleError('');
    if (localOptions.length < 1) {
      setOptionsError('Add at least 1 activity');
      valid = false;
    } else if (localOptions.length > 5) {
      setOptionsError('Maximum 5 options');
      valid = false;
    } else setOptionsError('');
    if (!selectedGroupId && !isSoloStart) {
      setOptionsError('Select a group to send to');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let groupId = selectedGroupId;
      let solo = false;
      if (!groupId && isSoloStart) {
        // Solo-start: transparently create a personal space — no group wall
        const groupName = firstName ? `${firstName}'s plans` : 'My plans';
        const groupRes = await groupsAPI.create(groupName);
        groupId = groupRes.data?.id ?? groupRes.data?.group?.id ?? '';
        if (!groupId) {
          setOptionsError('Could not set up your space. Please try again.');
          return;
        }
        solo = true;
      }
      const apiOptions = localOptions.map((o) => ({
        name: o.name,
        category: o.category,
        description: o.description,
        address: o.address,
        imageUrl: o.imageUrl,
        sourceUrl: o.sourceUrl,
        eventDate: o.eventDate,
        rating: o.rating,
        priceLevel: o.priceLevel,
        sourceName: o.sourceName,
      }));
      const res = await proposalsAPI.create(
        groupId,
        title.trim(),
        selectedDate.toISOString(),
        apiOptions,
      );
      clearPlan();
      if (solo) {
        // Land on the proposal with the guest-vote share sheet auto-opened
        navigation.replace
          ? navigation.replace('InviteCard', { proposalId: res.data.id })
          : navigation.navigate('InviteCard', { proposalId: res.data.id });
        return;
      }
      setCreatedProposalId(res.data.id);
      setSuccessVisible(true);
    } catch (e) {
      console.warn('Failed to create proposal', e);
      setOptionsError('Could not send the plan. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <DNScreenHeader
          title="Your Plan"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 180 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Options list ─────────────────────────────────────────────── */}
          <DNText variant="section" color={colors.ink2} style={{ marginBottom: SPACING.sm }}>
            Activities ({localOptions.length} / 5)
          </DNText>

          {optionsError ? (
            <DNText variant="secondary" color={colors.error} style={{ marginBottom: SPACING.sm }}>
              {optionsError}
            </DNText>
          ) : null}

          {localOptions.map((opt) => (
            <PlanOptionCard
              key={opt.id}
              opt={opt}
              onRemove={() => handleRemoveOption(opt.id)}
              colors={colors}
            />
          ))}

          {localOptions.length === 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: SPACING.xl,
                alignItems: 'center',
                marginBottom: SPACING.md,
                borderWidth: 1.5,
                borderColor: colors.line,
                borderStyle: 'dashed',
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: SPACING.sm }}>🎯</Text>
              <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center' }}>
                No activities yet. Add some from Discover!
              </DNText>
            </View>
          )}

          {localOptions.length < 5 && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Suggestions', {
                  groupId: selectedGroupId,
                  returnTo: 'CreateProposal',
                })
              }
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  padding: SPACING.md,
                  marginBottom: SPACING.md,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderStyle: 'dashed',
                  gap: SPACING.sm,
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>+</Text>
              <DNText variant="rowLabel" color={colors.primary}>
                Add another activity
              </DNText>
            </TouchableOpacity>
          )}

          {/* ── Title ───────────────────────────────────────────────────── */}
          <DNInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Date night · Friday"
            error={titleError}
          />

          {/* ── Date/time ─────────────────────────────────────────────── */}
          <DNText variant="section" color={colors.ink2} style={{ marginBottom: SPACING.sm }}>
            When?
          </DNText>

          <TouchableOpacity
            style={rowStyle}
            onPress={() => {
              if (Platform.OS === 'ios') {
                setShowDatePicker((v) => !v);
              } else {
                setShowDatePicker(true);
              }
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>📅</Text>
            <View style={{ flex: 1 }}>
              <DNText variant="rowLabel" color={colors.ink}>Date &amp; Time</DNText>
              <DNText variant="secondary" color={colors.ink2}>
                {formatDateLabel(selectedDate)} ▾
              </DNText>
            </View>
          </TouchableOpacity>

          {/* iOS inline picker */}
          {Platform.OS === 'ios' && showDatePicker && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                marginBottom: SPACING.sm,
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="inline"
                onChange={(_e, d) => { if (d) setSelectedDate(d); }}
                minimumDate={new Date()}
                themeVariant="light"
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{ padding: SPACING.md, alignItems: 'center' }}
              >
                <DNText variant="buttonSm" color={colors.primary}>Done</DNText>
              </TouchableOpacity>
            </View>
          )}

          {/* Android modal date picker */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* ── Group selector ──────────────────────────────────────────── */}
          {isSoloStart && (
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 16,
                padding: SPACING.md,
                marginTop: SPACING.sm,
                marginBottom: SPACING.sm,
              }}
            >
              <DNText variant="secondary" color={colors.primary}>
                ✨ We'll start a personal space for you — then you can send a link to whoever
                you're planning with, and they can vote without an account.
              </DNText>
            </View>
          )}
          {groups.length > 1 && (
            <>
              <DNText variant="section" color={colors.ink2} style={{ marginBottom: SPACING.sm, marginTop: SPACING.sm }}>
                Send to
              </DNText>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setSelectedGroupId(g.id)}
                  style={[
                    rowStyle,
                    {
                      borderWidth: selectedGroupId === g.id ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18, marginRight: 12 }}>👥</Text>
                  <DNText variant="rowLabel" color={colors.ink} style={{ flex: 1 }}>
                    {g.name}
                  </DNText>
                  {selectedGroupId === g.id && (
                    <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* ── Sticky bottom bar ──────────────────────────────────────────── */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.bg,
            paddingHorizontal: SPACING.gutter,
            paddingBottom: insets.bottom + 16,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            gap: SPACING.sm,
          }}
        >
          <DNButton
            label="Preview →"
            variant="tonal"
            onPress={() => localOptions.length > 0 && setPreviewVisible(true)}
            style={{ marginBottom: 4 }}
          />
          <DNButton
            label={isSoloStart ? 'Create plan & get share link →' : `Send to ${partnerName} ♥`}
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Preview modal */}
      <PreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        opts={localOptions}
        title={title}
        partnerName={partnerName}
        colors={colors}
      />

      {/* Success overlay */}
      <Modal transparent animationType="fade" visible={successVisible}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
            padding: SPACING.gutter,
          }}
        >
          <Text style={{ fontSize: 72, marginBottom: SPACING.lg }}>🎉</Text>
          <DNText variant="title" color={colors.ink} style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
            Plan sent to {partnerName}!
          </DNText>
          <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.xl }}>
            They'll vote on your options and you'll get notified when a decision is made.
          </DNText>
          <DNButton
            label="View Plan"
            variant="primary"
            onPress={() => {
              setSuccessVisible(false);
              navigation.navigate('ProposalDetail', { proposalId: createdProposalId });
            }}
            style={{ width: '100%', marginBottom: SPACING.sm }}
          />
          <DNButton
            label="Back to Groups"
            variant="secondary"
            onPress={() => {
              setSuccessVisible(false);
              navigation.navigate('Main');
            }}
            style={{ width: '100%' }}
          />
        </View>
      </Modal>
    </>
  );
}
