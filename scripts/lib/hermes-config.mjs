import path from "node:path";

function leadingSpaces(line) {
  return line.match(/^\s*/)?.[0].length || 0;
}

function parseYamlScalar(value) {
  const text = value.trim().replace(/\s+#.*$/, "");
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  return text;
}

function samePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

function externalDirsFromConfig(source) {
  const lines = String(source || "").split(/\r?\n/);
  const skillsIndex = lines.findIndex((line) => /^skills:\s*(?:#.*)?$/.test(line));
  if (skillsIndex === -1) return [];

  let skillsEnd = lines.length;
  for (let index = skillsIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.trimStart().startsWith("#") && leadingSpaces(line) === 0) {
      skillsEnd = index;
      break;
    }
  }

  let externalIndex = -1;
  for (let index = skillsIndex + 1; index < skillsEnd; index += 1) {
    if (/^\s+external_dirs:\s*(?:#.*)?$/.test(lines[index])) {
      externalIndex = index;
      break;
    }
  }
  if (externalIndex === -1) return [];

  const childIndent = leadingSpaces(lines[externalIndex]);
  const directories = [];
  for (let index = externalIndex + 1; index < skillsEnd; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && leadingSpaces(line) >= childIndent) {
      directories.push(parseYamlScalar(item[1]));
      continue;
    }
    if (leadingSpaces(line) <= childIndent) break;
  }
  return directories;
}

export function configHasExternalDir(source, externalDir) {
  return externalDirsFromConfig(source).some((candidate) => samePath(candidate, externalDir));
}

export function configHasMemoryProvider(source, provider) {
  const lines = String(source || "").split(/\r?\n/);
  const memoryIndex = lines.findIndex((line) => /^memory:\s*(?:#.*)?$/.test(line));
  if (memoryIndex === -1) return false;

  for (let index = memoryIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.trimStart().startsWith("#") && leadingSpaces(line) === 0) break;
    const match = line.match(/^\s+provider:\s*(.+?)\s*(?:#.*)?$/);
    if (match) return parseYamlScalar(match[1]) === provider;
  }
  return false;
}

function memoryBlockRange(lines) {
  let start = lines.findIndex((line) => /^memory:\s*(?:#.*)?$/.test(line));
  const emptyIndex = lines.findIndex((line) => /^memory:\s*\{\s*\}\s*(?:#.*)?$/.test(line));
  if (start === -1 && emptyIndex !== -1) start = emptyIndex;
  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.trimStart().startsWith("#") && leadingSpaces(line) === 0) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function memoryScalar(source, key) {
  const lines = String(source || "").split(/\r?\n/);
  const range = memoryBlockRange(lines);
  if (!range) return "";
  const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (let index = range.start + 1; index < range.end; index += 1) {
    const match = lines[index].match(new RegExp(`^\\s+${escaped}:\\s*(.+?)\\s*(?:#.*)?$`));
    if (match) return parseYamlScalar(match[1]);
  }
  return "";
}

export function configUsesMnemosyneOnly(source) {
  return configHasMemoryProvider(source, "mnemosyne")
    && memoryScalar(source, "memory_enabled") === "false"
    && memoryScalar(source, "user_profile_enabled") === "false"
    && memoryScalar(source, "nudge_interval") === "0";
}

function configureMnemosyneOnly(source) {
  const original = String(source || "");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const hadFinalNewline = original.endsWith("\n") || original.length === 0;
  const lines = original.split(/\r?\n/);
  let range = memoryBlockRange(lines);

  if (!range) {
    const insertAt = lines.length > 0 && lines.at(-1) === "" ? lines.length - 1 : lines.length;
    lines.splice(
      insertAt,
      0,
      "memory:",
      "  memory_enabled: false",
      "  user_profile_enabled: false",
      "  nudge_interval: 0",
      "  provider: mnemosyne"
    );
    range = memoryBlockRange(lines);
  } else if (/^memory:\s*\{\s*\}/.test(lines[range.start])) {
    lines.splice(
      range.start,
      1,
      "memory:",
      "  memory_enabled: false",
      "  user_profile_enabled: false",
      "  nudge_interval: 0",
      "  provider: mnemosyne"
    );
    range = memoryBlockRange(lines);
  }

  for (const [key, value] of [
    ["memory_enabled", "false"],
    ["user_profile_enabled", "false"],
    ["nudge_interval", "0"],
    ["provider", "mnemosyne"]
  ]) {
    range = memoryBlockRange(lines);
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const index = lines.findIndex(
      (line, lineIndex) => lineIndex > range.start
        && lineIndex < range.end
        && new RegExp(`^\\s+${escaped}:`).test(line)
    );
    if (index === -1) {
      lines.splice(range.end, 0, `  ${key}: ${value}`);
    } else {
      const comment = lines[index].match(/\s+(#.*)$/)?.[1];
      lines[index] = `  ${key}: ${value}${comment ? ` ${comment}` : ""}`;
    }
  }

  let merged = lines.join(eol);
  if (hadFinalNewline && !merged.endsWith(eol)) merged += eol;
  return merged;
}

function mergeExternalSkillDir(source, externalDir) {
  const original = String(source || "");
  if (configHasExternalDir(original, externalDir)) return original;

  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const hadFinalNewline = original.endsWith("\n") || original.length === 0;
  const lines = original.split(/\r?\n/);
  const quotedDir = JSON.stringify(path.resolve(externalDir));

  let skillsIndex = lines.findIndex((line) => /^skills:\s*(?:#.*)?$/.test(line));
  const emptySkillsIndex = lines.findIndex((line) => /^skills:\s*\{\s*\}\s*(?:#.*)?$/.test(line));
  if (skillsIndex === -1 && emptySkillsIndex !== -1) {
    lines[emptySkillsIndex] = "skills:";
    skillsIndex = emptySkillsIndex;
  }

  if (skillsIndex === -1) {
    const insertAt = lines.length > 0 && lines.at(-1) === "" ? lines.length - 1 : lines.length;
    lines.splice(insertAt, 0, "skills:", "  external_dirs:", `    - ${quotedDir}`);
  } else {
    let skillsEnd = lines.length;
    for (let index = skillsIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.trim() && !line.trimStart().startsWith("#") && leadingSpaces(line) === 0) {
        skillsEnd = index;
        break;
      }
    }

    let externalIndex = -1;
    for (let index = skillsIndex + 1; index < skillsEnd; index += 1) {
      if (/^\s+external_dirs:/.test(lines[index])) {
        externalIndex = index;
        break;
      }
    }

    if (externalIndex === -1) {
      lines.splice(skillsEnd, 0, "  external_dirs:", `    - ${quotedDir}`);
    } else {
      const emptyList = lines[externalIndex].match(/^(\s+)external_dirs:\s*\[\s*\]\s*(?:#.*)?$/);
      if (emptyList) {
        const indent = emptyList[1];
        lines.splice(externalIndex, 1, `${indent}external_dirs:`, `${indent}  - ${quotedDir}`);
      } else if (/^\s+external_dirs:\s*(?:#.*)?$/.test(lines[externalIndex])) {
        const childIndent = leadingSpaces(lines[externalIndex]);
        let listEnd = skillsEnd;
        for (let index = externalIndex + 1; index < skillsEnd; index += 1) {
          const line = lines[index];
          if (!line.trim() || line.trimStart().startsWith("#")) continue;
          if (/^\s*-\s+/.test(line) && leadingSpaces(line) >= childIndent) continue;
          if (leadingSpaces(line) <= childIndent) {
            listEnd = index;
            break;
          }
        }
        lines.splice(listEnd, 0, `${" ".repeat(childIndent + 2)}- ${quotedDir}`);
      } else {
        throw new Error("Unsupported inline skills.external_dirs value; use a YAML list");
      }
    }
  }

  let merged = lines.join(eol);
  if (hadFinalNewline && !merged.endsWith(eol)) merged += eol;
  return merged;
}

function preferExaSearch(source) {
  const original = String(source || "");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const hadFinalNewline = original.endsWith("\n") || original.length === 0;
  const lines = original.split(/\r?\n/);

  let webIndex = lines.findIndex((line) => /^web:\s*(?:#.*)?$/.test(line));
  const emptyWebIndex = lines.findIndex((line) => /^web:\s*\{\s*\}\s*(?:#.*)?$/.test(line));
  if (webIndex === -1 && emptyWebIndex !== -1) {
    lines[emptyWebIndex] = "web:";
    webIndex = emptyWebIndex;
  }

  if (webIndex === -1) {
    const insertAt = lines.length > 0 && lines.at(-1) === "" ? lines.length - 1 : lines.length;
    lines.splice(insertAt, 0, "web:", "  search_backend: exa");
  } else {
    let webEnd = lines.length;
    for (let index = webIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.trim() && !line.trimStart().startsWith("#") && leadingSpaces(line) === 0) {
        webEnd = index;
        break;
      }
    }

    const searchIndex = lines.findIndex(
      (line, index) => index > webIndex && index < webEnd && /^\s+search_backend:/.test(line)
    );
    if (searchIndex === -1) {
      lines.splice(webEnd, 0, "  search_backend: exa");
    } else {
      const match = lines[searchIndex].match(/^(\s+search_backend:\s*)(.*)$/);
      const remainder = match?.[2] || "";
      const commentIndex = remainder.indexOf("#");
      const rawValue = (commentIndex === -1 ? remainder : remainder.slice(0, commentIndex)).trim();
      if (!["", "''", '""', "null", "~"].includes(rawValue)) return original;
      const comment = commentIndex === -1 ? "" : ` ${remainder.slice(commentIndex).trim()}`;
      lines[searchIndex] = `${match[1]}exa${comment}`;
    }
  }

  let merged = lines.join(eol);
  if (hadFinalNewline && !merged.endsWith(eol)) merged += eol;
  return merged;
}

export function mergeHermesConfig(source, externalDir, options = {}) {
  const withSkill = mergeExternalSkillDir(source, externalDir);
  const withMemory = options.mnemosyneOnly
    ? configureMnemosyneOnly(withSkill)
    : withSkill;
  return options.preferExa ? preferExaSearch(withMemory) : withMemory;
}

export function hasEnvKey(source, key) {
  const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*(?:export\\s+)?${escaped}\\s*=`, "m").test(String(source || ""));
}
