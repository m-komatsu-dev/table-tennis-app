import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const appApiDir = join(dirname(fileURLToPath(import.meta.url)), "../app/api");
const publicRoutes = new Set(["auth/register/route.ts", "auth/[...nextauth]/route.ts"]);

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return routeFiles(fullPath);
    }

    return entry.name === "route.ts" ? [fullPath] : [];
  });
}

const protectedRoutes = routeFiles(appApiDir).filter((file) => {
  const routePath = relative(appApiDir, file);
  return !publicRoutes.has(routePath);
});

test("protected API routes require a logged-in user and return 401", () => {
  expect(protectedRoutes.length).toBeGreaterThan(0);

  for (const file of protectedRoutes) {
    const content = readFileSync(file, "utf8");

    expect(content, relative(appApiDir, file)).toMatch(/requireUserId\(\)/);
    expect(content, relative(appApiDir, file)).toMatch(/errorResponse\("認証が必要です", 401\)/);
  }
});

test("user-owned data API routes include userId in database queries", () => {
  const userOwnedRoutes = protectedRoutes.filter((file) => {
    const routePath = relative(appApiDir, file);
    return !routePath.startsWith("profile/") && !routePath.startsWith("ai/");
  });

  for (const file of userOwnedRoutes) {
    const content = readFileSync(file, "utf8");

    expect(content, relative(appApiDir, file)).toMatch(/userId/);
    expect(content, relative(appApiDir, file)).toMatch(/where:\s*{[\s\S]*userId/);
  }
});

test("AI routes scope context and saved menus to the logged-in user", () => {
  const context = readFileSync(join(appApiDir, "../../lib/ai/context.ts"), "utf8");
  const analyze = readFileSync(join(appApiDir, "ai/analyze/route.ts"), "utf8");
  const suggestion = readFileSync(join(appApiDir, "ai/practice-menu/route.ts"), "utf8");
  const save = readFileSync(join(appApiDir, "ai/practice-menu/save/route.ts"), "utf8");

  expect(analyze).toMatch(/buildAiCoachContext\(userId\)/);
  expect(suggestion).toMatch(/buildAiCoachContext\(userId\)/);
  expect((context.match(/where:\s*{ userId }/g) ?? []).length).toBeGreaterThanOrEqual(5);
  expect(save).toMatch(/toPracticeMenuCreateData\(userId, suggestion\)/);
});

test("AI rate-limit denial is mapped to HTTP 429", () => {
  const helper = readFileSync(join(appApiDir, "../../lib/ai/route-helpers.ts"), "utf8");
  expect(helper).toMatch(/status:\s*429/);
  expect(helper).toMatch(/Retry-After/);
});

test("practice menu detail API scopes reads, updates and deletes to the logged-in user", () => {
  const route = readFileSync(join(appApiDir, "practice-menus/[id]/route.ts"), "utf8");

  expect(route).toMatch(/findFirst\(\{[\s\S]*where:\s*\{ id, userId \}/);
  expect(route).toMatch(/deleteMany\(\{[\s\S]*where:\s*\{ id, userId \}/);
});

test.each([
  ["practice log", "practice/[id]/route.ts", "practiceLog"],
  ["match record", "match/[id]/route.ts", "matchRecord"],
  ["practice menu", "practice-menus/[id]/route.ts", "practiceMenu"],
  ["equipment", "equipment/[id]/route.ts", "equipment"]
])("%s detail reads are scoped to id and userId", (_label, routePath, model) => {
  const route = readFileSync(join(appApiDir, routePath), "utf8");
  expect(route).toMatch(new RegExp(`prisma\\.${model}\\.findFirst\\(\\{[\\s\\S]*?where:\\s*\\{ id, userId \\}`));
});

test.each([
  ["practice log", "practice/[id]/route.ts", "practiceLog"],
  ["match record", "match/[id]/route.ts", "matchRecord"],
  ["equipment", "equipment/[id]/route.ts", "equipment"]
])("%s edits and deletes cannot target another user", (_label, routePath, model) => {
  const route = readFileSync(join(appApiDir, routePath), "utf8");
  expect(route).toMatch(new RegExp(`prisma\\.${model}\\.updateMany\\(\\{[\\s\\S]*?where:\\s*\\{ id, userId \\}`));
  expect(route).toMatch(new RegExp(`prisma\\.${model}\\.deleteMany\\(\\{[\\s\\S]*?where:\\s*\\{ id, userId \\}`));
});
