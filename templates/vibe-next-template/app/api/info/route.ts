import { NextResponse } from 'next/server'

const buildWssUrl = () => {
  const baseUrl = process.env.NOVA_BASE_URL!
  const wssBase = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')
  const authorization = process.env.NOVA_ACCESS_KEY
  const tenantId = process.env.NOVA_TENANT_ID
  return `${wssBase}/v1/super_agent/chat/completions?Authorization=${authorization}&X-Locale=zh&X-Region=CN&Tenant-Id=${tenantId}`
}

export async function GET() {
  // const conversationId = req.nextUrl.searchParams.get('conversation_id') // string | null
  const conversationId = "dd70dec949314d38a3d041d0f7e3c9fa"

  // if (!conversationId) {
  //   const res = await oapiClient.post('/v1/oapi/super_agent/chat/create_conversation', {
  //     agent_id: process.env.NOVA_AGENT_ID,
  //     title: 'new conversation',
  //   })

  //   return NextResponse.json(
  //     {
  //       code: 0,
  //       message: 'ok',
  //       data: {
  //         apiBaseUrl: process.env.NOVA_BASE_URL,
  //         agent_id: process.env.NOVA_AGENT_ID,
  //         conversation_id: res.conversation_id,
  //         wssUrl: buildWssUrl(),
  //         token: process.env.NOVA_ACCESS_KEY,
  //         tenantId: process.env.NOVA_TENANT_ID,
  //       },
  //     },
  //     { status: 200 }
  //   )
  // }

  return NextResponse.json(
    {
      success: true,
      data: {
        apiBaseUrl: '/api',
        agent_id: process.env.NOVA_AGENT_ID,
        conversation_id: conversationId,
        wssUrl: buildWssUrl(),
        token: process.env.NOVA_ACCESS_KEY,
        tenantId: process.env.NOVA_TENANT_ID,
      },
    },
    { status: 200 }
  )
}
