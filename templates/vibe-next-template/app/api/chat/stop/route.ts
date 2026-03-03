import { NextRequest } from 'next/server'
import { oapiClient, sendResponse } from '../../oapi-client'

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversation_id')
  const res = await oapiClient.post('/v1/oapi/super_agent/stop_chat', {
    conversation_id: conversationId,
  })

  return sendResponse(res)
}
