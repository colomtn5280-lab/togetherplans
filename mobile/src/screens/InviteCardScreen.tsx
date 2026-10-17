/**
 * InviteCardScreen — two-step flow inserted between CreateProposal and ProposalDetail.
 *
 * Step 1: Template picker (FlatList of colored tiles, 2 columns)
 * Step 2: Customise — note, optional photo, then save & navigate to ProposalDetail
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@/types';
import { inviteCardsAPI } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { DNButton, DNInput, DNScreenHeader } from '@/components/ui';
import { SPACING } from '@/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'InviteCard'>;

// ── Constants ─────────────────────────────────────────────────────────────────

const TILE_COLORS = ['#0E8C8C', '#7CB518', '#E39B12', '#5D6B76', '#D9F1F0'];
const TEAL = '#0E8C8C';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tileColor(index: number): string {
  return TILE_COLORS[index % TILE_COLORS.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TemplateTileProps {
  template: Template;
  index: number;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  height?: number;
}

function TemplateTile({ template, index, selected, onPress, fullWidth = false, height = 160 }: TemplateTileProps) {
  const bg = tileColor(index);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: bg,
          height,
          flex: fullWidth ? 1 : undefined,
          width: fullWidth ? '100%' : undefined,
          borderWidth: selected ? 3 : 0,
          borderColor: selected ? TEAL : 'transparent',
        },
      ]}
    >
      <Text style={styles.tileName} numberOfLines={2}>
        {template.name}
      </Text>
      {selected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function InviteCardScreen({ navigation, route }: Props) {
  const { proposalId } = route.params;
  const { colors } = useTheme();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mimeType: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load templates ─────────────────────────────────────────────────────────
  useEffect(() => {
    inviteCardsAPI
      .getTemplates()
      .then((res) => setTemplates(res.data))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const navigateToDetail = useCallback(() => {
    navigation.replace('ProposalDetail', { proposalId, openInvite: true });
  }, [navigation, proposalId]);

  const handleSkip = useCallback(async () => {
    try {
      await inviteCardsAPI.save(proposalId, { skipped: true });
    } catch {
      // best-effort — navigate regardless
    }
    navigateToDetail();
  }, [proposalId, navigateToDetail]);

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedIndex === null) return;
    const template = templates[selectedIndex];
    setSaving(true);
    try {
      await inviteCardsAPI.save(proposalId, { templateId: template.id, note: note.trim() || undefined });
      if (photo) {
        await inviteCardsAPI.uploadPhoto(proposalId, photo.uri, photo.mimeType);
      }
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
    navigateToDetail();
  }, [selectedIndex, templates, proposalId, note, photo, navigateToDetail]);

  // ── Render Step 1 ──────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg }]}>
        <DNScreenHeader
          title="Pick an invite card"
          subtitle="Sent with your invite link"
          onBack={goBack}
        />

        {loadingTemplates ? (
          <View style={styles.center}>
            <ActivityIndicator color={TEAL} />
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item, index }) => (
              <TemplateTile
                template={item}
                index={index}
                selected={selectedIndex === index}
                onPress={() => setSelectedIndex(index)}
              />
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.ink2 }]}>
                No templates available right now.
              </Text>
            }
          />
        )}

        <View style={styles.bottomBar}>
          <DNButton label="Skip this step" variant="secondary" onPress={handleSkip} />
          <View style={styles.gap} />
          <DNButton
            label="Next →"
            variant="primary"
            disabled={selectedIndex === null}
            onPress={() => setStep(2)}
          />
        </View>
      </View>
    );
  }

  // ── Render Step 2 ──────────────────────────────────────────────────────────
  const selected = selectedIndex !== null ? templates[selectedIndex] : null;

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <DNScreenHeader
        title="Customise your card"
        onBack={() => setStep(1)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Selected template preview */}
        {selected && selectedIndex !== null && (
          <TemplateTile
            template={selected}
            index={selectedIndex}
            selected={false}
            onPress={() => {}}
            fullWidth
            height={200}
          />
        )}

        <View style={styles.formSection}>
          {/* Note input */}
          <DNInput
            label="Personal note (optional)"
            multiline
            maxLength={140}
            placeholder="Add a personal message..."
            value={note}
            onChangeText={setNote}
            style={styles.noteInput}
          />
          <Text style={[styles.charCounter, { color: colors.ink2 }]}>
            {140 - note.length} characters remaining
          </Text>

          {/* Photo picker */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handlePickPhoto}
            style={[styles.photoButton, { borderColor: colors.ink2 }]}
          >
            <Text style={[styles.photoButtonText, { color: colors.primary }]}>
              {photo ? 'Change photo' : 'Add a photo'}
            </Text>
          </TouchableOpacity>

          {photo && (
            <Image
              source={{ uri: photo.uri }}
              style={styles.photoThumb}
            />
          )}

          <View style={styles.saveButtonWrap}>
            <DNButton
              label="Use this card →"
              variant="primary"
              loading={saving}
              onPress={handleSave}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Step 1 list
  listContent: { paddingHorizontal: SPACING.gutter, paddingBottom: 16 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tileName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 13,
    color: TEAL,
    fontFamily: 'Sora_700Bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },

  // Bottom bar (step 1)
  bottomBar: {
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 10,
  },
  gap: { height: 4 },

  // Step 2
  scrollContent: { paddingBottom: 48 },
  formSection: { paddingHorizontal: SPACING.gutter, paddingTop: 20 },
  noteInput: { minHeight: 90 },
  charCounter: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: -8,
    marginBottom: 16,
    textAlign: 'right',
  },
  photoButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 20,
  },
  saveButtonWrap: { marginTop: 8 },
});
