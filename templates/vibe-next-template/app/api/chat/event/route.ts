import { NextRequest } from 'next/server'
import { oapiClient, sendResponse } from '../../oapi-client'

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversation_id')
  const pageNo = req.nextUrl.searchParams.get('page_no')
  const pageSize = req.nextUrl.searchParams.get('page_size')

  const res = await oapiClient.get('/v1/oapi/super_agent/chat/event_list', {
    agent_id: process.env.NOVA_AGENT_ID,
    conversation_id: conversationId,
    page_no: pageNo,
    page_size: pageSize,
  })

  return sendResponse(res)
}
