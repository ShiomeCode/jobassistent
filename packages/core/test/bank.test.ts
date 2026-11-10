import { describe, expect, it } from "vitest";
import { createBankExport, parseBankExport } from "../src";
import { SAMPLE_STATEMENTS } from "./fixtures";

describe("bank export and import", () => {
  const data = { experiences: [], statements: SAMPLE_STATEMENTS, applications: [] };

  it("round-trips through JSON", () => {
    const exported = JSON.parse(JSON.stringify(createBankExport(data)));
    const result = parseBankExport(exported);
    expect(result).toEqual({ isValid: true, value: data });
  });

  it("rejects files that are not bank exports", () => {
    expect(parseBankExport({ hello: "world" })).toEqual({ isValid: false, error: "notABankFile" });
  });

  it("rejects newer versions", () => {
    const exported = { ...createBankExport(data), version: 999 };
    expect(parseBankExport(exported)).toEqual({ isValid: false, error: "unsupportedVersion" });
  });

  it("rejects broken statements", () => {
    const exported = { ...createBankExport(data), statements: [{ id: "x", type: "unknown", text: "", tags: [] }] };
    expect(parseBankExport(exported)).toEqual({ isValid: false, error: "invalidStatements" });
  });
});
