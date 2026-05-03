#!/usr/bin/env node
/**
 * DAP Stage 2 Discovery Crawler
 *
 * Requires Node 18+ (native fetch, no external deps).
 * Usage: node crawl.mjs <base-url> [--max-pages=100] [--output=./crawl-output.json]
 *
 * Crawls all internal pages from the given base URL.
 * Outputs a JSON file ready for the Stage 2 Discovery agent to analyze.
 */

import { writeFileSync } from 'fs'
import { URL } from 'url'

// ─── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const baseArg  = args.find(a => !a.startsWith('--'))
const maxPages = Number(args.find(a => a.startsWith('--max-pages='))?.split('=')[1] ?? 100)
const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1]
  ?? 'agents/dap-stage2-discovery/crawl-output.json'

if (!baseArg) {
  process.stderr.write('Usage: node crawl.mjs <base-url> [--max-pages=100] [--output=./crawl-output.json]\n')
  process.exit(1)
}

let baseUrl
try {
  baseUrl = new URL(baseArg)
} catch {
  process.stderr.write(`Invalid URL: ${baseArg}\n`)
  process.exit(1)
}

// ─── HTML extraction helpers ──────────────────────────────────────────────────

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : null
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return m ? m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : null
}

function extractMetaDescription(html) {
  const a = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*?)["']/i)
  if (a) return a[1].trim()
  const b = html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i)
  return b ? b[1].trim() : null
}

function extractInternalLinks(html, base) {
  const links = new Set()
  const re = /href=["']([^"']+?)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], base.href)
      if (u.hostname !== base.hostname) continue
      u.search = ''
      u.hash = ''
      links.add(u.href)
    } catch { /* skip unparseable */ }
  }
  return [...links]
}

function hasStructuredData(html) {
  return html.includes('application/ld+json') || html.includes('itemtype') || html.includes('schema.org')
}

function approximateWordCount(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim()
  return body.split(' ').filter(Boolean).length
}

// ─── Crawler ──────────────────────────────────────────────────────────────────

const visited = new Map()
const queue   = [baseUrl.href]
const pages   = []

process.stdout.write(`\nDAP Stage 2 Discovery Crawler\n`)
process.stdout.write(`Target: ${baseUrl.href}\n`)
process.stdout.write(`Max pages: ${maxPages}\n\n`)

while (queue.length > 0 && pages.length < maxPages) {
  const url = queue.shift()
  if (visited.has(url)) continue
  visited.set(url, true)

  const parsedUrl = new URL(url)
  const path = parsedUrl.pathname + (parsedUrl.search || '')

  let statusCode = null
  let html = ''
  let finalUrl = url
  let redirectedFrom = null

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DAP-Stage2-Auditor/1.0 (CBCC Discovery Agent; non-commercial audit)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    statusCode = res.status
    finalUrl = res.url
    if (finalUrl !== url) redirectedFrom = url
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('text/html')) {
      html = await res.text()
    }
  } catch (err) {
    process.stderr.write(`  ERR ${url}: ${err.message}\n`)
  }

  const internalLinks = html ? extractInternalLinks(html, baseUrl) : []

  for (const link of internalLinks) {
    if (!visited.has(link)) queue.push(link)
  }

  const page = {
    url,
    finalUrl: finalUrl !== url ? finalUrl : undefined,
    redirectedFrom,
    path,
    statusCode,
    pageTitle:       html ? extractTitle(html)            : null,
    h1:              html ? extractH1(html)               : null,
    metaDescription: html ? extractMetaDescription(html)  : null,
    wordCount:       html ? approximateWordCount(html)    : 0,
    hasStructuredData: html ? hasStructuredData(html)     : false,
    internalLinks,
  }

  pages.push(page)
  const indicator = statusCode === 200 ? '  OK' : statusCode === null ? ' ERR' : ` ${statusCode}`
  process.stdout.write(`${indicator}  [${pages.length}]  ${path}\n`)
}

// ─── Output ───────────────────────────────────────────────────────────────────

const output = {
  crawledAt: new Date().toISOString(),
  targetBaseUrl: baseUrl.href,
  totalPagesFound: pages.length,
  pages,
}

writeFileSync(outputFile, JSON.stringify(output, null, 2))
process.stdout.write(`\nCrawl complete.\n`)
process.stdout.write(`Pages crawled: ${pages.length}\n`)
process.stdout.write(`Output: ${outputFile}\n\n`)
