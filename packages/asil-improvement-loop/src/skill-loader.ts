/**
 * Resolve Markdown skill content from either a flat file layout or the
 * agent-skills directory layout (`skills/<name>/SKILL.md`), with aliases
 * for historical ASIL names that map onto upstream skill names.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * When ASIL's category / thinker names don't match upstream skill folder
 * names 1:1, try these fallbacks in order after the primary name.
 */
export const SKILL_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'security-review': ['security-and-hardening'],
  'testing-strategy': ['test-driven-development'],
  'test-coverage-improvement': ['test-driven-development'],
  'dead-code-removal': ['code-simplification'],
  'dependency-update': ['deprecation-and-migration'],
  'documentation-generation': ['documentation-and-adrs'],
  'todo-resolution': [
    'incremental-implementation',
    'debugging-and-error-recovery',
  ],
};

/** Candidate relative paths under `skillsPath` for a single skill name. */
export function skillCandidatePaths(skillName: string): string[] {
  const names = [skillName, ...(SKILL_NAME_ALIASES[skillName] ?? [])];
  const paths: string[] = [];
  for (const name of names) {
    // Flat layout used by early ASIL installs and symlinked copies.
    paths.push(join('skills', `${name}.md`));
    // Upstream agent-skills submodule / clone layout.
    paths.push(join('skills', name, 'SKILL.md'));
  }
  return paths;
}

/**
 * Load skill Markdown from disk. Returns empty string when nothing matches
 * so callers can fall back to inline defaults.
 */
export function loadSkillMarkdown(
  skillsPath: string,
  skillName: string,
): string {
  for (const rel of skillCandidatePaths(skillName)) {
    try {
      return readFileSync(join(skillsPath, rel), 'utf8');
    } catch {
      // try next candidate
    }
  }
  return '';
}

/**
 * Extracts the anti-/common-rationalization section from a skill.
 *
 * Upstream agent-skills title this "## Common Rationalizations"; some
 * forks use "## Anti-Rationalization Table". Both must be recognized —
 * otherwise the autonomous executor silently drops the tables that were
 * the whole point of importing the skills.
 */
export function extractAntiRationalization(skill: string): string {
  if (!skill) return '';
  const lines = skill.split(/\r?\n/);
  const startIdx = lines.findIndex((l) =>
    /^#{1,6}\s*(?:anti[- ]?rationalization|common\s+rationalizations)\b/i.test(
      l,
    ),
  );
  if (startIdx === -1) return '';
  const afterStart = lines.slice(startIdx);
  const nextHeaderIdx = afterStart
    .slice(1)
    .findIndex((l) => /^#{1,6}\s+/.test(l));
  const slice =
    nextHeaderIdx === -1
      ? afterStart
      : afterStart.slice(0, nextHeaderIdx + 1);
  return slice.join('\n').trim();
}
