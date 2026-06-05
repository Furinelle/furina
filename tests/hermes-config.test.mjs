import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  configHasExternalDir,
  hasEnvKey,
  mergeHermesConfig
} from "../scripts/lib/hermes-config.mjs";

const skillDir = path.resolve("/tmp/furina/hermes/skills");

describe("Hermes config merge", () => {
  it("adds an external skill directory without changing unrelated config", () => {
    const source = [
      "model:",
      "  default: deepseek-v4-pro",
      "web:",
      '  search_backend: ""',
      "custom:",
      "  keep_me: true",
      ""
    ].join("\n");

    const merged = mergeHermesConfig(source, skillDir);

    assert.match(merged, /custom:\n  keep_me: true/);
    assert.match(merged, /skills:\n  external_dirs:\n    - "\/tmp\/furina\/hermes\/skills"/);
    assert.doesNotMatch(merged, /search_backend:\s*exa/);
    assert.equal(configHasExternalDir(merged, skillDir), true);
  });

  it("preserves existing external directories and is idempotent", () => {
    const source = [
      "skills:",
      "  external_dirs:",
      '    - "/opt/shared-skills"',
      "display:",
      "  language: zh",
      ""
    ].join("\n");

    const once = mergeHermesConfig(source, skillDir);
    const twice = mergeHermesConfig(once, skillDir);

    assert.match(once, /- "\/opt\/shared-skills"/);
    assert.equal(once, twice);
  });

  it("expands an empty external_dirs list", () => {
    const source = "skills:\n  external_dirs: []\n";
    const merged = mergeHermesConfig(source, skillDir);

    assert.match(merged, /external_dirs:\n    - "\/tmp\/furina\/hermes\/skills"/);
  });

  it("recognizes the indentless sequence style emitted by Hermes", () => {
    const source = [
      "skills:",
      "  external_dirs:",
      `  - ${skillDir}`,
      "  template_vars: true",
      ""
    ].join("\n");

    assert.equal(configHasExternalDir(source, skillDir), true);
    assert.equal(mergeHermesConfig(source, skillDir), source);
  });

  it("prefers Exa only when requested and the search backend is blank", () => {
    const source = [
      "web:",
      "  backend: ''",
      "  search_backend: ''",
      "skills:",
      "  external_dirs:",
      `  - ${skillDir}`,
      ""
    ].join("\n");

    const merged = mergeHermesConfig(source, skillDir, { preferExa: true });

    assert.match(merged, /search_backend: exa/);
    assert.match(merged, /backend: ''/);
  });

  it("preserves an explicitly selected search backend", () => {
    const source = [
      "web:",
      "  search_backend: tavily",
      ""
    ].join("\n");

    const merged = mergeHermesConfig(source, skillDir, { preferExa: true });

    assert.match(merged, /search_backend: tavily/);
    assert.doesNotMatch(merged, /search_backend: exa/);
  });
});

describe("Hermes environment detection", () => {
  it("detects configured keys without exposing values", () => {
    const env = [
      "# local secrets",
      "DEEPSEEK_API_KEY=secret",
      "EXA_API_KEY = another-secret",
      ""
    ].join("\n");

    assert.equal(hasEnvKey(env, "EXA_API_KEY"), true);
    assert.equal(hasEnvKey(env, "TAVILY_API_KEY"), false);
  });
});
