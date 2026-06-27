import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const appApiDir = join(dirname(fileURLToPath(import.meta.url)), "../app/api");
const publicRoutes = new Set([
  "auth/register/route.ts",
  "auth/[...nextauth]/route.ts",
  "debug-auth/route.ts"
]);

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
  return !publicRoutes.has(routePath) && !routePath.startsWith("mobile/");
});

const mobileRoutes = routeFiles(join(appApiDir, "mobile")).filter((file) => {
  const routePath = relative(join(appApiDir, "mobile"), file);
  return routePath !== "auth/login/route.ts" && routePath !== "auth/register/route.ts";
});

test("protected API routes require a logged-in user and return 401", () => {
  expect(protectedRoutes.length).toBeGreaterThan(0);

  for (const file of protectedRoutes) {
    const content = readFileSync(file, "utf8");

    expect(content, relative(appApiDir, file)).toMatch(/requireUserId\(\)/);
    expect(content, relative(appApiDir, file)).toMatch(/errorResponse\("認証が必要です", 401\)/);
  }
});

test("mobile API routes use bearer token auth and return 401", () => {
  expect(mobileRoutes.length).toBeGreaterThan(0);

  for (const file of mobileRoutes) {
    const content = readFileSync(file, "utf8");

    expect(content, relative(appApiDir, file)).toMatch(/requireMobileAuth\(request\)/);
    expect(content, relative(appApiDir, file)).toMatch(/mobileError\("認証が必要です", 401\)/);
  }
});

test("middleware does not perform auth redirects and keeps API routes public", () => {
  const middleware = readFileSync(join(appApiDir, "../../middleware.ts"), "utf8");

  expect(middleware).not.toMatch(/getToken/);
  expect(middleware).not.toMatch(/NextResponse\.redirect/);
  expect(middleware).toMatch(/matcher:\s*\["\/\(\(\?!api\|_next\/static\|_next\/image\|favicon\.ico\)\.\*\)"\]/);
});

test("debug auth route only exposes auth state booleans", () => {
  const route = readFileSync(join(appApiDir, "debug-auth/route.ts"), "utf8");

  expect(route).toMatch(/hasSession/);
  expect(route).toMatch(/hasUser/);
  expect(route).toMatch(/hasUserId/);
  expect(route).not.toMatch(/passwordHash|token|cookie|secret|email/i);
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

test("mobile user-owned data API routes include userId in database queries", () => {
  const userOwnedRoutes = mobileRoutes.filter((file) => {
    const routePath = relative(appApiDir, file);
    return !routePath.startsWith("me/") && !routePath.startsWith("profile/");
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
