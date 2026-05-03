'use client'

import { useState, useCallback } from 'react'

interface Props {
  leftPanel: React.ReactNode
  centerPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export function CbccWorkspaceLayout({ leftPanel, centerPanel, rightPanel }: Props) {
  const [leftWidth, setLeftWidth] = useState(224)
  const [centerWidth, setCenterWidth] = useState(380)

  const startResize = useCallback(
    (column: 'left' | 'center', e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = column === 'left' ? leftWidth : centerWidth
      const min = column === 'left' ? 140 : 240
      const max = column === 'left' ? 480 : 720
      const setter = column === 'left' ? setLeftWidth : setCenterWidth

      const onMove = (ev: MouseEvent) => {
        setter(Math.min(max, Math.max(min, startWidth + ev.clientX - startX)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [leftWidth, centerWidth],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left */}
      <div style={{ width: leftWidth }} className="shrink-0 flex flex-col overflow-y-auto">
        {leftPanel}
      </div>

      {/* Divider 1 */}
      <div
        onMouseDown={e => startResize('left', e)}
        className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500/50 cursor-col-resize transition-colors"
      />

      {/* Center */}
      <div style={{ width: centerWidth }} className="shrink-0 flex flex-col">
        {centerPanel}
      </div>

      {/* Divider 2 */}
      <div
        onMouseDown={e => startResize('center', e)}
        className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500/50 cursor-col-resize transition-colors"
      />

      {/* Right */}
      <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
        {rightPanel}
      </div>
    </div>
  )
}
