import { oapiClient, sendResponse } from '../oapi-client'

export async function GET() {
  const res = await oapiClient.get('/v1/oapi/super_agent/chat/conversation_list', {
    page_no: 1,
    page_size: 10,
    agent_id: process.env.NOVA_AGENT_ID,
  })

  return sendResponse(res)
}
