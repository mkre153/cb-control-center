// Claude CLI implementation of StoryExtractionProvider.
//
// TEMPORARY LOCAL RUNTIME PATH — spawns the Claude Code CLI to call Opus 4.7.
// Mirrors the same transport as dapStageReviewer.ts.
// Replace with an Anthropic SDK provider (AnthropicSdkStoryExtractionProvider)
// when CBCC moves to a server-side SDK runtime.

import { spawn } from 'child_process'
import type { StoryExtractionProvider } from './storyExtractionRunner'

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? '/Users/mike/.local/bin/claude'
const CLAUDE_PATH = `/Users/mike/.local/bin:${process.env.PATH ?? ''}`

export class ClaudeCliStoryExtractionProvider implements StoryExtractionProvider {
  generate(system: string, user: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        CLAUDE_BIN,
        ['-p', user, '--system-prompt', system, '--model', 'claude-sonnet-4-6'],
        { env: { ...process.env, PATH: CLAUDE_PATH } },
      )

      let stdout = ''
      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
      child.stderr.on('data', () => {})
      child.stdin.end()

      child.on('error', err => reject(new Error(`Claude CLI spawn failed: ${err.message}`)))
      child.on('close', code => {
        if (code !== 0 && stdout.trim().length === 0) {
          reject(new Error(`Claude CLI exited with code ${code} and no output`))
        } else {
          resolve(stdout)
        }
      })
    })
  }
}
