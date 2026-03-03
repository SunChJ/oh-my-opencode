"use client"

import React, { createContext, useEffect, useState } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

export const HighlighterContext = createContext<HighlighterCore | null>(null)

export interface HighlighterProviderProps {
  children: React.ReactNode
}

/**
 * Shiki Highlighter Provider - 提供全局的代码高亮器实例
 */
export function HighlighterProvider({ children }: HighlighterProviderProps) {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  useEffect(() => {
    let mounted = true

    createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark-default'),
        import('@shikijs/themes/vitesse-dark'),
        import('@shikijs/themes/one-light'),
        import('@shikijs/themes/snazzy-light'),
        import('@shikijs/themes/everforest-light'),
      ],
      langs: [
        import('@shikijs/langs/css'),
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/jsx'),
        import('@shikijs/langs/xml'),
        import('@shikijs/langs/html'),
        import('@shikijs/langs/python'),
        import('@shikijs/langs/sh'),
        import('@shikijs/langs/json'),
        import('@shikijs/langs/sql'),
        import('@shikijs/langs/nginx'),
        import('@shikijs/langs/mermaid'),
        import('@shikijs/langs/markdown'),
      ],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    }).then(h => {
      if (mounted) {
        setHighlighter(h)
      }
    })

    return () => {
      mounted = false
      highlighter?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HighlighterContext.Provider value={highlighter}>
      {children}
    </HighlighterContext.Provider>
  )
}