import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import { createCjWebBuilderTool } from "./tools"

const TEST_ROOT = join(process.cwd(), ".test-cj-web-builder")
const TEST_SESSION_ID = "session-cj-1"

function createMockPluginInput(directory: string): PluginInput {
  return {
    directory,
    client: {},
  } as unknown as PluginInput
}

function createMockContext(sessionID: string, directory: string) {
  return {
    sessionID,
    messageID: "msg-cj-1",
    agent: "sisyphus",
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
  }
}

describe("cj_web_builder tool", () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true })
    }
  })

  test("initializes workflow and returns discovery stage", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createCjWebBuilderTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    //#when
    const startOutput = await tool.execute({
      action: "start",
      idea: "A web app that helps freelancers manage proposals and invoices.",
      product_name: "Freelance Flow",
    }, context)

    const statusOutput = await tool.execute({ action: "status" }, context)

    //#then
    expect(startOutput).toContain("CJ workflow initialized")
    expect(statusOutput).toContain("Current stage: discovery")
    expect(statusOutput).toContain("[>] discovery (active)")
  })

  test("blocks status-dependent actions before start", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createCjWebBuilderTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    //#when
    const output = await tool.execute({ action: "next_role_tasks" }, context)

    //#then
    expect(output).toContain("Workflow not initialized")
  })

  test("approves stage and advances gate", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createCjWebBuilderTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "start",
      idea: "A web app that generates social media post drafts from product docs.",
    }, context)

    //#when
    const approveOutput = await tool.execute({
      action: "approve_stage",
      approval_notes: "PRD accepted by user",
    }, context)

    const statusOutput = await tool.execute({ action: "status" }, context)

    //#then
    expect(approveOutput).toContain("Stage approved: discovery")
    expect(approveOutput).toContain("Activated next stage: ux_ui")
    expect(statusOutput).toContain("Current stage: ux_ui")
    expect(statusOutput).toContain("[x] discovery (approved)")
    expect(statusOutput).toContain("[>] ux_ui (active)")
  })

  test("returns scaffold plan for nextjs and shadcn", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createCjWebBuilderTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "start",
      idea: "A web app for organizing reading notes.",
      product_name: "Note Garden",
    }, context)

    //#when
    const output = await tool.execute({ action: "scaffold_plan" }, context)

    //#then
    expect(output).toContain("npx create-next-app@latest")
    expect(output).toContain("npx shadcn@latest init -d")
    expect(output).toContain("note-garden")
  })

  test("returns dispatch plan for current stage", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createCjWebBuilderTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "start",
      idea: "A web app for collecting user interview snippets.",
    }, context)

    //#when
    const output = await tool.execute({ action: "dispatch_plan" }, context)

    //#then
    expect(output).toContain("CJ Dispatch Plan: Discovery")
    expect(output).toContain("Dispatch mode: parallel")
    expect(output).toContain("task(")
  })
})
