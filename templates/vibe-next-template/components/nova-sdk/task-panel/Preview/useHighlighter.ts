"use client"

import { useEffect, useState } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

export function useHighlighter(_highlighter?: HighlighterCore | null) {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  useEffect(() => {
    if (_highlighter) {
      return
    }

    createHighlighterCore({
      themes: [
        import('@shikijs/themes/one-light'),
        import('@shikijs/themes/vitesse-dark'),
        import('@shikijs/themes/snazzy-light'),
        import('@shikijs/themes/everforest-light'),
        import('@shikijs/themes/github-dark-default'),
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
    }).then(highlighter => {
      setHighlighter(highlighter)
    })
  }, [_highlighter])

  useEffect(() => {
    return () => {
      highlighter?.dispose()
    }
  }, [highlighter])

  return _highlighter || highlighter
}
