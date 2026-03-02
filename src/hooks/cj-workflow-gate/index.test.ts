import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createCjWorkflowGateHook } from "./index"
import {
  approveCurrentStage,
  createCjWorkflowState,
  saveCjWorkflowState,
  type CjWorkflowState,
} from "../../tools/cj-web-builder/workflow-state"

function advanceToImplementation(state: CjWorkflowState): CjWorkflowState {
  let current = state
  for (let i = 0; i < 3; i += 1) {
    current = approveCurrentStage({ state: current }).updated
  }
  return current
}

describe("createCjWorkflowGateHook", () => {
  let tempDir = ""

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "cj-workflow-gate-"))
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test("blocks implementation agent during discovery stage", async () => {
    //#given
    const sessionID = "ses-cj-1"
    const state = createCjWorkflowState({
      sessionID,
      idea: "A web app for booking sport courts.",
    })
    saveCjWorkflowState(tempDir, state)

    const hook = createCjWorkflowGateHook({ directory: tempDir } as never)

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
    ).rejects.toThrow("Stage gate blocked")
  })

  test("allows role-matched agent during discovery stage", async () => {
    //#given
    const sessionID = "ses-cj-2"
    const state = createCjWorkflowState({
      sessionID,
      idea: "A web app for habit tracking.",
    })
    saveCjWorkflowState(tempDir, state)

    const hook = createCjWorkflowGateHook({ directory: tempDir } as never)

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
    const sessionID = "ses-cj-3"
    const state = createCjWorkflowState({
      sessionID,
      idea: "A web app for invoice generation.",
    })
    saveCjWorkflowState(tempDir, state)

    const hook = createCjWorkflowGateHook({ directory: tempDir } as never)

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

  test("allows implementation-stage task delegation", async () => {
    //#given
    const sessionID = "ses-cj-4"
    const initialState = createCjWorkflowState({
      sessionID,
      idea: "A web app for team standup notes.",
    })
    const implementationState = advanceToImplementation(initialState)
    saveCjWorkflowState(tempDir, implementationState)

    const hook = createCjWorkflowGateHook({ directory: tempDir } as never)

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
