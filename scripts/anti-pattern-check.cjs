#!/usr/bin/env node

'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const PATTERNS = [
  {
    id: 'AP001',
    name: 'Bare auth.uid() in RLS',
    severity: 'critical',
    regex: /auth\.uid\(\)(?!\s*\))/g,
    exclude: ['\(SELECT auth\.uid\(\)\)'],
    message: 'Use (SELECT auth.uid()) instead of bare auth.uid() — 19x slower without subquery',
    fix: 'Replace auth.uid() with (SELECT auth.uid()) in RLS policies',
  },
  {
    id: 'AP002',
    name: 'Hardcoded hex colors in source',
    severity: 'high',
    regex: /#[0-9a-fA-F]{3,8}\b/g,
    exclude: ['//', '/*', '*', '#![', '#[derive'],
    extensions: ['.jsx', '.tsx', '.js', '.ts', '.css', '.scss'],
    message: 'Hardcoded hex color found — use CSS vars from design system (var(--brand), var(--green-600), etc.)',
    fix: 'Replace hex with CSS var from src/index.css design tokens',
  },
  {
    id: 'AP003',
    name: 'console.log in source',
    severity: 'medium',
    regex: /console\.(log|debug|info|warn)\(/g,
    exclude: ['test.', '.test.', 'spec.'],
    extensions: ['.jsx', '.tsx', '.js', '.ts'],
    message: 'console.log found in source — remove before commit',
    fix: 'Remove console.log or replace with proper logging',
  },
  {
    id: 'AP004',
    name: 'Missing safeErrorResponse in Edge Functions',
    severity: 'critical',
    regex: /new Response\(.*json.*500/m,
    extensions: ['.ts'],
    message: 'Edge Function returning 500 without safeErrorResponse — may leak stack traces',
    fix: 'Use safeErrorResponse helper from _shared/responses.ts',
  },
  {
    id: 'AP005',
    name: 'Rate limit fail-open pattern',
    severity: 'critical',
    regex: /catch\s*\{?\s*return\s+true/i,
    extensions: ['.ts', '.js'],
    message: 'Rate limit fail-open detected — should be fail-closed (return false on error)',
    fix: 'Change catch block to return false (fail-closed)',
  },
  {
    id: 'AP006',
    name: 'Impersonation token in URL hash or localStorage',
    severity: 'critical',
    regex: /localStorage\.setItem.*impersonat|location\.hash.*token|window\.location.*token/i,
    extensions: ['.jsx', '.tsx', '.js', '.ts'],
    message: 'Impersonation token stored in URL hash or localStorage — account takeover risk',
    fix: 'Use in-memory only (impersonationTokenRef), short-lived JWT with act claim',
  },
  {
    id: 'AP007',
    name: 'Stale .env file referenced',
    severity: 'high',
    regex: /\.env\b/,
    extensions: ['.ts', '.js', '.json'],
    exclude: ['process\.env\.', 'dotenv', '\.env\.example', '\.env\.local'],
    message: 'Reference to .env file — never commit .env files',
    fix: 'Use process.env.X with secrets configured via supabase secrets set',
  },
  {
    id: 'AP008',
    name: 'Migration without (SELECT auth.uid())',
    severity: 'critical',
    regex: /CREATE\s+POLICY.*auth\.uid\(\)/i,
    extensions: ['.sql'],
    exclude: ['\(SELECT auth\.uid\(\)\)'],
    message: 'RLS policy using bare auth.uid() — 19x performance penalty',
    fix: 'Wrap with (SELECT auth.uid()) subquery',
  },
  {
    id: 'AP009',
    name: 'Missing RLS policy on new table',
    severity: 'high',
    regex: /CREATE\s+TABLE.*\(/i,
    extensions: ['.sql'],
    message: 'New table created without RLS policy — defaults to no access (verify intentional)',
    fix: 'Add appropriate RLS policy or confirm table is service_role only',
  },
  {
    id: 'AP010',
    name: 'Duplicate Deno.serve handler',
    severity: 'high',
    regex: /Deno\.serve\s*\(/g,
    extensions: ['.ts'],
    message: 'Multiple Deno.serve handlers in same file — only one per Edge Function',
    fix: 'Consolidate to single Deno.serve handler',
  },
]

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      cwd: ROOT,
    })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

const SCRIPT_EXCLUSIONS = new Set([
  'scripts/anti-pattern-check.cjs',
  'scripts/docs-drift-check.cjs',
  'scripts/docs-health-check.cjs',
  '.claude/settings.json',
])

const DOC_EXCLUSIONS = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'docs/AGENT_GUIDE.md',
  'docs/AUTONOMY.md',
  'docs/DECISIONS.md',
  'docs/INDEX.md',
  'docs/WORKSPACE.md',
  'docs/BEST_PRACTICES/code.md',
  'docs/BEST_PRACTICES/ux.md',
  'docs/TEMPLATES/commit.md',
  'docs/TEMPLATES/bug-report.md',
  'docs/TEMPLATES/feature-request.md',
  'docs/TEMPLATES/area-report.md',
])

function checkFile(filePath) {
  if (SCRIPT_EXCLUSIONS.has(filePath)) return []
  if (DOC_EXCLUSIONS.has(filePath)) return []

  const fullPath = path.join(ROOT, filePath)
  if (!fs.existsSync(fullPath)) return []

  const ext = path.extname(filePath).toLowerCase()
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  const findings = []

  for (const pattern of PATTERNS) {
    if (pattern.extensions && !pattern.extensions.includes(ext)) continue

    const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g'
    const globalRegex = new RegExp(pattern.regex.source, flags)
    const matches = [...content.matchAll(globalRegex)]
    for (const match of matches) {
      const lineNum = content.substring(0, match.index).split('\n').length
      const line = lines[lineNum - 1] || ''

      const isExcluded = (pattern.exclude || []).some(ex => line.includes(ex))
      if (isExcluded) continue

      findings.push({
        id: pattern.id,
        severity: pattern.severity,
        file: filePath,
        line: lineNum,
        message: pattern.message,
        fix: pattern.fix,
        match: line.trim().substring(0, 120),
      })
    }
  }

  return findings
}

function main() {
  console.log('🔍 Anti-pattern check running...\n')

  const stagedFiles = getStagedFiles()
  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to check')
    process.exit(0)
  }

  let totalFindings = 0
  let criticalCount = 0
  let highCount = 0

  for (const file of stagedFiles) {
    const findings = checkFile(file)
    for (const f of findings) {
      totalFindings++
      if (f.severity === 'critical') criticalCount++
      if (f.severity === 'high') highCount++

      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡'
      console.log(`${icon} [${f.id}] ${f.file}:${f.line}`)
      console.log(`   ${f.message}`)
      console.log(`   Fix: ${f.fix}`)
      console.log(`   Match: ${f.match}`)
      console.log()
    }
  }

  console.log(`${'─'.repeat(40)}`)
  console.log(`Findings: ${totalFindings} (${criticalCount} critical, ${highCount} high)`)

  if (criticalCount > 0) {
    console.log('\n❌ BLOCKED: Critical anti-patterns detected. Fix before committing.')
    process.exit(1)
  }

  if (highCount > 0) {
    console.log('\n⚠️  WARNING: High-severity patterns found. Review before committing.')
    process.exit(0)
  }

  console.log('✅ No anti-patterns detected')
  process.exit(0)
}

main()