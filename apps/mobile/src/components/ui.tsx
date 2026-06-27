import type { ReactNode } from "react";
import {
  ActivityIndicator,
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

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
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
  variant = "primary"
}: {
  children: ReactNode;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const buttonStyle = [
    styles.button,
    variant === "secondary" && styles.secondaryButton,
    variant === "danger" && styles.dangerButton,
    loading && styles.disabledButton
  ];
  const textStyle = [styles.buttonText, variant === "secondary" && styles.secondaryButtonText];

  return (
    <Pressable disabled={loading} onPress={onPress} style={buttonStyle}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={textStyle}>{children}</Text>}
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

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>読み込み中...</Text>
    </View>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{children}</Text>
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
  screen: {
    gap: 16,
    padding: 20,
    paddingBottom: 36
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
  error: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    padding: 12
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
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 16
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
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
    backgroundColor: "#ffffff",
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
    color: colors.text
  }
});
