# vibe-next-template

基于 Next.js 的 Nova Chat 前端模板项目，包含聊天消息流、事件列表、会话列表与上传能力。

## 1. 启动方式

### 环境要求

- Node.js >= 20（建议使用 LTS）
- pnpm >= 9

### 本地开发

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量（见下文“环境变量”）

```bash
cp .env.example .env.local
```

> 如果仓库中没有 `.env.example`，请手动创建 `.env.local`。

3. 启动开发服务器

```bash
pnpm dev
```

4. 打开浏览器

```text
http://localhost:3000
```

### 生产构建与运行

```bash
pnpm build
pnpm start
```

### 代码检查

```bash
pnpm lint
```

## 2. 基础框架与技术栈

- Next.js 16（App Router）
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI（基础 UI 组件）
- Zustand（状态管理）

## 3. 环境变量定义

请在项目根目录创建 `.env.local`，并配置以下变量：

### 必填变量

| 变量名 | 说明 | 示例 |
|---|---|---|
| `NOVA_BASE_URL` | Nova OpenAPI 服务地址（HTTP/HTTPS） | `https://your-nova-host.com` |
| `NOVA_AGENT_ID` | Agent 标识，创建会话/拉取事件等接口会使用 | `agent_xxx` |
| `NOVA_TENANT_ID` | 租户 ID，请求头 `Tenant-Id` 使用 | `tenant_xxx` |
| `NOVA_ACCESS_KEY` | 服务端调用 OpenAPI 使用的鉴权值，请求头 `Authorization` 使用 | `access_key_xxx` |

### `.env.local` 示例

```bash
NOVA_BASE_URL=https://your-nova-host.com
NOVA_TENANT_ID=tenant_xxx
NOVA_ACCESS_KEY=access_key_xxx
NOVA_AGENT_ID=agent_xxx
```
