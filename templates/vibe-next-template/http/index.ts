/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpDefine } from './type'
import { http } from './http'

export class HTTPClient {
  base: HttpDefine

  constructor(base: HttpDefine) {
    this.base = base
  }

  request<R = any>(config: HttpDefine): Promise<R> {
    return http({ ...this.base, ...config })
  }

  get<R = any>(url: string, query?: any, config?: HttpDefine): Promise<R> {
    return this.request({ ...config, url, method: 'get', query })
  }

  delete<R = any>(url: string, query?: any, config?: HttpDefine): Promise<R> {
    return this.request({ ...config, url, method: 'delete', query })
  }

  head<R = any>(url: string, config?: HttpDefine): Promise<R> {
    return this.request({ ...config, url, method: 'head' })
  }

  options<R = any>(url: string, config?: HttpDefine): Promise<R> {
    return this.request({ ...config, url, method: 'options' })
  }

  post<R = any>(url: string, body?: any, config?: HttpDefine): Promise<R> {
    return this.request({
      ...config,
      url,
      method: 'post',
      body,
    })
  }

  put<R = any>(url: string, body?: any, config?: HttpDefine): Promise<R> {
    return this.request({
      ...config,
      url,
      method: 'put',
      body,
    })
  }

  patch<R = any>(url: string, body?: any, config?: HttpDefine): Promise<R> {
    return this.request({
      ...config,
      url,
      method: 'patch',
      body,
    })
  }
}
