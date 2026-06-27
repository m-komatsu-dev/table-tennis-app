import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { createMatchRecord } from "@/api/match";
import { todayInputValue } from "@/components/format";
import { Button, Card, ErrorMessage, Header, Screen, SectionTitle, Segment, TextField, colors } from "@/components/ui";
import { getAccessToken } from "@/storage/token";
import type { ScoreRow } from "@/types";

type MatchTypeInput = "PRACTICE" | "OFFICIAL";
type ResultInput = "WIN" | "LOSE";

export default function NewMatchScreen() {
  const [playedAt, setPlayedAt] = useState(todayInputValue());
  const [opponentName, setOpponentName] = useState("");
  const [opponentTeam, setOpponentTeam] = useState("");
  const [matchType, setMatchType] = useState<MatchTypeInput>("PRACTICE");
  const [result, setResult] = useState<ResultInput>("WIN");
  const [memo, setMemo] = useState("");
  const [scores, setScores] = useState<ScoreRow[]>([
    { set: 1, me: 11, opp: 7 },
    { set: 2, me: 11, opp: 8 },
    { set: 3, me: 11, opp: 9 }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/login");
      }
    }

    checkSession();
  }, []);

  function updateScore(index: number, key: "me" | "opp", value: string) {
    const next = scores.map((score, scoreIndex) =>
      scoreIndex === index ? { ...score, [key]: Number(value) } : score
    );
    setScores(next);
  }

  function addSet() {
    if (scores.length >= 7) {
      return;
    }

    setScores([...scores, { set: scores.length + 1, me: 11, opp: 0 }]);
  }

  function removeSet() {
    if (scores.length <= 1) {
      return;
    }

    setScores(scores.slice(0, -1));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      await createMatchRecord({
        playedAt,
        opponentName,
        opponentTeam,
        matchType,
        result,
        scores,
        memo
      });
      router.replace("/match");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "試合記録を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header subtitle="対戦相手、勝敗、セット別スコアを記録します。" title="試合を記録" />
      <ErrorMessage message={error} />
      <Card>
        <TextField label="試合日" onChangeText={setPlayedAt} placeholder="2026-06-27" value={playedAt} />
        <TextField label="対戦相手名" onChangeText={setOpponentName} placeholder="佐藤さん" value={opponentName} />
        <TextField label="相手所属チーム" onChangeText={setOpponentTeam} placeholder="A高校" value={opponentTeam} />
        <View style={{ gap: 7 }}>
          <Text style={labelStyle}>試合種別</Text>
          <Segment
            onChange={setMatchType}
            options={[
              { label: "練習試合", value: "PRACTICE" },
              { label: "公式試合", value: "OFFICIAL" }
            ]}
            value={matchType}
          />
        </View>
        <View style={{ gap: 7 }}>
          <Text style={labelStyle}>勝敗</Text>
          <Segment
            onChange={setResult}
            options={[
              { label: "勝利", value: "WIN" },
              { label: "敗北", value: "LOSE" }
            ]}
            value={result}
          />
        </View>
        <TextField label="メモ" multiline onChangeText={setMemo} placeholder="試合の反省、よかった点" value={memo} />
      </Card>

      <Card>
        <SectionTitle title="セット別スコア" subtitle="自分 - 相手の順で入力します。" />
        {scores.map((score, index) => (
          <View key={score.set} style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800", width: 48 }}>
              {score.set}S
            </Text>
            <TextField
              containerStyle={{ flex: 1 }}
              keyboardType="number-pad"
              label="自分"
              onChangeText={(value) => updateScore(index, "me", value)}
              value={String(score.me)}
            />
            <TextField
              containerStyle={{ flex: 1 }}
              keyboardType="number-pad"
              label="相手"
              onChangeText={(value) => updateScore(index, "opp", value)}
              value={String(score.opp)}
            />
          </View>
        ))}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={addSet}>
              セット追加
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={removeSet}>
              セット削除
            </Button>
          </View>
        </View>
      </Card>

      <Button loading={saving} onPress={handleSave}>
        保存する
      </Button>
    </Screen>
  );
}

const labelStyle = {
  color: colors.text,
  fontSize: 13,
  fontWeight: "700" as const
};
