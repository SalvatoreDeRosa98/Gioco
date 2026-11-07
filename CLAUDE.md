# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: nessuno. Gioco web statico (HTML, SVG, CSS, JavaScript a moduli ES, senza build).
- **Code root**: `gioco/` (motore in `gioco/motore/`, contenuti in `gioco/contenuti/`, QA in `gioco/qa/`).
- **Version Control**: Git, branch di lavoro `claude/*`, commit in Conventional Commits.
- **Verifica**: Playwright (preinstallato nella sessione cloud) per screenshot ed esplorazione
  automatica di tutti i percorsi narrativi.
- **Stile**: teatro delle ombre. Vedi `design/game-brief.md` (record di design, modalità `minimal`).

> **Riavvio v2 (2026-11-07).** Il progetto è ripartito da zero conservando solo trama e ambientazione.
> Il codice Godot v1, l'arte generata e gli strumenti sono nella storia di git (branch
> `claude/optimistic-wozniak-9l570p`), non sul branch corrente. Gli agenti e le skill specifici di
> Godot/Unity/Unreal in `.claude/` non si applicano: usare `gameplay-programmer`, `ui-programmer`,
> `technical-artist`, `narrative-director`, `writer`.

## Fonti di verità

1. `trama/ferruccio-bibbia.md` — la storia. Non si modifica senza l'autore.
2. `trama/inizio-memoria-e-doni.md` — decisioni dell'autore che integrano la bibbia.
3. `trama/storia.json` — mappa macchina di scene, scelte, condizioni e battute (derivata).
4. `design/game-brief.md` — cosa è il gioco, cosa è dentro e cosa è fuori.
5. `docs/architecture/motore-web.md` — come è fatto il motore.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

<!-- ENGINE-REFERENCE-IMPORT: the line below is engine-specific. /setup-engine
     rewrites it to @docs/engine-reference/<engine>/VERSION.md for the chosen
     engine, so a Unity or Unreal project stops loading the Godot reference every
     session. It defaults to Godot (the template's example engine); skills that
     need the pinned version read docs/engine-reference/<engine>/VERSION.md on
     demand regardless of this import. -->
`docs/engine-reference/godot/` è storico (v1) e non si applica più.


## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`. It is no longer imported here: before
`/setup-engine` runs it is almost entirely `[TO BE CONFIGURED]` placeholders, and
after it runs `project.yaml` holds the real values.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)
