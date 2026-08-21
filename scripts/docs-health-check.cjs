#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(ROOT, 'docs')

let errors = 0
let warnings = 0

function log(type, file, msg) {
  const prefix = type === 'error' ? '❌' : '⚠️'
  console.log(`${prefix} ${file}: ${msg}`)
  if (type === 'error') errors++
  else warnings++
}

function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    log('error', filePath, `missing (${description})`)
    return false
  }
  return true
}

function checkFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.startsWith('---')) {
    log('warning', filePath, 'missing frontmatter (YAML block)')
    return false
  }
  const parts = content.split('---')
  if (parts.length < 3) {
    log('warning', filePath, 'malformed frontmatter (missing closing ---)')
    return false
  }
  return true
}

function checkNoOrphanedDocs() {
  const activeDocs = [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'VISUAL_IDENTITY.md',
    'CANVA_AI_PROMPT.md',
    'CI_REPORT.md',
    'docs/INDEX.md',
    'docs/WORKSPACE.md',
    'docs/AGENT_GUIDE.md',
    'docs/DECISIONS.md',
    'docs/AUTONOMY.md',
    'docs/ARCHITECTURE.md',
    'docs/CI_CD.md',
    'docs/DEPLOY_SECRETS.md',
    'docs/CHANGELOG.md',
    'docs/UX-AUDIT-REFERENCE.md',
    'docs/testing-strategy-research.md',
    'docs/ai/AI_BRAND_SCHEMA.md',
    'docs/ai/AI_BEST_PRACTICES.md',
    'docs/Backend/REPORT_FINANCIA_BACKEND.md',
    'docs/Banco/ESPECIALISTA_BANCO.md',
    'docs/Banco/I1_DB_PULL_INSTRUCTIONS.md',
    'docs/Banco/PERFORMANCE_REPORT.md',
    'docs/Banco/SCHEMA_REPORT.md',
    'docs/Frontend/FASE4_FRONTEND_REPORT.md',
    'docs/Frontend/FRONTEND_SPECIALIST_AUDIT.md',
    'docs/QA/QA_ANALYSIS.md',
    'docs/QA/FUNCTIONAL_AUDIT.md',
    'docs/QA/STRESS_AUDIT.md',
    'docs/Seguranca/SECURITY_AUDIT_REPORT.md',
    'docs/Seguranca/SECURITY_MASTER_AUDIT.md',
    'docs/Performance/PERFORMANCE_ANALYSIS.md',
    'docs/Performance/PERFORMANCE_AUDIT_REPORT.md',
    'docs/Performance/PERF_TEST_REPORT.md',
    'docs/Performance/PLANO_OTIMIZACAO_VALIDACAO.md',
    'docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md',
    'docs/UX/UX_UI_AUDIT_REPORT.md',
    'docs/Infrastructure/CODESPACES_MIGRATION_PLAN.md',
    'docs/Infrastructure/CODESPACES_RUNBOOK.md',
    'supabase/AGENTS.md',
  ]

  const allFiles = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - directory traversal is bounded to local docs walk roots
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'archive') {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        allFiles.push(path.relative(ROOT, full))
      }
    }
  }
  walk(DOCS_DIR)
  walk(ROOT)

  const rootMd = allFiles.filter(f => f.endsWith('.md') && !f.startsWith('docs/archive'))

  for (const f of rootMd) {
    if (!activeDocs.includes(f) && !f.startsWith('docs/archive/')) {
      log('warning', f, 'not in active docs list — consider archiving or adding to INDEX.md')
    }
  }
}

function checkIndexReferences() {
  const indexPath = path.join(DOCS_DIR, 'INDEX.md')
  if (!fs.existsSync(indexPath)) return

  const indexContent = fs.readFileSync(indexPath, 'utf8')
  const activeDocs = [
    'AGENTS.md', 'CLAUDE.md', 'docs/WORKSPACE.md', 'docs/AGENT_GUIDE.md',
    'docs/DECISIONS.md', 'docs/AUTONOMY.md', 'docs/ARCHITECTURE.md',
    'docs/CI_CD.md', 'docs/DEPLOY_SECRETS.md', 'docs/CHANGELOG.md',
    'docs/UX-AUDIT-REFERENCE.md', 'docs/testing-strategy-research.md',
    'docs/ai/AI_BRAND_SCHEMA.md', 'docs/ai/AI_BEST_PRACTICES.md',
    'docs/Backend/REPORT_FINANCIA_BACKEND.md',
    'docs/Banco/ESPECIALISTA_BANCO.md', 'docs/Banco/I1_DB_PULL_INSTRUCTIONS.md',
    'docs/Banco/PERFORMANCE_REPORT.md', 'docs/Banco/SCHEMA_REPORT.md',
    'docs/Frontend/FASE4_FRONTEND_REPORT.md', 'docs/Frontend/FRONTEND_SPECIALIST_AUDIT.md',
    'docs/QA/QA_ANALYSIS.md', 'docs/QA/FUNCTIONAL_AUDIT.md', 'docs/QA/STRESS_AUDIT.md',
    'docs/Seguranca/SECURITY_AUDIT_REPORT.md', 'docs/Seguranca/SECURITY_MASTER_AUDIT.md',
    'docs/Performance/PERFORMANCE_ANALYSIS.md', 'docs/Performance/PERFORMANCE_AUDIT_REPORT.md',
    'docs/Performance/PERF_TEST_REPORT.md', 'docs/Performance/PLANO_OTIMIZACAO_VALIDACAO.md',
    'docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md',
    'docs/UX/UX_UI_AUDIT_REPORT.md',
    'docs/Infrastructure/CODESPACES_MIGRATION_PLAN.md',
    'docs/Infrastructure/CODESPACES_RUNBOOK.md',
    'supabase/AGENTS.md',
  ]

  for (const doc of activeDocs) {
    if (!indexContent.includes(doc) && fs.existsSync(path.join(ROOT, doc))) {
      log('warning', 'docs/INDEX.md', `missing reference to ${doc}`)
    }
  }
}

function checkNoStaleFrontmatter() {
  const stalePatterns = ['status: DRAFT', 'status: REVIEW', 'ready_for_integration: false']
  const allFiles = []

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - directory traversal is bounded to local docs walk roots
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'archive') {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        allFiles.push(full)
      }
    }
  }
  walk(DOCS_DIR)
  walk(ROOT)

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8')
    for (const pattern of stalePatterns) {
      if (content.includes(pattern)) {
        const relPath = path.relative(ROOT, file)
        log('warning', relPath, `contains stale frontmatter: "${pattern}"`)
      }
    }
  }
}

console.log('🔍 Checking documentation health...\n')

checkNoOrphanedDocs()
checkIndexReferences()
checkNoStaleFrontmatter()

console.log(`\n${'─'.repeat(40)}`)
if (errors === 0 && warnings === 0) {
  console.log('✅ All docs checks passed')
  process.exit(0)
} else {
  console.log(`Results: ${errors} error(s), ${warnings} warning(s)`)
  if (errors > 0) process.exit(1)
  process.exit(0)
}