import { Pressable, Text, View } from "react-native";
import { Card, MetaPill, colors, styles } from "@/components/ui";
import type { InAppNotification } from "@/utils/notifications";

export function NotificationCard({
  item,
  read,
  onAction,
  onMarkRead,
  onHide
}: {
  item: InAppNotification;
  read: boolean;
  onAction: () => void;
  onMarkRead: () => void;
  onHide: () => void;
}) {
  return (
    <Card>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MetaPill label={item.meta} tone="green" />
            {read ? <MetaPill label="既読" /> : <MetaPill label="未読" tone="blue" />}
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 }}>{item.title}</Text>
        </View>
      </View>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{item.description}</Text>
      <Pressable onPress={onAction} style={styles.button}>
        <Text style={styles.buttonText}>{item.actionLabel}</Text>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          disabled={read}
          onPress={onMarkRead}
          style={[styles.button, styles.secondaryButton, { flex: 1, minHeight: 44 }, read && styles.disabledButton]}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>{read ? "既読済み" : "既読にする"}</Text>
        </Pressable>
        <Pressable onPress={onHide} style={[styles.button, styles.secondaryButton, { flex: 1, minHeight: 44 }]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>非表示にする</Text>
        </Pressable>
      </View>
    </Card>
  );
}
