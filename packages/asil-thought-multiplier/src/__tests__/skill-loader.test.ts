import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadSkillMarkdown,
  skillCandidatePaths,
} from '../skill-loader.js';
import { loadMarkdownSkill } from '../thinkers/shared.js';

describe('skillCandidatePaths', () => {
  it('accepts names with or without .md and includes aliases', () => {
    expect(skillCandidatePaths('testing-strategy.md')).toEqual([
      join('skills', 'testing-strategy.md'),
      join('skills', 'testing-strategy', 'SKILL.md'),
      join('skills', 'test-driven-development.md'),
      join('skills', 'test-driven-development', 'SKILL.md'),
    ]);
  });
});

describe('loadSkillMarkdown / loadMarkdownSkill', () => {
  it('resolves agent-skills SKILL.md layout for thinker names', () => {
    const root = mkdtempSync(join(tmpdir(), 'asil-tm-skills-'));
    const dir = join(root, 'skills', 'test-driven-development');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), '# TDD\n\nRED GREEN REFACTOR\n');

    expect(loadSkillMarkdown(root, 'testing-strategy.md')).toContain('RED GREEN');
    expect(
      loadMarkdownSkill(root, 'testing-strategy.md', 'FALLBACK'),
    ).toContain('RED GREEN');
  });

  it('falls back when the skill is missing', () => {
    expect(loadMarkdownSkill('/nonexistent', 'missing.md', 'FALLBACK')).toBe(
      'FALLBACK',
    );
  });
});
