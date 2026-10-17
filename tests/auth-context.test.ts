import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
import { localAuthIssue, login, register } from "../src/storage";

afterEach(() => vi.unstubAllGlobals());

it("HTTP에서는 계정을 만들거나 비밀번호 오류로 오인하게 하지 않는다", async () => {
  vi.stubGlobal("isSecureContext", false);
  expect(localAuthIssue()).toContain("HTTPS");
  await expect(register("blocked_context", "검증", "Fixture_Only_123")).rejects.toThrow("HTTPS");
  await expect(login("blocked_context", "Fixture_Only_123")).rejects.toThrow("HTTPS");
  vi.unstubAllGlobals();
  await expect(login("blocked_context", "Fixture_Only_123")).rejects.toThrow("올바르지");
});

it("Web Crypto가 없으면 저장소 조회 전에 연결 문제를 설명한다", async () => {
  vi.stubGlobal("crypto", undefined);
  await expect(login("missing_user", "Fixture_Only_123")).rejects.toThrow("HTTPS");
  await expect(register("missing_crypto", "검증", "Fixture_Only_123")).rejects.toThrow("HTTPS");
});
