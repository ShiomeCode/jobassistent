# Contributing to Jobassistent

Thank you for helping! This guide covers how the project is organised and the code conventions everyone follows.

## Getting started

```bash
npm install
npm run dev        # start the web app at http://localhost:5173
npm test           # run the core tests
npm run typecheck  # type-check all packages
```

## Project structure

```
packages/core   Data model, Danish text normalization and matching. No UI, fully tested.
  data/         Competence dictionary and stop words (JSON) – the easiest place to contribute.
  src/          Source code.
  test/         Tests (Vitest).
apps/web        The web app (React + Vite). Stores everything locally in IndexedDB.
  src/texts/    All UI text. Danish today, ready for more languages.
```

## Language

- **Code is written in English:** names, comments, commit messages and pull requests.
- **The UI is Danish.** Never write UI text directly in a component. Add it to `apps/web/src/texts/da.ts` and use `t("key")`.

## Naming conventions

| What | Rule | Example |
|---|---|---|
| React components | PascalCase, file has the same name | `StatementCard.tsx` |
| Functions | camelCase, start with a verb | `parsePosting`, `scoreStatement`, `getSuggestions` |
| Booleans | Start with `is` or `has` | `isSelected`, `hasTags` |
| Event handlers | `handleX` inside the component, `onX` as a prop | `handleSubmit`, `onSave` |
| Custom hooks | Start with `use` | `useStatementBank` |
| Constants | UPPER_SNAKE_CASE | `MAX_SUGGESTIONS_PER_SLOT` |
| Types and interfaces | PascalCase nouns | `Statement`, `TemplateSlot` |

### Lambdas

- Name the parameter after the item, in full: `statements.map(statement => statement.id)`, not `s => s.id`.
- Use `first`/`second` in sort comparators: `.sort((first, second) => second.score - first.score)`.
- If a lambda grows beyond one line of logic, turn it into a named function.

## Comments

- Every file starts with a one-line comment saying what it is for.
- Explain **why**, not what. The code already says what.
- **Consumer comments:** every component and hook states where it is used, on the line above its declaration. Update the comment when you start or stop using it somewhere.

```tsx
// Used on page: BankPage, ApplicationPage
export function StatementCard(...) {
```

If it is used inside another component, name the page and the parent:

```tsx
// Used on page: ApplicationPage (inside PostingPanel)
```

## Contributing to the competence dictionary

The matching is only as good as `packages/core/data/competences.da.json`. Each entry has an id, a Danish label and the words that signal it:

```json
{ "id": "collaboration", "label": "Samarbejde", "terms": ["samarbejde", "teamwork", "teamspiller"] }
```

- Write terms in their basic form. Most inflections are handled by the stemmer.
- Also add past-tense verbs (e.g. "oplærte", "koordinerede"). CVs are usually written in the past tense, and the stemmer does not connect "oplærte" with "oplære".
- Multi-word terms match when all the words appear in the same sentence.
- Avoid very general words that would cause false matches (e.g. "udvikling", which also means personal development).
- Add a test in `packages/core/test/posting.test.ts` when you add a tricky synonym.

## Test data

Only use **fictional** job postings in tests. Real postings are owned by the employer or the job site.

## Privacy

The app promises that no data leaves the user's browser. Do not add analytics, external fonts, CDNs or network requests of any kind without discussing it in an issue first.

## Pull requests

1. Create a branch from `main`.
2. Make sure `npm test` and `npm run typecheck` pass.
3. Describe what you changed and why.
