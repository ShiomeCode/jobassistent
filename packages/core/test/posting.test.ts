import { describe, expect, it } from "vitest";
import { buildCompetenceIndex, detectCompetences, detectSection, extractRequirements } from "../src";
import { SAMPLE_POSTING } from "./fixtures";

const index = buildCompetenceIndex();

describe("detectSection", () => {
  it.each([
    ["Vi forventer, at du:", "expectations"],
    ["Om dig", "expectations"],
    ["Dine opgaver", "tasks"],
    ["Om os", "aboutUs"],
    ["Vi tilbyder", "aboutUs"],
  ] as const)("classifies %s as %s", (heading, section) => {
    expect(detectSection(heading)).toBe(section);
  });
});

describe("detectCompetences", () => {
  it("finds competences through synonyms and inflections", () => {
    expect(detectCompetences("Du er en god teamspiller", index)).toContain("collaboration");
    expect(detectCompetences("Erfaring med stakeholderhåndtering", index)).toContain("stakeholder-management");
    expect(detectCompetences("Kommunikerer klart med interessenter", index)).toEqual(
      expect.arrayContaining(["communication", "stakeholder-management"]),
    );
  });

  it("finds competences inside compound words", () => {
    expect(detectCompetences("Erfaring med personaleledelse", index)).toContain("leadership");
  });

  it("recognizes tech names", () => {
    expect(detectCompetences("Kendskab til C# og .NET", index)).toContain("csharp");
  });
});

describe("extractRequirements", () => {
  const requirements = extractRequirements(SAMPLE_POSTING, index);

  it("turns each bullet into a requirement in the right section", () => {
    const javascriptRequirement = requirements.find(requirement => requirement.text.startsWith("Har erfaring med JavaScript"));
    expect(javascriptRequirement?.section).toBe("expectations");
    expect(javascriptRequirement?.competenceIds).toContain("javascript");

    const reactTask = requirements.find(requirement => requirement.text.includes("React"));
    expect(reactTask?.section).toBe("tasks");
  });

  it("puts benefits in the about-us section", () => {
    const salaryRequirement = requirements.find(requirement => requirement.text.includes("løn"));
    expect(salaryRequirement?.section).toBe("aboutUs");
  });

  it("does not turn headings into requirements", () => {
    expect(requirements.some(requirement => requirement.text === "Om jobbet")).toBe(false);
  });
});
