import { HTTPClient } from '@/http';
import { NextResponse } from 'next/server';

export const oapiClient = new HTTPClient({
  baseURL: process.env.NOVA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Tenant-Id': process.env.NOVA_TENANT_ID,
    'Authorization': process.env.NOVA_ACCESS_KEY,
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendResponse = (res: any) => {
  if (res.success === false) {
    return NextResponse.json(
      {
        code: res.code,
        message: res.message,
        request_id: res.request_id,
        success: false,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      code: res.code,
      request_id: res.request_id,
      success: true,
      data: res,
    },
    { status: 200 }
  )
}