'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function CbccAiChatPanel({ projectSlug }: { projectSlug: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text || !projectSlug) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    // TODO: wire Claude API — call server action with projectSlug + message history
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">AI Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              {projectSlug
                ? 'Ask about this project, stage requirements, or what to do next.'
                : 'Select a project to start a conversation.'}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-800 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={projectSlug ? 'Ask about this stage...' : 'Select a project first...'}
            disabled={!projectSlug}
            className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-40"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !projectSlug}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-md transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
