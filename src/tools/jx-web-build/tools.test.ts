import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import { createJxWebBuildTool } from "./tools"

const TEST_ROOT = join(process.cwd(), ".test-jx-web-build")
const TEST_SESSION_ID = "ses-jx-1"

function createMockPluginInput(directory: string): PluginInput {
  return {
    directory,
    client: {},
  } as unknown as PluginInput
}

function createMockContext(sessionID: string, directory: string) {
  return {
    sessionID,
    messageID: "msg-jx-1",
    agent: "sisyphus",
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
  }
}

describe("jx_web_build tool", () => {
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

  test("initializes workflow and starts at ideation", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    //#when
    const initOutput = await tool.execute({
      action: "init",
      idea: "Build a web app to generate tailored interview prep plans.",
      product_name: "Prep Studio",
    }, context)
    const statusOutput = await tool.execute({ action: "status" }, context)

    //#then
    expect(initOutput).toContain("JX workflow initialized")
    expect(statusOutput).toContain("Current stage: ideation")
    expect(statusOutput).toContain("[>] ideation (active)")
  })

  test("returns role and dispatch plans", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for AI note clustering.",
    }, context)

    //#when
    const roleOutput = await tool.execute({ action: "role_plan" }, context)
    const dispatchOutput = await tool.execute({ action: "dispatch_plan" }, context)

    //#then
    expect(roleOutput).toContain("JX Role Plan")
    expect(roleOutput).toContain("task(")
    expect(dispatchOutput).toContain("JX Dispatch Plan")
    expect(dispatchOutput).toContain("Dispatch mode")
  })

  test("approves stage and advances to product_spec", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for collaborative release notes.",
    }, context)

    //#when
    const approveOutput = await tool.execute({
      action: "approve",
      approval_notes: "ideation accepted",
    }, context)
    const statusOutput = await tool.execute({ action: "status" }, context)

    //#then
    expect(approveOutput).toContain("Stage approved: ideation")
    expect(approveOutput).toContain("Activated next stage: product_spec")
    expect(statusOutput).toContain("Current stage: product_spec")
  })

  test("scaffold and backlog outputs are available", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput)
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for creator campaign tracking.",
      product_name: "Campaign Radar",
    }, context)

    //#when
    const scaffoldOutput = await tool.execute({ action: "scaffold" }, context)
    const backlogOutput = await tool.execute({ action: "backlog" }, context)

    //#then
    expect(scaffoldOutput).toContain("npx create-next-app@latest \"artifacts/jx-web-build/campaign-radar\"")
    expect(scaffoldOutput).toContain("Output directory: artifacts/jx-web-build/campaign-radar")
    expect(scaffoldOutput).toContain("npx shadcn@latest init -d")
    expect(backlogOutput).toContain("Backlog is available in implementation stage only")
  })

  test("uses template bootstrap when configured", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput, {
      bootstrapTemplate: "https://github.com/acme/next-shadcn-starter.git",
    })
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for launch checklists.",
      product_name: "Launch Pilot",
    }, context)

    //#when
    const scaffoldOutput = await tool.execute({ action: "scaffold" }, context)

    //#then
    expect(scaffoldOutput).toContain("git clone --depth 1 \"https://github.com/acme/next-shadcn-starter.git\" \"artifacts/jx-web-build/launch-pilot\"")
    expect(scaffoldOutput).toContain("## De-template Checklist")
  })

  test("uses local copy bootstrap when template is a local path", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput, {
      bootstrapTemplate: "/Users/samsoncj/templates/next-shadcn-starter",
    })
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for team retrospectives.",
      product_name: "Retro Base",
    }, context)

    //#when
    const scaffoldOutput = await tool.execute({ action: "scaffold" }, context)

    //#then
    expect(scaffoldOutput).toContain("## Commands (Template Bootstrap - Local Copy)")
    expect(scaffoldOutput).toContain("cp -R \"/Users/samsoncj/templates/next-shadcn-starter/.\" \"artifacts/jx-web-build/retro-base\"")
    expect(scaffoldOutput).toContain("if [ -f pnpm-lock.yaml ]; then PM=pnpm;")
  })

  test("resolves relative template path from workspace directory", async () => {
    //#given
    const pluginInput = createMockPluginInput(TEST_ROOT)
    const tool = createJxWebBuildTool(pluginInput, {
      bootstrapTemplate: "templates/next-shadcn-starter",
    })
    const context = createMockContext(TEST_SESSION_ID, TEST_ROOT)

    await tool.execute({
      action: "init",
      idea: "Build a web app for roadmap planning.",
      product_name: "Roadmap Flow",
    }, context)

    //#when
    const scaffoldOutput = await tool.execute({ action: "scaffold" }, context)

    //#then
    expect(scaffoldOutput).toContain(`cp -R \"${join(TEST_ROOT, "templates/next-shadcn-starter")}/.\" \"artifacts/jx-web-build/roadmap-flow\"`)
  })
})
