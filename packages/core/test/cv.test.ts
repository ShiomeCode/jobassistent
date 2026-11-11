import { describe, expect, it } from "vitest";
import { buildCompetenceIndex, extractStatementCandidates, guessStatementType } from "../src";

const index = buildCompetenceIndex();

// Fictional CV, written for this test.
const SAMPLE_CV = `MARIA JENSEN
maria@example.com · 12 34 56 78
www.example.com/maria

PROFIL
Jeg er en rolig og struktureret kollega, der trives med mange bolde i luften.
Jeg brænder for at gøre hverdagen nemmere for kunderne.

ERHVERVSERFARING
2021 – nu Kundeservicemedarbejder, Fiktiv Forsikring A/S
- Reducerede ventetiden i telefonkøen med 25 % ved at indføre en ny vagtplan
- Oplærte otte nye kolleger i kundesystemet og interne
procedurer
- Har ansvar for kundekontakt på mail og telefon

UDDANNELSE
2018 – 2021 Kontoruddannelse
Kort.`;

describe("guessStatementType", () => {
  it.each([
    ["Jeg brænder for god kundeservice.", "motivation"],
    ["Øgede salget med 15 % på et år.", "result"],
    ["Mine kolleger beskriver mig som rolig.", "personality"],
    ["Erfaring med Excel og Power BI.", "skill"],
  ] as const)("%s -> %s", (text, expectedType) => {
    expect(guessStatementType(text)).toBe(expectedType);
  });
});

describe("extractStatementCandidates", () => {
  const candidates = extractStatementCandidates(SAMPLE_CV, index);
  const texts = candidates.map(candidate => candidate.text);

  it("skips names, contact details, headings, dates and short lines", () => {
    expect(texts.some(text => text.includes("@"))).toBe(false);
    expect(texts.some(text => text.includes("MARIA"))).toBe(false);
    expect(texts.some(text => text.startsWith("2021"))).toBe(false);
    expect(texts).not.toContain("Kort.");
  });

  it("keeps sentences and bullets, and joins lines broken mid-sentence", () => {
    expect(texts).toContain("Oplærte otte nye kolleger i kundesystemet og interne procedurer");
    expect(texts).toContain("Har ansvar for kundekontakt på mail og telefon");
    expect(texts).toHaveLength(5);
  });

  it("suggests a type and finds competences", () => {
    const resultCandidate = candidates.find(candidate => candidate.text.startsWith("Reducerede"));
    expect(resultCandidate?.suggestedType).toBe("result");

    const motivationCandidate = candidates.find(candidate => candidate.text.startsWith("Jeg brænder"));
    expect(motivationCandidate?.suggestedType).toBe("motivation");

    const personalityCandidate = candidates.find(candidate => candidate.text.startsWith("Jeg er en rolig"));
    expect(personalityCandidate?.suggestedType).toBe("personality");
    expect(personalityCandidate?.competenceIds).toContain("structure");

    const teachingCandidate = candidates.find(candidate => candidate.text.startsWith("Oplærte"));
    expect(teachingCandidate?.competenceIds).toContain("teaching");
  });

  it("does not return the same sentence twice", () => {
    const repeated = extractStatementCandidates(`${SAMPLE_CV}\n${SAMPLE_CV}`, index);
    expect(repeated).toHaveLength(candidates.length);
  });
});
