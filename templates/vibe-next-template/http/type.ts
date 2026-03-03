/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, hasIn, isNil, isString, merge, omitBy } from 'lodash-es'
import type { IStringifyOptions } from 'qs'
import qs from 'qs'

export async function defaultGetResult(response: Response) {
  if (response.headers.get('content-type')?.includes('application/json')) {
    const jsonData = await response.json()
    if (hasIn(jsonData, 'data')) {
      return jsonData.data
    }
    return jsonData
  }

  return response
}

export class HttpDefine implements Omit<RequestInit, 'body'> {
  baseURL?: string

  url?: string

  method?: string

  abort?: AbortController

  timeout?: number

  credentials?: RequestCredentials

  ignoreError?: boolean

  noRedirect?: boolean

  customErrorMessage?: string

  ignoreShowLimitedModal?: boolean

  headers?: Record<string, any> = {
    'Content-Type': 'application/json',
  }

  query?: Record<string, any>

  // qs 序列化参数使用
  querySerializer?: IStringifyOptions

  body?: Record<string, any> | FormData

  static hasOrigin(url: string) {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname !== ''
    } catch {
      // 如果 URL 无效，返回 false
      return false
    }
  }

  static mergeUrl(baseURL: string, url: string) {
    if (this.hasOrigin(url)) return url
    if (!baseURL) return url
    let prefix = baseURL
    let last = url
    if (baseURL[baseURL.length - 1] === '/') {
      prefix = baseURL.substring(0, baseURL.length - 1)
    }
    if (url[0] === '/') {
      last = url.substring(1)
    }
    return `${prefix}/${last}`
  }

  static getUrl<T extends HttpDefine>(define: T = {} as any) {
    const urlObj = new URL(
      this.mergeUrl(define.baseURL ?? '', define.url ?? ''),
      typeof window === 'object' ? window.origin : undefined,
    )

    const searchStr = urlObj.searchParams.toString()
    const searchObj = merge(qs.parse(searchStr), define.query)
    const sureSearchStr = qs.stringify(searchObj, define.querySerializer)

    const base = `${urlObj.origin}${urlObj.pathname}`
    if (sureSearchStr) {
      return `${base}?${sureSearchStr}`
    }
    return base
  }

  static getHeader<T extends HttpDefine>(define: T = {} as any) {
    const sureHeaders = omitBy(
      merge({}, define.headers ?? {}),
      isNil,
    ) as Record<string, any>

    if (
      get(sureHeaders, 'Content-Type', '').includes('multipart/form-data') ||
      define.body instanceof FormData
    ) {
      delete sureHeaders['Content-Type']
    } else if (!get(sureHeaders, 'Content-Type', '')) {
      sureHeaders['Content-Type'] = 'application/json'
    }

    return sureHeaders
  }

  static getBody<T extends HttpDefine>(define: T = {} as any) {
    if (isString(define.body)) {
      return define.body
    }

    if (define.body instanceof FormData) {
      return define.body
    }

    if (define.body == null) return null

    if (
      get(define.headers, 'Content-Type', '').includes('multipart/form-data')
    ) {
      const formData = new FormData()

      Object.entries(define.body ?? []).forEach(([key, value]) => {
        formData.append(key, value)
      })

      return formData
    }

    return JSON.stringify(define.body || null)
  }
}
