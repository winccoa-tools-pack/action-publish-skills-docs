#!/usr/bin/env node
/**
 * prepare-docs.js
 *
 * Converts APM SKILL.md files into Docusaurus-compatible Markdown files.
 *
 * Input  (from env):
 *   SKILLS_DIR        – path to .apm/skills directory
 *   OUTPUT_DIR        – where to write the converted .md files
 *   SECTION_TITLE     – label for the Docusaurus _category_.json
 *   SECTION_POSITION  – sidebar_position for the category
 *
 * Output:
 *   OUTPUT_DIR/_category_.json
 *   OUTPUT_DIR/<skill-name>.md   (one file per skill)
 */

const fs   = require('fs');
const path = require('path');

const skillsDir      = process.env.SKILLS_DIR      || '.apm/skills';
const outputDir      = process.env.OUTPUT_DIR      || '/tmp/skills-docs-output';
const sectionTitle   = process.env.SECTION_TITLE   || 'Skills';
const sectionPosition = parseInt(process.env.SECTION_POSITION || '10', 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse YAML-ish APM frontmatter (name / description only). */
function parseApmFrontmatter(fm) {
  const result = { name: '', description: '' };
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)/);
    if (!m) continue;
    if (m[1] === 'name')        result.name        = m[2].trim();
    if (m[1] === 'description') result.description = m[2].trim();
  }
  return result;
}

/** Escape double-quotes for Docusaurus YAML frontmatter values. */
function escYaml(str) {
  return str.replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });

// Write category descriptor so Docusaurus auto-generates a labelled section.
fs.writeFileSync(
  path.join(outputDir, '_category_.json'),
  JSON.stringify({ label: sectionTitle, position: sectionPosition }, null, 2) + '\n'
);

// Write a minimal index.md so the section URL always resolves.
const indexContent = [
  '---',
  `title: "${escYaml(sectionTitle)}"`,
  `sidebar_label: "${escYaml(sectionTitle)}"`,
  `sidebar_position: 1`,
  '---',
  '',
  `# ${sectionTitle}`,
  '',
  'Browse the available skills in the sidebar.',
  '',
].join('\n');
fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent);

if (!fs.existsSync(skillsDir)) {
  console.warn(`Skills directory not found: ${skillsDir}`);
  process.exit(0);
}

const skillDirs = fs.readdirSync(skillsDir).filter(entry => {
  return fs.statSync(path.join(skillsDir, entry)).isDirectory();
});

let converted = 0;

for (const skillName of skillDirs) {
  const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    console.warn(`  [skip] no SKILL.md in ${skillName}`);
    continue;
  }

  const raw = fs.readFileSync(skillFile, 'utf8');

  // Expect format:  ---\n<frontmatter>\n---\n<body>
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`  [skip] ${skillName}: no valid APM frontmatter`);
    continue;
  }

  const apm  = parseApmFrontmatter(fmMatch[1]);
  let   body = fmMatch[2];

  // Extract first H1 heading as the page title.
  const h1Match = body.match(/^#\s+(.+)/m);
  const title   = h1Match ? h1Match[1].trim() : (apm.name || skillName);

  // Remove the first H1 line (and optional blank line after it).
  body = body.replace(/^#\s+.+\r?\n(\r?\n)?/, '');

  // Build Docusaurus frontmatter.
  const lines = [
    '---',
    `title: "${escYaml(title)}"`,
    `sidebar_label: "${escYaml(title)}"`,
  ];
  if (apm.description) {
    lines.push(`description: "${escYaml(apm.description)}"`);
  }
  lines.push('---', '');

  const docContent = lines.join('\n') + body;

  fs.writeFileSync(path.join(outputDir, `${skillName}.md`), docContent);
  console.log(`  [ok]   ${skillName} → ${skillName}.md`);
  converted++;
}

console.log(`\nConverted ${converted} skill(s) → ${outputDir}`);
