/**
 * Resolve Markdown skill content from either a flat file layout or the
 * agent-skills directory layout (`skills/<name>/SKILL.md`), with aliases
 * for historical ASIL thinker names that map onto upstream skill names.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * When ASIL thinker skill filenames don't match upstream skill folder
 * names 1:1, try these fallbacks in order after the primary name.
 */
export const SKILL_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'security-review': ['security-and-hardening'],
  'security-and-hardening': [],
  'testing-strategy': ['test-driven-development'],
  'test-driven-development': [],
  'planning-and-task-breakdown': [],
  'spec-driven-development': [],
};

/** Strip a trailing `.md` so callers can pass either `foo` or `foo.md`. */
function normalizeSkillName(skillFile: string): string {
  return skillFile.replace(/\.md$/i, '');
}

/** Candidate relative paths under `skillsPath` for a single skill name. */
export function skillCandidatePaths(skillFile: string): string[] {
  const primary = normalizeSkillName(skillFile);
  const names = [primary, ...(SKILL_NAME_ALIASES[primary] ?? [])];
  const paths: string[] = [];
  for (const name of names) {
    paths.push(join('skills', `${name}.md`));
    paths.push(join('skills', name, 'SKILL.md'));
  }
  return paths;
}

/**
 * Load skill Markdown from disk. Returns `null` when nothing matches so
 * callers can fall back to inline defaults.
 */
export function loadSkillMarkdown(
  skillsPath: string,
  skillFile: string,
): string | null {
  for (const rel of skillCandidatePaths(skillFile)) {
    try {
      return readFileSync(join(skillsPath, rel), 'utf8');
    } catch {
      // try next candidate
    }
  }
  return null;
}
