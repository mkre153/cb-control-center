'use client'

import { useState, useCallback } from 'react'

interface Props {
  leftPanel: React.ReactNode
  centerPanel: React.ReactNode
  rightPanel: React.ReactNode
}

const LEFT_WIDTH = 180

export function CbccWorkspaceLayout({ leftPanel, centerPanel, rightPanel }: Props) {
  const [centerWidth, setCenterWidth] = useState(540)

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = centerWidth

      const onMove = (ev: MouseEvent) => {
        setCenterWidth(Math.min(860, Math.max(320, startWidth + ev.clientX - startX)))
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
    [centerWidth],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — fixed width */}
      <div style={{ width: LEFT_WIDTH }} className="shrink-0 flex flex-col overflow-y-auto border-r border-gray-800">
        {leftPanel}
      </div>

      {/* Center */}
      <div style={{ width: centerWidth }} className="shrink-0 flex flex-col">
        {centerPanel}
      </div>

      {/* Divider — center/right only */}
      <div
        onMouseDown={startResize}
        className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500/50 cursor-col-resize transition-colors"
      />

      {/* Right */}
      <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
        {rightPanel}
      </div>
    </div>
  )
}
