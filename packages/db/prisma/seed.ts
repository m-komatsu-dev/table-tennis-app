import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testUser = {
  email: "portfolio@example.com",
  name: "ポートフォリオ 太郎",
  password: "password1234"
};

async function main() {
  const passwordHash = await bcrypt.hash(testUser.password, 12);
  const user = await prisma.user.upsert({
    where: { email: testUser.email },
    create: {
      email: testUser.email,
      name: testUser.name,
      passwordHash,
      level: "INTERMEDIATE",
      gender: "MALE",
      club: "Table Tennis Club",
      playStyle: "右シェーク攻撃型。フォアドライブから展開する練習中。"
    },
    update: {
      name: testUser.name,
      passwordHash,
      level: "INTERMEDIATE",
      gender: "MALE",
      club: "Table Tennis Club",
      playStyle: "右シェーク攻撃型。フォアドライブから展開する練習中。"
    }
  });

  await prisma.practiceLog.deleteMany({ where: { userId: user.id } });
  await prisma.matchRecord.deleteMany({ where: { userId: user.id } });
  await prisma.equipment.deleteMany({ where: { userId: user.id } });

  const mainRacket = await prisma.equipment.create({
    data: {
      userId: user.id,
      blade: "インナーフォース レイヤー ALC",
      gripType: "フレア",
      rubberFh: "テナジー05",
      rubberFhThickness: "特厚",
      rubberBh: "ディグニクス05",
      rubberBhThickness: "特厚",
      isCurrent: true
    }
  });

  const controlRacket = await prisma.equipment.create({
    data: {
      userId: user.id,
      blade: "スワット",
      gripType: "ストレート",
      rubberFh: "ロゼナ",
      rubberFhThickness: "厚",
      rubberBh: "ファスターク C-1",
      rubberBhThickness: "厚",
      isCurrent: false
    }
  });

  await prisma.practiceLog.createMany({
    data: [
      {
        userId: user.id,
        practicedAt: new Date("2026-06-12T10:00:00.000Z"),
        durationMin: 120,
        location: "市民体育館",
        content: "フォア対フォア、3球目攻撃、バックブロックを重点練習。",
        equipmentId: mainRacket.id
      },
      {
        userId: user.id,
        practicedAt: new Date("2026-06-05T11:00:00.000Z"),
        durationMin: 90,
        location: "クラブ練習場",
        content: "サーブの回転量確認とレシーブからの展開。",
        equipmentId: mainRacket.id
      },
      {
        userId: user.id,
        practicedAt: new Date("2026-05-22T12:00:00.000Z"),
        durationMin: 75,
        location: "学校体育館",
        content: "バックハンドの安定性確認。台上処理でミスを減らす。",
        equipmentId: controlRacket.id
      }
    ]
  });

  await prisma.matchRecord.createMany({
    data: [
      {
        userId: user.id,
        opponentName: "佐藤",
        opponentTeam: "市民卓球クラブ",
        matchType: "PRACTICE",
        scores: [
          { set: 1, me: 11, opp: 8 },
          { set: 2, me: 9, opp: 11 },
          { set: 3, me: 11, opp: 7 }
        ],
        result: "WIN",
        memo: "相手のバック側へ深く送る展開が有効だった。",
        playedAt: new Date("2026-06-10T10:00:00.000Z")
      },
      {
        userId: user.id,
        opponentName: "鈴木",
        opponentTeam: "青葉卓球会",
        matchType: "OFFICIAL",
        scores: [
          { set: 1, me: 7, opp: 11 },
          { set: 2, me: 11, opp: 9 },
          { set: 3, me: 8, opp: 11 }
        ],
        result: "LOSE",
        memo: "レシーブが浮いた場面が多かった。短く止める練習が必要。",
        playedAt: new Date("2026-05-28T10:00:00.000Z")
      },
      {
        userId: user.id,
        opponentName: "田中",
        opponentTeam: null,
        matchType: "OFFICIAL",
        scores: [
          { set: 1, me: 11, opp: 6 },
          { set: 2, me: 11, opp: 9 },
          { set: 3, me: 11, opp: 5 }
        ],
        result: "WIN",
        memo: "序盤から先手を取れた。サーブ3球目の精度が良い。",
        playedAt: new Date("2026-04-20T10:00:00.000Z")
      }
    ]
  });

  console.log("Seed completed");
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
