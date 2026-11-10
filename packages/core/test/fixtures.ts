// Fictional test data. Never use real job postings in tests: their text belongs to someone else.

import type { Statement } from "../src";

export const SAMPLE_POSTING = `Frontendudvikler til Fiktivt Firma A/S

Om jobbet
Du bliver en del af et team på seks udviklere, der bygger vores kundeportal.
- Udvikle nye funktioner i React og TypeScript
- Samarbejde med designere og produktejere

Vi forventer, at du:
- Har erfaring med JavaScript og gerne TypeScript
- Er struktureret og har overblik
- Kommunikerer klart med interessenter

Vi tilbyder
En god løn, frugtordning og fleksible arbejdstider.

Ansøgning
Send din ansøgning senest 1. december.`;

export const SAMPLE_STATEMENTS: Statement[] = [
  {
    id: "react",
    type: "result",
    text: "Jeg byggede en bookingapp i React og TypeScript, som reducerede telefonopkald med 30 %.",
    tags: [],
  },
  {
    id: "stakeholders",
    type: "skill",
    text: "Jeg har stået for stakeholderhåndtering mellem udviklingsteamet og ledelsen.",
    tags: [],
  },
  {
    id: "structure",
    type: "personality",
    text: "Kolleger beskriver mig som systematisk og rolig, også når der er travlt.",
    tags: [],
  },
  {
    id: "baking",
    type: "skill",
    text: "Jeg bager surdejsbrød hver weekend.",
    tags: [],
  },
  {
    id: "motivation",
    type: "motivation",
    text: "Jeg brænder for at lave brugervenlige løsninger, der gør en forskel for kunderne.",
    tags: [],
  },
];
