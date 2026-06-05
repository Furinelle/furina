# Hermes Furina Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct OOC-prone Furina guidance and ship a Hermes adapter that uses the repository as its canonical resource source, prefers Exa for missing lore, and makes Furina the local Hermes default identity.

**Architecture:** Keep `src/` and `furina_resource/` canonical. Add a short Hermes `SOUL.md` for global identity and a progressive-disclosure Hermes skill under `hermes/skills/`; extend the existing Node installer to merge an external skill directory into Hermes YAML without replacing unrelated configuration.

**Tech Stack:** Markdown, Node.js 18+, Node test runner, JSON-compatible YAML subset for deterministic config edits, Hermes Agent CLI.

---

### Task 1: Lock OOC Corrections into Canonical Resources

**Files:**
- Modify: `src/prompt/system.md`
- Modify: `src/prompt/_shared_runtime.md`
- Modify: `src/prompt/runtime_lite.md`
- Modify: `src/rules/ooc_rules.md`
- Modify: `furina_resource/01_profile.md`
- Modify: `furina_resource/02_personality.md`
- Modify: `furina_resource/03_story_timeline.md`
- Modify: `furina_resource/05_voice_style.md`
- Modify: `furina_resource/11_sensitive_topics.md`
- Modify: `eval/furina_voice_cases.md`

- [ ] **Step 1: Add failing static characterization tests**

Create `tests/persona-content.test.mjs` with assertions that canonical files
identify Furina as human, do not use `PTSD`, do not require `6 字以内`, preserve
the intentional high-intimacy confession acceptance path, and retain
local-resource-first routing.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/persona-content.test.mjs`

Expected: failures for the current species progression, clinical label,
mechanical word-count rule, or missing fan-work labeling.

- [ ] **Step 3: Apply evidence-grounded wording corrections**

Edit the listed canonical files so demonstrated behavior remains, inferred
material is labeled, mechanical dialogue formulas become optional, and the
fan-work intimacy progression remains explicit: low intimacy keeps distance
while high intimacy can accept a confession.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/persona-content.test.mjs`

Expected: all persona-content tests pass.

### Task 2: Add Hermes Identity and Skill

**Files:**
- Create: `hermes/SOUL.md`
- Create: `hermes/skills/furina-roleplay/SKILL.md`
- Create: `tests/hermes-assets.test.mjs`

- [ ] **Step 1: Add failing asset-contract tests**

Assert that `SOUL.md` is concise, task-first, and post-Archon; assert that the
Hermes skill has valid frontmatter, references `${HERMES_SKILL_DIR}`, reads
`furina_resource/00_index.md` first, limits targeted reads, and documents
native web search with Exa preference and fallback.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/hermes-assets.test.mjs`

Expected: failure because Hermes assets do not exist.

- [ ] **Step 3: Write the identity and progressive-disclosure skill**

Keep SOUL global and path-free. Put all repository lookup, web fallback,
roleplay routing, task-mode behavior, and verification instructions in the
skill.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/hermes-assets.test.mjs`

Expected: all Hermes asset tests pass.

### Task 3: Extend the Installer for Hermes

**Files:**
- Modify: `scripts/setup.mjs`
- Create: `scripts/lib/hermes-config.mjs`
- Create: `tests/hermes-config.test.mjs`
- Create: `tests/setup-hermes.test.mjs`

- [ ] **Step 1: Add failing config-merge tests**

Test a function that preserves existing YAML, adds one normalized
`skills.external_dirs` entry idempotently, sets a blank search backend to Exa
when requested, and preserves an explicit existing backend.

- [ ] **Step 2: Run config tests and verify RED**

Run: `node --test tests/hermes-config.test.mjs`

Expected: module-not-found or missing-export failure.

- [ ] **Step 3: Implement deterministic Hermes config merging**

Update only the top-level `skills` mapping with a line-aware merger that
preserves all other text exactly. Serialize inserted paths as quoted YAML
scalars.

- [ ] **Step 4: Add failing setup integration tests**

Run the installer against a temporary `--hermes-home`, verify backup creation,
SOUL installation, external directory configuration, idempotency, and
`--check --hermes`.

- [ ] **Step 5: Implement `--hermes` setup/check support**

Add `--hermes-home`, target selection, backup-safe SOUL installation,
Hermes config merging, Exa-key detection by key name only, and check output.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
node --test tests/hermes-config.test.mjs tests/setup-hermes.test.mjs
```

Expected: all Hermes config and setup tests pass.

### Task 4: Synchronize Metadata and Documentation

**Files:**
- Modify: `README.md`
- Modify: `SETUP_GUIDE.md`
- Modify: `scripts/README.md`
- Modify: `config/manifest.json`
- Modify: `config/settings.json`
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `scripts/sync-references.mjs` only if canonical sync coverage requires it

- [ ] **Step 1: Document branch positioning and Hermes architecture**

Add quick-start commands, exact installed paths, backup behavior, external
directory rationale, Exa preference/fallback, task-first persona behavior,
and troubleshooting for skill discovery and stale sessions.

- [ ] **Step 2: Update metadata**

Add Hermes capabilities and entry points, align package/manifest versions,
and record the release in the changelog.

- [ ] **Step 3: Synchronize fallback references**

Run: `node scripts/sync-references.mjs`

Expected: changed canonical prompt/rule/resource files are copied to the Codex
fallback tree.

### Task 5: Install and Verify on the Local Hermes Instance

**Files:**
- Modify outside repo: `~/.hermes/SOUL.md`
- Modify outside repo: `~/.hermes/config.yaml`

- [ ] **Step 1: Run dry-run and inspect actions**

Run:

```bash
node scripts/setup.mjs --hermes --dry-run
```

Expected: reports SOUL backup/install, external skill directory merge, and Exa
selection without changing files.

- [ ] **Step 2: Install and check**

Run:

```bash
node scripts/setup.mjs --hermes
node scripts/setup.mjs --check --hermes
```

Expected: all Hermes checks report `ok`.

- [ ] **Step 3: Verify Hermes runtime state**

Run:

```bash
hermes status
hermes config show
hermes skills list
```

Expected: DeepSeek v4 Pro and existing messaging state remain; the Furina
skill is enabled and the active search backend resolves to Exa.

- [ ] **Step 4: Run fresh-session roleplay and task-mode smoke tests**

Use non-interactive fresh queries to test self-identification, a technical
task, a local-resource lore question, and a missing-lore web-search question.
Inspect Hermes logs for `skill_view`, file reads under `furina_resource/`, and
Exa-backed `web_search`.

### Task 6: Full Verification, Commit, and Push

**Files:**
- All changed repository files

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
node --test tests/*.test.mjs
node scripts/sync-references.mjs --check
node scripts/setup.mjs --dry-run
node scripts/setup.mjs --check --hermes
git diff --check
```

Expected: zero test failures, zero unsynchronized files, successful checks,
and no whitespace errors.

- [ ] **Step 2: Audit every user requirement**

Confirm current evidence for OOC correction, Hermes branch/assets, canonical
resource retrieval, Exa and alternative search fallback, docs, local default
identity, Git commit, and remote branch.

- [ ] **Step 3: Commit**

```bash
git add README.md SETUP_GUIDE.md CHANGELOG.md package.json config \
  docs hermes scripts src furina_resource eval tests codex
git commit -m "feat(hermes): add Furina identity and skill adapter"
```

- [ ] **Step 4: Push**

Run: `git push -u origin codex/hermes-furina-adapter`

Expected: the remote branch is created and tracks
`origin/codex/hermes-furina-adapter`.
