import { oapiClient, sendResponse } from '../../oapi-client'

export async function POST(req: Request) {
  const body = req.body ? await req.json() : {}
  const res = await oapiClient.post('/v1/oapi/super_agent/chat/oss_url', body)

  return sendResponse(res)
}
