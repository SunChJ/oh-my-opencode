import { oapiClient, sendResponse } from '../../oapi-client'

export async function POST(req: Request) {
  const body = await req.formData()
  const res = await oapiClient.post('/v1/oapi/super_agent/chat/file_upload', body)

  return sendResponse(res)
}
