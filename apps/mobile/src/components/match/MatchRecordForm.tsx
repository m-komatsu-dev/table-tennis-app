import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import type { MatchInput } from "@/api/match";
import { todayInputValue } from "@/components/format";
import { Button, Card, ErrorMessage, SectionTitle, Segment, TextField, colors, styles } from "@/components/ui";
import { getAccessToken } from "@/storage/token";
import type { MatchRecord, ScoreRow } from "@/types";

type MatchTypeInput = "PRACTICE" | "OFFICIAL";
type ResultInput = "WIN" | "LOSE";
type ScoreInputRow = {
  set: number;
  me: string;
  opp: string;
};

const initialScores: ScoreInputRow[] = Array.from({ length: 5 }, (_, index) => ({
  set: index + 1,
  me: "",
  opp: ""
}));

type MatchRecordFormProps = {
  initialRecord?: MatchRecord;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (input: MatchInput) => Promise<void>;
};

export function MatchRecordForm({ initialRecord, onSubmit, savingLabel, submitLabel }: MatchRecordFormProps) {
  const [playedAt, setPlayedAt] = useState(toInputDate(initialRecord?.playedAt) ?? todayInputValue());
  const [opponentName, setOpponentName] = useState(initialRecord?.opponentName ?? "");
  const [opponentTeam, setOpponentTeam] = useState(initialRecord?.opponentTeam ?? "");
  const [matchType, setMatchType] = useState<MatchTypeInput>(normalizeMatchType(initialRecord?.matchType));
  const [memo, setMemo] = useState(initialRecord?.memo ?? "");
  const [scores, setScores] = useState<ScoreInputRow[]>(scoresToInput(initialRecord?.scores));
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

  const setCount = useMemo(() => calculateSetCount(scores), [scores]);
  const result = useMemo<ResultInput | null>(() => {
    if (setCount.me > setCount.opp) {
      return "WIN";
    }

    if (setCount.me < setCount.opp) {
      return "LOSE";
    }

    return null;
  }, [setCount]);

  function updateScore(index: number, key: "me" | "opp", value: string) {
    const nextValue = value.replace(/[^\d]/g, "");
    setScores((current) =>
      current.map((score, scoreIndex) => (scoreIndex === index ? { ...score, [key]: nextValue } : score))
    );
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    const validation = validateMatchInput({
      playedAt,
      opponentName,
      scores,
      result
    });

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        playedAt: playedAt.trim(),
        opponentName: opponentName.trim(),
        opponentTeam: opponentTeam.trim(),
        matchType,
        result: validation.result,
        scores: validation.scores,
        memo: memo.trim()
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "試合記録を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ErrorMessage message={error} />

      <Card>
        <SectionTitle title="基本情報" />
        <TextField label="試合日" onChangeText={setPlayedAt} placeholder="2026-06-27" value={playedAt} />
        <View style={{ gap: 7 }}>
          <Text style={fieldLabelStyle}>試合種別</Text>
          <Segment
            onChange={setMatchType}
            options={[
              { label: "練習試合", value: "PRACTICE" },
              { label: "公式試合", value: "OFFICIAL" }
            ]}
            value={matchType}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle title="対戦相手" />
        <TextField label="対戦相手名" onChangeText={setOpponentName} placeholder="佐藤 太郎" value={opponentName} />
        <TextField label="相手所属チーム" onChangeText={setOpponentTeam} placeholder="〇〇クラブ" value={opponentTeam} />
      </Card>

      <Card>
        <SectionTitle title="スコア" />
        <View style={scoreHeaderStyle}>
          <Text style={scoreGameHeaderStyle} />
          <Text style={scoreColumnHeaderStyle}>自分</Text>
          <Text style={scoreDashHeaderStyle} />
          <Text style={scoreColumnHeaderStyle}>相手</Text>
        </View>
        {scores.map((score, index) => (
          <View key={score.set} style={scoreRowStyle}>
            <Text style={scoreGameLabelStyle}>{score.set}G</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => updateScore(index, "me", value)}
              placeholder=""
              style={scoreInputStyle}
              value={score.me}
            />
            <Text style={scoreDashStyle}>-</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => updateScore(index, "opp", value)}
              placeholder=""
              style={scoreInputStyle}
              value={score.opp}
            />
          </View>
        ))}
        <View style={setCountStyle}>
          <Text style={setCountLabelStyle}>セットカウント</Text>
          <Text style={setCountValueStyle}>
            {setCount.me} - {setCount.opp}
          </Text>
        </View>
      </Card>

      <Card>
        <SectionTitle title="結果・メモ" />
        <View style={resultBoxStyle}>
          <Text style={resultLabelStyle}>結果</Text>
          <Text style={[resultValueStyle, result === "LOSE" && { color: colors.danger }]}>
            {result === "WIN" ? "勝利" : result === "LOSE" ? "敗北" : "未判定"}
          </Text>
        </View>
        <TextField label="メモ" multiline onChangeText={setMemo} placeholder="試合の反省、よかった点" value={memo} />
      </Card>

      <Button loading={saving} loadingLabel={savingLabel} onPress={handleSave}>
        {submitLabel}
      </Button>
    </>
  );
}

function calculateSetCount(scores: ScoreInputRow[]) {
  return scores.reduce(
    (count, score) => {
      if (!score.me.trim() || !score.opp.trim()) {
        return count;
      }

      const me = Number(score.me);
      const opp = Number(score.opp);

      if (Number.isNaN(me) || Number.isNaN(opp) || me === opp) {
        return count;
      }

      if (me > opp) {
        count.me += 1;
      } else {
        count.opp += 1;
      }

      return count;
    },
    { me: 0, opp: 0 }
  );
}

function validateMatchInput({
  playedAt,
  opponentName,
  scores,
  result
}: {
  playedAt: string;
  opponentName: string;
  scores: ScoreInputRow[];
  result: ResultInput | null;
}):
  | { ok: true; result: ResultInput; scores: ScoreRow[] }
  | { ok: false; message: string } {
  if (!playedAt.trim()) {
    return { ok: false, message: "試合日を入力してください" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedAt.trim()) || Number.isNaN(Date.parse(playedAt))) {
    return { ok: false, message: "試合日はYYYY-MM-DD形式で入力してください" };
  }

  if (!opponentName.trim()) {
    return { ok: false, message: "対戦相手名を入力してください" };
  }

  const parsedScores: ScoreRow[] = [];

  for (const score of scores) {
    const me = score.me.trim();
    const opp = score.opp.trim();

    if (!me && !opp) {
      continue;
    }

    if (!me || !opp) {
      return { ok: false, message: `${score.set}Gは自分と相手の得点を両方入力してください` };
    }

    if (!/^\d+$/.test(me) || !/^\d+$/.test(opp)) {
      return { ok: false, message: `${score.set}Gの得点は数値で入力してください` };
    }

    if (Number(me) === Number(opp)) {
      return { ok: false, message: `${score.set}Gは同点にできません` };
    }

    parsedScores.push({
      set: score.set,
      me: Number(me),
      opp: Number(opp)
    });
  }

  if (parsedScores.length === 0) {
    return { ok: false, message: "少なくとも1ゲーム分のスコアを入力してください" };
  }

  if (!result) {
    return { ok: false, message: "勝敗を判定できるスコアを入力してください" };
  }

  return { ok: true, result, scores: parsedScores };
}

function normalizeMatchType(value?: MatchRecord["matchType"]): MatchTypeInput {
  return value === "OFFICIAL" || value === "TOURNAMENT" ? "OFFICIAL" : "PRACTICE";
}

function scoresToInput(scores?: ScoreRow[]) {
  const rows = initialScores.map((score) => ({ ...score }));

  for (const score of scores ?? []) {
    const index = score.set - 1;

    if (index >= 0 && index < rows.length) {
      rows[index] = {
        set: score.set,
        me: String(score.me),
        opp: String(score.opp)
      };
    }
  }

  return rows;
}

function toInputDate(value?: string) {
  return value?.slice(0, 10);
}

const fieldLabelStyle = {
  color: colors.text,
  fontSize: 13,
  fontWeight: "700" as const
};

const scoreHeaderStyle = {
  alignItems: "center" as const,
  flexDirection: "row" as const,
  gap: 8
};

const scoreGameHeaderStyle = {
  width: 42
};

const scoreColumnHeaderStyle = {
  color: colors.muted,
  flex: 1,
  fontSize: 12,
  fontWeight: "800" as const,
  textAlign: "center" as const
};

const scoreDashHeaderStyle = {
  width: 18
};

const scoreRowStyle = {
  alignItems: "center" as const,
  flexDirection: "row" as const,
  gap: 8
};

const scoreGameLabelStyle = {
  color: colors.text,
  fontSize: 15,
  fontWeight: "800" as const,
  width: 42
};

const scoreInputStyle = {
  ...styles.input,
  flex: 1,
  fontSize: 18,
  fontWeight: "800" as const,
  minHeight: 48,
  paddingHorizontal: 8,
  textAlign: "center" as const
};

const scoreDashStyle = {
  color: colors.muted,
  fontSize: 18,
  fontWeight: "800" as const,
  textAlign: "center" as const,
  width: 18
};

const setCountStyle = {
  alignItems: "center" as const,
  backgroundColor: "#ecfdf5",
  borderColor: "#a7f3d0",
  borderRadius: 8,
  borderWidth: 1,
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  paddingHorizontal: 14,
  paddingVertical: 12
};

const setCountLabelStyle = {
  color: colors.primaryDark,
  fontSize: 14,
  fontWeight: "800" as const
};

const setCountValueStyle = {
  color: colors.primaryDark,
  fontSize: 20,
  fontWeight: "900" as const
};

const resultBoxStyle = {
  alignItems: "center" as const,
  backgroundColor: "#f8fafc",
  borderColor: colors.border,
  borderRadius: 8,
  borderWidth: 1,
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  padding: 14
};

const resultLabelStyle = {
  color: colors.muted,
  fontSize: 13,
  fontWeight: "800" as const
};

const resultValueStyle = {
  color: colors.primaryDark,
  fontSize: 18,
  fontWeight: "900" as const
};
