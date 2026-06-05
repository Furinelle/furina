# Hermes Furina Adapter Design

## Goal

Improve the canonical Furina characterization where the current repository
overstates or rigidly encodes non-canonical behavior, then add a first-class
Hermes Agent adapter that:

- makes Furina the default Hermes identity;
- lets Hermes discover the repository skill without copying the canonical
  `furina_resource/` tree;
- routes Furina questions through local resources first;
- uses Hermes web search, with Exa preferred when configured, only when local
  resources are insufficient;
- preserves reliable tool use and concise technical communication.

## Characterization Corrections

The canonical files will distinguish Furina's human body and spirit from
Focalors' separated divinity. Focalors' earlier Oceanid and divine history
must not be presented as Furina's personal species progression.

Furina's demonstrated secret investigations and persistence support an
active, capable interpretation. They do not support claims that she designed
Focalors' plan, managed a complete intelligence network, or knowingly
coordinated the whole prophecy response. The repository will describe only
what the story shows.

Trauma-sensitive behavior will be expressed through natural changes in
speech: shorter phrases, pauses, reduced theatricality, avoidance, or an
explicit boundary. Clinical diagnoses and exact word-count mandates are not
canonical characterization and will be removed.

Romantic roleplay will be separated from canonical default behavior. A stored
intimacy score may adjust warmth and familiarity, but must not by itself
create consent, romance, exclusivity, or automatic acceptance. Romantic
progression is available only when the user explicitly establishes a
non-canonical relationship roleplay.

Voice guidance will treat stage imagery, self-correction, and three-beat
reactions as optional tools rather than mandatory templates. This prevents
every response from sounding generated from the same formula.

## Hermes Architecture

### Global Identity

`hermes/SOUL.md` will contain the durable, platform-wide identity. It will be
short enough for Hermes' primary identity slot and will define:

- default simplified Chinese;
- Furina's post-Archon identity and recognizable voice;
- natural variation instead of catchphrase repetition;
- task-first behavior for code, configuration, research, safety, and tool use;
- epistemic honesty and respect for higher-priority instructions.

It will not contain repository paths or installation commands.

### On-Demand Skill

`hermes/skills/furina-roleplay/SKILL.md` will be a Hermes-native skill using
standard frontmatter and progressive disclosure. The installed Hermes
configuration will add the repository's `hermes/skills` directory to
`skills.external_dirs`.

The skill will use `${HERMES_SKILL_DIR}` to locate the adapter directory, walk
up to the repository root, and then read canonical files from `src/` and
`furina_resource/`. It will read `00_index.md` first and no more than one or
two targeted resource files per request.

Local resources have precedence over web material. If they do not answer a
specific lore question, Hermes uses its native `web_search` and `web_extract`
tools. The setup will explicitly select Exa when `EXA_API_KEY` exists.
Hermes' provider registry can fall back to another configured search backend
when Exa is unavailable.

### Installer

The existing Node installer will gain a `--hermes` target and
`--hermes-home <dir>` override. Installation will:

1. create a timestamped backup of an existing non-identical `SOUL.md`;
2. install the repository Furina identity to `$HERMES_HOME/SOUL.md`;
3. merge the repository `hermes/skills` path into `skills.external_dirs`
   without removing existing entries;
4. preserve unrelated Hermes configuration;
5. set `web.search_backend` and `web.extract_backend` to `exa` only when an
   Exa key is already configured;
6. check identity, external skill discovery, and canonical resource access.

The installer will not modify API keys, provider/model settings, Telegram
credentials, or the user's 1,000,000-token DeepSeek preference.

## Verification

Automated tests will cover argument targeting, YAML config merging,
idempotency, backup behavior, and installation checks in a temporary Hermes
home. Existing memory tests and reference synchronization must remain green.

Local end-to-end verification will prove:

- Hermes lists and can load `furina-roleplay`;
- a fresh Hermes query identifies itself as Furina and keeps technical answers
  task-focused;
- a local-resource question cites or uses the canonical repository;
- an uncovered lore query invokes Hermes web search through Exa;
- DeepSeek v4 Pro, the 1,000,000 context window, Telegram, and unrelated
  settings remain intact.

