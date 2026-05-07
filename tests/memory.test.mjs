import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  clamp,
  normalizeSoulState,
  cleanContent,
  inferType,
  inferPriority,
  inferTags,
  defaultStrength,
  memoryIdNumber,
  formatMemoryId,
  uniqueStrings,
  tokenSet,
  overlapScore,
  isCasualGreeting,
  similarContent,
  normalizeMemory,
  normalizeStore,
  parseMemoryTags,
  heart
} from "../scripts/furina-memory.mjs";

describe("clamp", () => {
  it("clamps within range", () => assert.equal(clamp(5, 0, 10), 5));
  it("clamps below min", () => assert.equal(clamp(-1, 0, 10), 0));
  it("clamps above max", () => assert.equal(clamp(15, 0, 10), 10));
  it("returns min for NaN", () => assert.equal(clamp(NaN, 0, 10), 0));
  it("returns min for non-finite inputs", () => assert.equal(clamp(Infinity, 0, 100), 0));
});

describe("normalizeSoulState", () => {
  it("returns valid string state unchanged", () => assert.equal(normalizeSoulState("active"), "active"));
  it("converts integer 0 to low", () => assert.equal(normalizeSoulState(0), "low"));
  it("converts integer 3 to excited", () => assert.equal(normalizeSoulState(3), "excited"));
  it("defaults to calm for unknown", () => assert.equal(normalizeSoulState("unknown"), "calm"));
  it("defaults to calm for undefined", () => assert.equal(normalizeSoulState(), "calm"));
});

describe("cleanContent", () => {
  it("trims whitespace", () => assert.equal(cleanContent("  hello  "), "hello"));
  it("collapses multiple spaces", () => assert.equal(cleanContent("a   b"), "a b"));
  it("handles empty string", () => assert.equal(cleanContent(""), ""));
});

describe("inferType", () => {
  it("detects boundary", () => assert.equal(inferType("我不想要这样"), "boundary"));
  it("detects preference", () => assert.equal(inferType("我喜欢这个"), "preference"));
  it("detects emotion", () => assert.equal(inferType("我今天很开心"), "emotion"));
  it("detects event", () => assert.equal(inferType("昨天发生了一件事"), "event"));
  it("defaults to user", () => assert.equal(inferType("随机文本"), "user"));
});

describe("inferPriority", () => {
  it("boundary is priority 3", () => assert.equal(inferPriority("boundary", ""), 3));
  it("important keywords get priority 3", () => assert.equal(inferPriority("user", "请记住我的名字"), 3));
  it("preference is priority 2", () => assert.equal(inferPriority("preference", ""), 2));
  it("emotion is priority 2", () => assert.equal(inferPriority("emotion", ""), 2));
  it("default is priority 1", () => assert.equal(inferPriority("user", "普通的文本"), 1));
});

describe("inferTags", () => {
  it("includes type as first tag", () => {
    const tags = inferTags("boundary", "不要提这个话题");
    assert.equal(tags[0], "boundary");
    assert.ok(tags.includes("边界"));
  });
  it("detects topic keywords", () => {
    const tags = inferTags("preference", "我喜欢枫丹的歌剧");
    assert.ok(tags.includes("枫丹") || tags.includes("歌剧"));
  });
  it("handles empty content", () => {
    const tags = inferTags("user", "");
    assert.deepStrictEqual(tags, ["user"]);
  });
});

describe("defaultStrength", () => {
  it("boundary has high strength", () => assert.equal(defaultStrength("boundary"), 85));
  it("preference has medium strength", () => assert.equal(defaultStrength("preference"), 65));
  it("emotion has medium strength", () => assert.equal(defaultStrength("emotion"), 65));
  it("unknown type has low strength", () => assert.equal(defaultStrength("user"), 45));
});

describe("memoryId helpers", () => {
  it("formatMemoryId pads to 3 digits", () => assert.equal(formatMemoryId(1), "M001"));
  it("formatMemoryId handles large numbers", () => assert.equal(formatMemoryId(100), "M100"));
  it("memoryIdNumber extracts number", () => assert.equal(memoryIdNumber("M042"), 42));
  it("memoryIdNumber returns 0 for invalid", () => assert.equal(memoryIdNumber("xyz"), 0));
});

describe("uniqueStrings", () => {
  it("deduplicates", () => {
    assert.deepStrictEqual(uniqueStrings(["a", "b", "a"]), ["a", "b"]);
  });
  it("trims content", () => {
    assert.deepStrictEqual(uniqueStrings([" a "]), ["a"]);
  });
  it("filters empty strings", () => {
    assert.deepStrictEqual(uniqueStrings(["", "b"]), ["b"]);
  });
});

describe("tokenSet", () => {
  it("extracts Chinese bigrams", () => {
    const tokens = tokenSet("你好世界");
    assert.ok(tokens.has("你好"));
    assert.ok(tokens.has("好世"));
    assert.ok(tokens.has("世界"));
  });
  it("extracts alphanumeric words", () => {
    const tokens = tokenSet("hello world");
    assert.ok(tokens.has("hello"));
    assert.ok(tokens.has("world"));
  });
});

describe("overlapScore", () => {
  it("returns high score for similar content", () => {
    const score = overlapScore("我喜欢甜点", { content: "用户喜欢甜点", tags: [] });
    assert.ok(score > 0.3);
  });
  it("returns 0 for no overlap", () => {
    const score = overlapScore("abc", { content: "xyz", tags: [] });
    assert.equal(score, 0);
  });
});

describe("isCasualGreeting", () => {
  it("detects 你好", () => assert.ok(isCasualGreeting("你好")));
  it("detects hi", () => assert.ok(isCasualGreeting("hi")));
  it("rejects long messages", () => assert.ok(!isCasualGreeting("芙宁娜你还记得我喜欢甜点吗")));
});

describe("similarContent", () => {
  it("detects identical content", () => assert.ok(similarContent("hello", "hello")));
  it("detects substring with 6+ char overlap", () => assert.ok(similarContent("hello world", "hello w")));
  it("rejects short substring", () => assert.ok(!similarContent("hi", "h")));
});

describe("normalizeMemory", () => {
  it("rejects null", () => assert.equal(normalizeMemory(null), null));
  it("rejects empty content", () => assert.equal(normalizeMemory({ content: "   " }), null));
  it("normalizes valid memory", () => {
    const result = normalizeMemory({ content: "用户喜欢枫丹歌剧", type: "preference" });
    assert.ok(result);
    assert.equal(result.type, "preference");
    assert.ok(result.priority >= 1 && result.priority <= 3);
  });
  it("infers type from content", () => {
    const result = normalizeMemory({ content: "我不想要这样" });
    assert.equal(result.type, "boundary");
  });
});

describe("normalizeStore", () => {
  it("fills defaults for empty input", () => {
    const store = normalizeStore({});
    assert.equal(store.version, "2.0");
    assert.equal(store.intimacy, 0);
    assert.equal(store.soul_state, "calm");
  });
  it("clamps intimacy", () => {
    const store = normalizeStore({ intimacy: 999 });
    assert.equal(store.intimacy, 10);
  });
  it("normalizes old integer soul_state", () => {
    const store = normalizeStore({ soul_state: 3 });
    assert.equal(store.soul_state, "excited");
  });
});

describe("parseMemoryTags", () => {
  it("extracts memory markers", () => {
    const results = parseMemoryTags("[📌 记忆: 用户喜欢枫丹歌剧]");
    assert.equal(results.length, 1);
    assert.equal(results[0].content, "用户喜欢枫丹歌剧");
  });
  it("handles no markers", () => {
    assert.deepStrictEqual(parseMemoryTags("普通文本"), []);
  });
});

describe("heart", () => {
  const store = normalizeStore({ intimacy: 7 });

  it("responds to direct call", () => {
    const result = heart("芙宁娜", store);
    assert.ok(result.should_reply);
  });
  it("detects save signal", () => {
    const result = heart("请记住我喜欢甜点", store);
    assert.ok(result.should_save);
  });
  it("skips for plain observation", () => {
    const result = heart("...", store);
    assert.ok(!result.should_reply);
  });
});
