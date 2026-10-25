/**
 * ProfileScreen — 3k
 * HANDOFF_README spec: full redesign
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CARD_RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import {
  DNAvatar,
  DNButton,
  DNChip,
  DNInput,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { authAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { FavCategoryChips, loadFavCategories, saveFavCategories } from '@/components/FavCategories';
import { CATEGORIES } from '@/constants/categories';

type ThemeOverride = 'system' | 'light' | 'dark';

// ── Toggle pill ────────────────────────────────────────────────────────────────
function TogglePill({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.85}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? colors.primary : colors.line,
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? colors.onPrimary : colors.surface,
          alignSelf: value ? 'flex-end' : 'flex-start',
          ...SHADOWS.card,
        }}
      />
    </TouchableOpacity>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────────
function SettingRow({
  label,
  right,
  labelColor,
  onPress,
  icon,
  subtitle,
}: {
  label: string;
  right?: React.ReactNode;
  labelColor?: string;
  onPress?: () => void;
  icon?: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      {icon && <Text style={{ fontSize: 18, marginRight: 12 }}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.rowLabel, { color: labelColor ?? colors.ink }]}>{label}</Text>
        {subtitle && <Text style={[TYPE.secondary, { color: colors.ink2, marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      {right}
    </Wrapper>
  );
}

// ── Settings Card ────────────────────────────────────────────────────────────────
function SettingsCard({
  title,
  children,
  index,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  const { colors } = useTheme();
  const r = CARD_RADII[index % 4];
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: r.topLeft,
          borderTopRightRadius: r.topRight,
          borderBottomRightRadius: r.bottomRight,
          borderBottomLeftRadius: r.bottomLeft,
          padding: SPACING.md,
          marginBottom: SPACING.md,
        },
        SHADOWS.card,
      ]}
    >
      <Text style={[TYPE.section, { color: colors.ink2, marginBottom: SPACING.sm }]}>{title}</Text>
      {children}
    </View>
  );
}

// ── Delete Confirmation Sheet ──────────────────────────────────────────────────
function DeleteAccountSheet({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  const [typed, setTyped] = useState('');
  const canDelete = typed === 'DELETE';

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 28,
            padding: SPACING.xl,
            ...SHADOWS.dock,
          }}
        >
          <DNSticker
            label="PERMANENT"
            color={colors.errorSoft}
            textColor={colors.error}
            rotationIndex={2}
            style={{ marginBottom: SPACING.md }}
          />
          <DNText variant="heading" color={colors.ink} style={{ marginBottom: SPACING.sm }}>
            Delete your account?
          </DNText>
          <DNText variant="body" color={colors.ink2} style={{ marginBottom: SPACING.lg }}>
            This will permanently delete all your data, groups, and proposal history. This action cannot be undone.
          </DNText>
          <DNInput
            label="Type DELETE to confirm"
            value={typed}
            onChangeText={setTyped}
            placeholder="DELETE"
            autoCapitalize="characters"
          />
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
            <DNButton
              label="Cancel"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <DNButton
              label="Delete account"
              variant="ink"
              onPress={onConfirm}
              disabled={!canDelete}
              style={{
                flex: 1,
                backgroundColor: canDelete ? colors.error : colors.line,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors, override, setOverride } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await SecureStore.setItemAsync('appLanguage', lng);
  };

  const [notifNew, setNotifNew] = useState(true);
  const [notifVotes, setNotifVotes] = useState(true);
  const [notifReminders, setNotifReminders] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  // Favorite categories (AsyncStorage tp.favCategories)
  const [favIds, setFavIds] = useState<string[]>([]);
  const [favPickerOpen, setFavPickerOpen] = useState(false);
  useEffect(() => {
    loadFavCategories().then(setFavIds);
  }, []);
  const handleFavChange = (ids: string[]) => {
    setFavIds(ids);
    saveFavCategories(ids);
  };
  const favSummary =
    favIds.length > 0
      ? favIds
          .map((id) => CATEGORIES.find((c) => c.id === id)?.emoji ?? '')
          .filter(Boolean)
          .join(' ')
      : 'None yet';

  const handleDeleteConfirm = async () => {
    try {
      await authAPI.deleteAccount();
      setShowDeleteSheet(false);
      await logout();
    } catch (e) {
      console.warn('Delete account failed', e);
    }
  };

  const displayName = user?.displayName ?? 'You';
  const email = user?.email ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DNScreenHeader title={t('profile.title')} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar section */}
        <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
          <View style={{ position: 'relative' }}>
            <DNAvatar name={displayName} size={76} colorIndex={0} />
            {/* Edit badge */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.lime,
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.card,
              }}
            >
              <Text style={{ fontSize: 12 }}>✏️</Text>
            </View>
          </View>

          <DNText variant="title" color={colors.ink} style={{ marginTop: SPACING.md }}>
            {displayName}
          </DNText>
          <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 4 }}>
            {email}
          </DNText>
          <DNSticker
            label="12 plans decided"
            color={colors.limeSoft}
            textColor={colors.lime}
            rotationIndex={1}
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        {/* Settings cards */}
        <View style={{ paddingHorizontal: SPACING.gutter }}>
          {/* Connections / Friends card */}
          <SettingsCard title="CONNECTIONS" index={0}>
            <SettingRow
              label="My Friends"
              right={<Text style={{ color: colors.ink2, fontSize: 16 }}>→</Text>}
              onPress={() => (navigation as any).navigate('Friends')}
            />
          </SettingsCard>

          {/* Notifications card */}
          <SettingsCard title="NOTIFICATIONS" index={1}>
            <SettingRow
              label="New proposals"
              right={<TogglePill value={notifNew} onChange={setNotifNew} />}
            />
            <SettingRow
              label="When everyone votes"
              right={<TogglePill value={notifVotes} onChange={setNotifVotes} />}
            />
            <SettingRow
              label="Reminders"
              right={<TogglePill value={notifReminders} onChange={setNotifReminders} />}
            />
          </SettingsCard>

          {/* Language card */}
          <SettingsCard title={t('profile.language').toUpperCase()} index={1}>
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: SPACING.sm }}>
              {[{ code: 'en', label: t('profile.english') }, { code: 'es', label: t('profile.spanish') }].map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => changeLanguage(lang.code)}
                  style={[
                    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
                    i18n.language === lang.code
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: 'transparent', borderColor: colors.line }
                  ]}
                >
                  <Text style={{ color: i18n.language === lang.code ? '#fff' : colors.ink, fontFamily: 'DMSans_500Medium' }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsCard>

          {/* Preferences card */}
          <SettingsCard title="PREFERENCES" index={2}>
            <SettingRow
              label="Home area"
              icon="📍"
              subtitle="Not set"
              onPress={() => {}}
              right={<Text style={[TYPE.secondary, { color: colors.ink2 }]}>›</Text>}
            />
            <SettingRow
              label="Favorite categories"
              icon="💚"
              subtitle={favSummary}
              onPress={() => setFavPickerOpen((v) => !v)}
              right={<Text style={[TYPE.secondary, { color: colors.ink2 }]}>{favPickerOpen ? '⌄' : '›'}</Text>}
            />
            {favPickerOpen && (
              <View style={{ paddingVertical: SPACING.sm }}>
                <FavCategoryChips selected={favIds} onChange={handleFavChange} />
              </View>
            )}
            <SettingRow
              label="Appearance"
              right={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['system', 'light', 'dark'] as ThemeOverride[]).map((opt, i) => (
                    <DNChip
                      key={opt}
                      label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                      selected={override === opt}
                      onPress={() => setOverride(opt)}
                      index={i}
                    />
                  ))}
                </View>
              }
            />
          </SettingsCard>

          {/* Account card */}
          <SettingsCard title="ACCOUNT" index={3}>
            <SettingRow
              label={t('profile.signOut')}
              labelColor={colors.ink2}
              onPress={() => { logout(); }}
            />
            <SettingRow
              label="Delete account"
              labelColor={colors.error}
              onPress={() => setShowDeleteSheet(true)}
            />
          </SettingsCard>
        </View>
      </ScrollView>

      <DeleteAccountSheet
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
}
