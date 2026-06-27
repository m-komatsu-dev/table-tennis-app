import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  View,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  faint: "#94a3b8",
  primary: "#059669",
  primaryDark: "#047857",
  danger: "#dc2626",
  blue: "#2563eb"
};

export function Screen({ children, keyboardAware = false }: { children: ReactNode; keyboardAware?: boolean }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={[styles.screen, keyboardAware && styles.keyboardAwareScreen]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  backLabel,
  onBack,
  action
}: {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{backLabel ?? "戻る"}</Text>
        </Pressable>
      ) : null}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Button({
  children,
  onPress,
  loading,
  loadingLabel,
  disabled,
  variant = "primary"
}: {
  children: ReactNode;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const buttonStyle = [
    styles.button,
    variant === "secondary" && styles.secondaryButton,
    variant === "danger" && styles.dangerButton,
    (loading || disabled) && styles.disabledButton
  ];
  const textStyle = [styles.buttonText, variant === "secondary" && styles.secondaryButtonText];

  return (
    <Pressable disabled={loading || disabled} onPress={onPress} style={buttonStyle}>
      {loading ? (
        <View style={styles.buttonLoading}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.buttonText}>{loadingLabel ?? "保存中..."}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  multiline,
  containerStyle,
  ...props
}: TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.faint}
        style={[styles.input, multiline && styles.textArea, props.style]}
      />
    </View>
  );
}

export function InlineField({
  label,
  suffix,
  containerStyle,
  ...props
}: TextInputProps & {
  label: string;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inlineInputRow}>
        <TextInput {...props} placeholderTextColor={colors.faint} style={[styles.input, styles.inlineInput, props.style]} />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function ErrorMessage({
  message,
  actionLabel,
  onAction
}: {
  message?: string | null;
  actionLabel?: string;
  onAction?: () => void;
}) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>{message}</Text>
      {onAction ? (
        <Pressable onPress={onAction} style={styles.errorAction}>
          <Text style={styles.errorActionText}>{actionLabel ?? "再読み込み"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>読み込み中...</Text>
    </View>
  );
}

export function EmptyState({
  children,
  actionLabel,
  onAction
}: {
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{children}</Text>
      {onAction ? (
        <Pressable onPress={onAction} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{actionLabel ?? "追加"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MetaPill({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "green" | "red" | "blue";
}) {
  return (
    <View
      style={[
        styles.metaPill,
        tone === "green" && styles.metaPillGreen,
        tone === "red" && styles.metaPillRed,
        tone === "blue" && styles.metaPillBlue
      ]}
    >
      <Text
        style={[
          styles.metaPillText,
          tone === "green" && styles.metaPillTextGreen,
          tone === "red" && styles.metaPillTextRed,
          tone === "blue" && styles.metaPillTextBlue
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "未設定"}</Text>
    </View>
  );
}

export function Segment<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardAvoiding: {
    flex: 1
  },
  screen: {
    gap: 16,
    padding: 20,
    paddingBottom: 36
  },
  keyboardAwareScreen: {
    paddingBottom: 180
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1,
    gap: 6
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    justifyContent: "center"
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "800"
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  secondaryButton: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1
  },
  dangerButton: {
    backgroundColor: colors.danger
  },
  disabledButton: {
    opacity: 0.72
  },
  buttonLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButtonText: {
    color: colors.primaryDark
  },
  field: {
    gap: 7
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 10
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  inlineInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  inlineInput: {
    flex: 1
  },
  inputSuffix: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    width: 28
  },
  error: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  errorAction: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  errorActionText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  center: {
    alignItems: "center",
    gap: 10,
    padding: 24
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  empty: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  emptyAction: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  emptyActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800"
  },
  metaPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  metaPillGreen: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0"
  },
  metaPillRed: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  metaPillBlue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe"
  },
  metaPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  metaPillTextGreen: {
    color: colors.primaryDark
  },
  metaPillTextRed: {
    color: colors.danger
  },
  metaPillTextBlue: {
    color: colors.blue
  },
  row: {
    gap: 3
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  rowValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  segment: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  segmentItem: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  segmentItemSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  segmentText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  segmentTextSelected: {
    color: colors.primaryDark
  }
});
