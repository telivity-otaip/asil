import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractAntiRationalization,
  loadSkillMarkdown,
  skillCandidatePaths,
} from '../skill-loader.js';

describe('skillCandidatePaths', () => {
  it('lists flat .md then SKILL.md, then aliases', () => {
    expect(skillCandidatePaths('security-review')).toEqual([
      join('skills', 'security-review.md'),
      join('skills', 'security-review', 'SKILL.md'),
      join('skills', 'security-and-hardening.md'),
      join('skills', 'security-and-hardening', 'SKILL.md'),
    ]);
  });
});

describe('loadSkillMarkdown', () => {
  it('loads upstream agent-skills layout via alias', () => {
    const root = mkdtempSync(join(tmpdir(), 'asil-skills-'));
    const dir = join(root, 'skills', 'security-and-hardening');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), '# Security\n\nHardening rules.\n');

    expect(loadSkillMarkdown(root, 'security-review')).toContain('Hardening');
  });

  it('prefers flat primary name when present', () => {
    const root = mkdtempSync(join(tmpdir(), 'asil-skills-'));
    mkdirSync(join(root, 'skills'), { recursive: true });
    writeFileSync(
      join(root, 'skills', 'security-review.md'),
      '# Flat security review\n',
    );
    const dir = join(root, 'skills', 'security-and-hardening');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), '# Upstream\n');

    expect(loadSkillMarkdown(root, 'security-review')).toContain('Flat security');
  });

  it('returns empty string when nothing matches', () => {
    expect(loadSkillMarkdown('/nonexistent', 'nope')).toBe('');
  });
});

describe('extractAntiRationalization', () => {
  it('extracts Anti-Rationalization Table sections', () => {
    const skill = [
      '# Skill',
      '',
      '## Anti-Rationalization Table',
      '| Rationalization | Reality |',
      '| --- | --- |',
      '| Skip tests | Never |',
      '',
      '## Red Flags',
      '- x',
    ].join('\n');
    const section = extractAntiRationalization(skill);
    expect(section).toMatch(/Anti-Rationalization/i);
    expect(section).toMatch(/Skip tests/);
    expect(section).not.toMatch(/Red Flags/);
  });

  it('extracts Common Rationalizations sections from upstream skills', () => {
    const skill = [
      '# Test-Driven Development',
      '',
      '## Common Rationalizations',
      '| Rationalization | Reality |',
      '| --- | --- |',
      '| Tests later | Tests first |',
      '',
      '## Red Flags',
      '- shipping without tests',
    ].join('\n');
    const section = extractAntiRationalization(skill);
    expect(section).toMatch(/Common Rationalizations/);
    expect(section).toMatch(/Tests later/);
    expect(section).not.toMatch(/Red Flags/);
  });

  it('returns empty string when the section is missing', () => {
    expect(extractAntiRationalization('# Just a skill\n\nNo table here.')).toBe(
      '',
    );
  });
});
