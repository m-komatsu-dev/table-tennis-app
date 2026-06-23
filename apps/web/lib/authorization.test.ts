import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
  assert.ok(protectedRoutes.length > 0);

  for (const file of protectedRoutes) {
    const content = readFileSync(file, "utf8");

    assert.match(content, /requireUserId\(\)/, relative(appApiDir, file));
    assert.match(content, /errorResponse\("認証が必要です", 401\)/, relative(appApiDir, file));
  }
});

test("user-owned data API routes include userId in database queries", () => {
  const userOwnedRoutes = protectedRoutes.filter((file) => {
    const routePath = relative(appApiDir, file);
    return !routePath.startsWith("profile/") && !routePath.startsWith("ai/");
  });

  for (const file of userOwnedRoutes) {
    const content = readFileSync(file, "utf8");

    assert.match(content, /userId/, relative(appApiDir, file));
    assert.match(content, /where:\s*{[\s\S]*userId/, relative(appApiDir, file));
  }
});

test("AI routes scope context and saved menus to the logged-in user", () => {
  const context = readFileSync(join(appApiDir, "../../lib/ai/context.ts"), "utf8");
  const analyze = readFileSync(join(appApiDir, "ai/analyze/route.ts"), "utf8");
  const suggestion = readFileSync(join(appApiDir, "ai/practice-menu/route.ts"), "utf8");
  const save = readFileSync(join(appApiDir, "ai/practice-menu/save/route.ts"), "utf8");

  assert.match(analyze, /buildAiCoachContext\(userId\)/);
  assert.match(suggestion, /buildAiCoachContext\(userId\)/);
  assert.ok((context.match(/where:\s*{ userId }/g) ?? []).length >= 5);
  assert.match(save, /toPracticeMenuCreateData\(userId, suggestion\)/);
});

test("practice menu detail API scopes reads, updates and deletes to the logged-in user", () => {
  const route = readFileSync(join(appApiDir, "practice-menus/[id]/route.ts"), "utf8");

  assert.match(route, /findFirst\(\{[\s\S]*where:\s*\{ id, userId \}/);
  assert.match(route, /deleteMany\(\{[\s\S]*where:\s*\{ id, userId \}/);
});
