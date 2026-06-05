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
  return options.preferExa ? preferExaSearch(withSkill) : withSkill;
}

export function hasEnvKey(source, key) {
  const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*(?:export\\s+)?${escaped}\\s*=`, "m").test(String(source || ""));
}
