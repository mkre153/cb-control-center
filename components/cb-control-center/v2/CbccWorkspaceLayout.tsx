'use client'

import { useState, useCallback } from 'react'

interface Props {
  leftPanel: React.ReactNode
  centerPanel: React.ReactNode
  rightPanel: React.ReactNode
}

const LEFT_WIDTH = 360
const RIGHT_WIDTH = 390

export function CbccWorkspaceLayout({ leftPanel, centerPanel, rightPanel }: Props) {
  const [rightWidth, setRightWidth] = useState(RIGHT_WIDTH)

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = rightWidth

      const onMove = (ev: MouseEvent) => {
        setRightWidth(Math.min(800, Math.max(280, startWidth - (ev.clientX - startX))))
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
    [rightWidth],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — fixed */}
      <div style={{ width: LEFT_WIDTH }} className="shrink-0 flex flex-col overflow-y-auto border-r border-gray-800">
        {leftPanel}
      </div>

      {/* Center — flex-1, takes all remaining space */}
      <div className="flex-1 min-w-0 flex flex-col">
        {centerPanel}
      </div>

      {/* Divider — center/right */}
      <div
        onMouseDown={startResize}
        className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500/50 cursor-col-resize transition-colors"
      />

      {/* Right — fixed, draggable */}
      <div style={{ width: rightWidth }} className="shrink-0 overflow-y-auto px-8 py-6">
        {rightPanel}
      </div>
    </div>
  )
}
