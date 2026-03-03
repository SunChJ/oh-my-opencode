"use client"

import React from 'react'
import { Card, CardHeader, CardTitle } from '../../ui/card'

export interface ChatHeaderProps {
  header?: React.ReactNode
}

export function ChatHeader({ header }: ChatHeaderProps) {
  if (!header) return null

  return (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardHeader className="h-[50px] p-0 justify-center">
        {typeof header === 'string' ? (
          <div className="px-6 flex items-center h-full">
            <CardTitle className="text-base">{header}</CardTitle>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center h-full">
            <h1 className="text-lg font-semibold">{header}</h1>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}
