#!/usr/bin/env node

'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.sql', '.json', '.css', '.scss'])
const DOC_EXTENSIONS = new Set(['.md'])

const AREA_DIRS = [
  'docs/Backend',
  'docs/Banco',
  'docs/Frontend',
  'docs/QA',
  'docs/Seguranca',
  'docs/Performance',
  'docs/UX',
  'docs/Infrastructure',
  'docs/ai',
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

function isCodeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return CODE_EXTENSIONS.has(ext) && !filePath.includes('node_modules') && !filePath.includes('dist')
}

function isDocFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return DOC_EXTENSIONS.has(ext) && filePath.startsWith('docs/') && !filePath.includes('archive')
}

function getChangedAreas(stagedFiles) {
  const areas = new Set()

  for (const file of stagedFiles) {
    if (!isCodeFile(file)) continue

    const parts = file.split('/')
    if (parts.length >= 2) {
      const feature = parts[1]
      if (['features', 'shared', 'lib', 'core', 'components', 'animations', 'index.css', 'App.jsx', 'main.jsx', 'vite.config.js', 'tailwind.config.js', 'vitest.config.js'].includes(parts[1])) {
        areas.add('docs/')
      } else {
        for (const areaDir of AREA_DIRS) {
          const areaName = areaDir.replace('docs/', '')
          if (file.includes(areaName.toLowerCase()) || file.includes(feature.toLowerCase())) {
            areas.add(areaDir + '/')
          }
        }
      }
    }
  }

  return areas
}

function checkDocsExistForChangedCode(stagedFiles) {
  const findings = []
  const changedCodeFiles = stagedFiles.filter(isCodeFile)

  if (changedCodeFiles.length === 0) return findings

  const changedAreas = getChangedAreas(changedCodeFiles)

  for (const areaDir of changedAreas) {
    const areaPath = path.join(ROOT, areaDir)
    if (!fs.existsSync(areaPath)) continue

    const docFiles = fs.readdirSync(areaPath).filter(f => f.endsWith('.md'))
    if (docFiles.length === 0) {
      findings.push({
        type: 'missing-area-docs',
        area: areaDir,
        message: `No documentation files found in ${areaDir} for changed code in this area`,
        fix: `Add a report or update existing docs in ${areaDir}/`,
      })
    }
  }

  return findings
}

function checkDocsReferenceChangedFiles(stagedFiles) {
  const findings = []
  const changedCodeFiles = stagedFiles.filter(f => isCodeFile(f) && !f.includes('node_modules'))

  const allDocs = []
  function walkDocs(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'archive') {
        walkDocs(full)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        allDocs.push(full)
      }
    }
  }
  walkDocs(path.join(ROOT, 'docs'))

  for (const codeFile of changedCodeFiles) {
    const fileName = path.basename(codeFile)
    const relativePath = path.relative(ROOT, codeFile)

    let foundReference = false
    for (const docFile of allDocs) {
      const content = fs.readFileSync(docFile, 'utf8')
      if (content.includes(fileName) || content.includes(relativePath)) {
        foundReference = true
        break
      }
    }

    if (!foundReference && !fileName.endsWith('.test.') && !fileName.endsWith('.spec.')) {
      findings.push({
        type: 'missing-doc-reference',
        file: relativePath,
        message: `Changed code file "${fileName}" is not referenced in any documentation`,
        fix: `Add reference to ${fileName} in the relevant docs/<Area>/ report or docs/AGENT_GUIDE.md`,
      })
    }
  }

  return findings
}

function checkDocsNotStale() {
  const findings = []
  const staleMarkers = ['last_review:', 'last_reviewed:', 'reviewed_at:', 'updated_at:']

  for (const areaDir of AREA_DIRS) {
    const areaPath = path.join(ROOT, areaDir)
    if (!fs.existsSync(areaPath)) continue

    for (const docFile of fs.readdirSync(areaPath)) {
      if (!docFile.endsWith('.md')) continue
      const fullPath = path.join(areaPath, docFile)
      const content = fs.readFileSync(fullPath, 'utf8')
      const relPath = path.relative(ROOT, fullPath)

      for (const marker of staleMarkers) {
        const match = content.match(new RegExp(`${marker}\\s*(\\S+)`))
        if (match) {
          const dateStr = match[1]
          const date = new Date(dateStr)
          const now = new Date()
          const daysSinceReview = (now - date) / (1000 * 60 * 60 * 24)

          if (daysSinceReview > 30) {
            findings.push({
              type: 'stale-doc',
              file: relPath,
              message: `Documentation last reviewed ${Math.round(daysSinceReview)} days ago (marker: ${marker})`,
              fix: `Update ${marker} date or add "⚠️ STALE" note to the document`,
            })
          }
        }
      }
    }
  }

  return findings
}

function main() {
  console.log('🔍 Docs drift check running...\n')

  const stagedFiles = getStagedFiles()
  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to check')
    process.exit(0)
  }

  const codeFiles = stagedFiles.filter(isCodeFile)
  if (codeFiles.length === 0) {
    console.log('✅ No code files changed — docs drift check skipped')
    process.exit(0)
  }

  let totalFindings = 0

  const areaDocsFindings = checkDocsExistForChangedCode(stagedFiles)
  const refFindings = checkDocsReferenceChangedFiles(stagedFiles)
  const staleFindings = checkDocsNotStale()

  const allFindings = [...areaDocsFindings, ...refFindings, ...staleFindings]
  totalFindings = allFindings.length

  for (const f of allFindings) {
    const icon = f.type === 'stale-doc' ? '🟡' : '🔵'
    console.log(`${icon} [${f.type}] ${f.file || f.area}`)
    console.log(`   ${f.message}`)
    console.log(`   Fix: ${f.fix}`)
    console.log()
  }

  console.log(`${'─'.repeat(40)}`)
  console.log(`Docs drift findings: ${totalFindings}`)

  if (totalFindings > 0) {
    console.log('\n⚠️  Docs drift detected. Consider updating documentation.')
    console.log('   (This is a warning, not a blocker — commit still allowed)')
    process.exit(0)
  }

  console.log('✅ No docs drift detected')
  process.exit(0)
}

main()