import type { PluginInput } from "@opencode-ai/plugin"
import type { JxWorkflowStage } from "../../tools/jx-web-build/stage-definitions"
import { readJxWorkflowState } from "../../tools/jx-web-build/workflow-state"

type ToolExecuteInput = {
  tool: string
  sessionID: string
  callID: string
}

type ToolExecuteBeforeOutput = {
  args: Record<string, unknown>
}

const STAGE_ALLOWED_AGENTS: Record<Exclude<JxWorkflowStage, "implementation">, Set<string>> = {
  ideation: new Set(["oracle", "librarian", "explore"]),
  product_spec: new Set(["oracle", "librarian"]),
  experience_design: new Set(["metis", "momus", "explore", "librarian"]),
  technical_design: new Set(["hephaestus", "oracle", "metis", "librarian"]),
  launch_readiness: new Set(["explore", "momus", "oracle", "librarian", "hephaestus", "metis", "sisyphus"]),
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeAgent(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.replace(/^@+/, "").toLowerCase()
}

function buildStageBlockMessage(input: {
  stage: JxWorkflowStage
  requestedAgent: string
  allowedAgents: Set<string>
}): string {
  const allowedList = Array.from(input.allowedAgents).sort().join(", ")
  return [
    `JX stage gate blocked: current stage is \"${input.stage}\".`,
    `Requested agent \"${input.requestedAgent}\" is not allowed now.`,
    `Allowed agents: ${allowedList}.`,
    "Run jx_web_build(action=\"role_plan\") to follow the stage role split.",
  ].join(" ")
}

export function createJxWorkflowGateHook(ctx: PluginInput) {
  return {
    "tool.execute.before": async (
      input: ToolExecuteInput,
      output: ToolExecuteBeforeOutput,
    ): Promise<void> => {
      const workflowState = readJxWorkflowState(ctx.directory, input.sessionID)
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
      const isContinuation = readString(args.session_id)
      if (isContinuation) {
        return
      }

      if (toolName === "task") {
        const category = readString(args.category)
        if (category) {
          throw new Error(
            `JX stage gate blocked: category delegation requires implementation stage. Current stage: \"${stage}\".`
          )
        }
      }

      const requestedAgent = normalizeAgent(readString(args.subagent_type))
      if (!requestedAgent) {
        return
      }

      const allowedAgents = STAGE_ALLOWED_AGENTS[stage]
      if (!allowedAgents.has(requestedAgent)) {
        throw new Error(
          buildStageBlockMessage({
            stage,
            requestedAgent,
            allowedAgents,
          })
        )
      }
    },
  }
}
