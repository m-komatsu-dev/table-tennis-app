import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Screen, SectionTitle, colors, styles } from "@/components/ui";
import { getAccessToken } from "@/storage/token";

const features = [
  { title: "練習記録", description: "練習日、時間、場所、内容をスマホからすばやく記録。" },
  { title: "試合記録", description: "対戦相手、勝敗、セットごとのスコアを残せます。" },
  { title: "練習メニュー", description: "Web版で作成した練習メニューを確認できます。" },
  { title: "プロフィール", description: "レベルや所属など、プレイヤー情報を管理。" }
];

export default function PublicHomeScreen() {
  const [hasToken, setHasToken] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function checkToken() {
        const token = await getAccessToken();
        if (mounted) {
          setHasToken(Boolean(token));
        }
      }

      checkToken();

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <Screen>
      <View
        style={{
          backgroundColor: "#ecfdf5",
          borderColor: "#a7f3d0",
          borderRadius: 8,
          borderWidth: 1,
          gap: 14,
          marginTop: 10,
          padding: 18
        }}
      >
        <Text style={[styles.title, { fontSize: 34 }]}>卓球記録</Text>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 24 }}>
          練習・試合・練習メニューを記録して、成長を見える化する卓球プレイヤー向けアプリ
        </Text>
        <Button onPress={() => router.push(hasToken ? "/(tabs)/home" : "/login")}>
          {hasToken ? "アプリを開く" : "ログインする"}
        </Button>
      </View>

      <Card>
        <SectionTitle title="主な機能" subtitle="Web版のダッシュボードに近い、記録中心のモバイル体験です。" />
        <View style={{ gap: 10 }}>
          {features.map((feature) => (
            <View
              key={feature.title}
              style={{
                backgroundColor: "#f8fafc",
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                gap: 5,
                padding: 13
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{feature.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="新規登録について" />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          Phase 1のモバイル版はログインに対応しています。アカウント作成はWeb版で行い、同じメールアドレスとパスワードでログインしてください。
        </Text>
        <Button variant="secondary" onPress={() => router.push("/login")}>
          Web版アカウントでログイン
        </Button>
      </Card>
    </Screen>
  );
}
