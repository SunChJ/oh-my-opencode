import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createJxWorkflowGateHook } from "./index"
import {
  approveJxStage,
  createJxWorkflowState,
  saveJxWorkflowState,
  type JxWorkflowState,
} from "../../tools/jx-web-build/workflow-state"

function advanceToImplementation(state: JxWorkflowState): JxWorkflowState {
  let current = state
  for (let i = 0; i < 4; i += 1) {
    current = approveJxStage({ state: current }).updated
  }
  return current
}

describe("createJxWorkflowGateHook", () => {
  let tempDir = ""

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "jx-workflow-gate-"))
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test("blocks implementation agent before implementation stage", async () => {
    //#given
    const sessionID = "ses-jx-gate-1"
    const state = createJxWorkflowState({
      sessionID,
      idea: "Build a web app for webinar notes.",
    })
    saveJxWorkflowState(tempDir, state)

    const hook = createJxWorkflowGateHook({ directory: tempDir } as never)

    //#when / #then
    await expect(
      hook["tool.execute.before"]?.(
        {
          tool: "task",
          sessionID,
          callID: "call-1",
        } as never,
        {
          args: {
            subagent_type: "sisyphus",
            run_in_background: false,
          },
        } as never,
      ),
    ).rejects.toThrow("JX stage gate blocked")
  })

  test("allows role-matched agent in ideation", async () => {
    //#given
    const sessionID = "ses-jx-gate-2"
    const state = createJxWorkflowState({
      sessionID,
      idea: "Build a web app for async team updates.",
    })
    saveJxWorkflowState(tempDir, state)

    const hook = createJxWorkflowGateHook({ directory: tempDir } as never)

    //#when / #then
    await expect(
      hook["tool.execute.before"]?.(
        {
          tool: "task",
          sessionID,
          callID: "call-2",
        } as never,
        {
          args: {
            subagent_type: "oracle",
            run_in_background: false,
          },
        } as never,
      ),
    ).resolves.toBeUndefined()
  })

  test("blocks category delegation before implementation", async () => {
    //#given
    const sessionID = "ses-jx-gate-3"
    const state = createJxWorkflowState({
      sessionID,
      idea: "Build a web app for creator CRM.",
    })
    saveJxWorkflowState(tempDir, state)

    const hook = createJxWorkflowGateHook({ directory: tempDir } as never)

    //#when / #then
    await expect(
      hook["tool.execute.before"]?.(
        {
          tool: "task",
          sessionID,
          callID: "call-3",
        } as never,
        {
          args: {
            category: "quick",
            run_in_background: false,
          },
        } as never,
      ),
    ).rejects.toThrow("category delegation")
  })

  test("allows delegation in implementation stage", async () => {
    //#given
    const sessionID = "ses-jx-gate-4"
    const initial = createJxWorkflowState({
      sessionID,
      idea: "Build a web app for startup KPI tracking.",
    })
    const implementationState = advanceToImplementation(initial)
    saveJxWorkflowState(tempDir, implementationState)

    const hook = createJxWorkflowGateHook({ directory: tempDir } as never)

    //#when / #then
    await expect(
      hook["tool.execute.before"]?.(
        {
          tool: "task",
          sessionID,
          callID: "call-4",
        } as never,
        {
          args: {
            subagent_type: "sisyphus",
            run_in_background: false,
          },
        } as never,
      ),
    ).resolves.toBeUndefined()
  })
})
