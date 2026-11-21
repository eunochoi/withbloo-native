import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { FormTextInput } from '../../components/FormTextInput';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import { validatePassword } from '../../backup/container';
import { backupErrorMessage } from '../../backup/errors';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from '../../components/HeaderAction';
import { InfoNotice } from '../../components/InfoNotice';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function BackupPasswordSheet({
  title,
  creating,
  information,
  changing = false,
  onClose,
  onSubmit,
}: {
  title: string;
  creating: boolean;
  information?: string;
  changing?: boolean;
  onClose: () => void;
  onSubmit: (password: string, oldPassword?: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const input = (value: string, change: (value: string) => void, label: string) => (
    <FormTextInput
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      value={value}
      onChangeText={change}
      placeholder={label}
      accessibilityLabel={label}
      placeholderTextColor={colors.textSecondary}
      editable={!busy}
      maxLength={256}
      className="min-h-12 rounded-2xl border border-theme-border bg-theme-surface px-4 py-3 text-base text-theme-text-primary"
    />
  );
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      enablePanDownToClose={!busy}

    >
      <SheetHeader
        title={title}
        headerButton={
          <HeaderAction
            disabled={busy || !password}
            label={t('common.confirm')}
            onPress={() => {
              if (active.current) return;
              if (creating && password !== confirmation) {
                setError(t('settings.backupPasswordMismatch'));
                return;
              }
              active.current = true;
              setBusy(true);
              setError('');
              void (async () => {
                try {
                  if (creating) validatePassword(password);
                  await onSubmit(password, changing ? oldPassword : undefined);
                  setPassword('');
                  setConfirmation('');
                  setOldPassword('');
                  closeSheet();
                } catch (value) {
                  setError(backupErrorMessage(value));
                } finally {
                  active.current = false;
                  setBusy(false);
                }
              })();
            }}
          />
        }
        onClose={
          !busy || true
            ? () => {
                if (!busy) closeSheet();
              }
            : undefined
        }
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <Text
            textBreakStrategy="highQuality"
            lineBreakStrategyIOS="hangul-word"
            className="text-sm leading-relaxed text-theme-text-secondary"
          >
            {t(creating ? 'settings.backupPasswordHint' : 'settings.backupPasswordPrompt')}
          </Text>
          {changing && input(oldPassword, setOldPassword, t('settings.backupOldPassword'))}
          {input(password, setPassword, t('settings.backupPassword'))}
          {creating && input(confirmation, setConfirmation, t('settings.backupPasswordConfirm'))}
          {!!error && (
            <Text accessibilityRole="alert" className="text-sm text-theme-danger">
              {error}
            </Text>
          )}
          {busy && <ActivityIndicator color={colors.accent} />}
          {creating && (
            <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
              {t('settings.backupPasswordWarning')}
              {changing && ` ${t('settings.backupPreviousPassword')}`}
            </InfoNotice>
          )}
          {!!information && (
            <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
              {information}
            </InfoNotice>
          )}
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
