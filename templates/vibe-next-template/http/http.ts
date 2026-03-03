/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultGetResult, HttpDefine } from './type'

export async function http<R = any>(define: HttpDefine): Promise<R> {
  const sureDefined = define

  const url = HttpDefine.getUrl(sureDefined)
  const headers = HttpDefine.getHeader(sureDefined)
  const body = HttpDefine.getBody(sureDefined)

  const fetchOption: RequestInit = {
    method: (sureDefined.method || 'get').toUpperCase(),
    headers,
    credentials: sureDefined.credentials ?? 'same-origin',
  }

  if (sureDefined.abort) {
    fetchOption.signal = sureDefined.abort.signal
  }

  if (sureDefined.timeout) {
    const abort = sureDefined.abort || new AbortController()

    setTimeout(() => {
      abort.abort()
    }, sureDefined.timeout)

    fetchOption.signal = abort.signal
  }

  if (
    !['get', 'head', 'options', 'GET', 'HEAD', 'OPTIONS'].includes(fetchOption.method!) &&
    body != null
  ) {
    fetchOption.body = body
  }

  try {
    const response = await fetch(url, fetchOption)
    if (!response.ok) {
      const errorMessage = sureDefined.customErrorMessage || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }
    return defaultGetResult(response)
  } catch (error) {
    throw error
  }
}
