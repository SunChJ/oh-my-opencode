import type { PluginInput } from "@opencode-ai/plugin"
import type { CjWorkflowStage } from "../../tools/cj-web-builder/stage-definitions"
import { readCjWorkflowState } from "../../tools/cj-web-builder/workflow-state"

type ToolExecuteInput = {
  tool: string
  sessionID: string
  callID: string
}

type ToolExecuteBeforeOutput = {
  args: Record<string, unknown>
}

const STAGE_ALLOWED_AGENTS: Record<Exclude<CjWorkflowStage, "implementation">, Set<string>> = {
  discovery: new Set(["oracle", "librarian", "explore"]),
  ux_ui: new Set(["metis", "momus", "explore", "librarian"]),
  architecture: new Set(["hephaestus", "oracle", "librarian", "metis"]),
  qa: new Set([
    "explore",
    "momus",
    "oracle",
    "librarian",
    "hephaestus",
    "metis",
    "sisyphus",
    "sisyphus-junior",
  ]),
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeAgent(agent: string | undefined): string | undefined {
  if (!agent) return undefined
  return agent.replace(/^@+/, "").toLowerCase()
}

function buildBlockedMessage(input: {
  stage: CjWorkflowStage
  requested: string
  allowed: Set<string>
}): string {
  const allowedList = Array.from(input.allowed).sort().join(", ")

  return [
    `Stage gate blocked: current cj stage is "${input.stage}".`,
    `Requested agent "${input.requested}" is not allowed in this stage.`,
    `Allowed agents now: ${allowedList}.`,
    "Use cj_web_builder(action=\"next_role_tasks\") for guided roles, then approve stage when done.",
  ].join(" ")
}

export function createCjWorkflowGateHook(ctx: PluginInput) {
  return {
    "tool.execute.before": async (
      input: ToolExecuteInput,
      output: ToolExecuteBeforeOutput,
    ): Promise<void> => {
      const workflowState = readCjWorkflowState(ctx.directory, input.sessionID)
      if (!workflowState) {
        return
      }

      const stage = workflowState.currentStage
      if (stage === "implementation") {
        return
      }

      const toolName = input.tool.toLowerCase()
      if (toolName !== "task" && toolName !== "call_omo_agent") {
        return
      }

      const args = output.args
      const hasSessionContinuation = readString(args.session_id)
      if (hasSessionContinuation) {
        return
      }

      const allowed = STAGE_ALLOWED_AGENTS[stage]

      if (toolName === "task") {
        const category = readString(args.category)
        if (category) {
          throw new Error(
            `Stage gate blocked: category delegation is only allowed in implementation stage. Current stage: "${stage}".`
          )
        }
      }

      const requestedAgent = normalizeAgent(readString(args.subagent_type))
      if (!requestedAgent) {
        return
      }

      if (!allowed.has(requestedAgent)) {
        throw new Error(
          buildBlockedMessage({
            stage,
            requested: requestedAgent,
            allowed,
          })
        )
      }
    },
  }
}
