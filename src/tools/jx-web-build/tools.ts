import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  approveJxStage,
  createJxWorkflowState,
  readJxWorkflowState,
  saveJxWorkflowState,
} from "./workflow-state"
import {
  renderJxDispatchPlan,
  renderJxImplementationBacklog,
  renderJxRolePlan,
  renderJxScaffoldPlan,
  renderJxWorkflowStatus,
} from "./workflow-renderer"

type JxAction =
  | "init"
  | "status"
  | "role_plan"
  | "dispatch_plan"
  | "scaffold"
  | "backlog"
  | "approve"

type JxWebBuildArgs = {
  action: JxAction
  idea?: string
  product_name?: string
  approval_notes?: string
  force_restart?: boolean
}

type JxToolContext = {
  sessionID: string
  directory?: string
}

type JxWebBuildToolOptions = {
  bootstrapTemplate?: string
}

const JX_WEB_BUILD_DESCRIPTION = `JX web build orchestrator for beginner-friendly product delivery.

Build flow: ideation -> product_spec -> experience_design -> technical_design -> implementation -> launch_readiness.

Use this tool to initialize workflow state, generate role plans and dispatch plans, approve stage gates, and produce Next.js + shadcn scaffold guidance.`

function resolveDirectory(ctx: PluginInput, toolContext: JxToolContext): string {
  if (typeof toolContext.directory === "string" && toolContext.directory.length > 0) {
    return toolContext.directory
  }

  return ctx.directory
}

function handleInit(args: JxWebBuildArgs, sessionID: string, directory: string): string {
  const existing = readJxWorkflowState(directory, sessionID)
  if (existing && args.force_restart !== true) {
    return [
      "JX workflow already exists for this session.",
      "Use `force_restart=true` to replace it, or call `status`.",
      "",
      renderJxWorkflowStatus(existing),
    ].join("\n")
  }

  if (!args.idea || args.idea.trim().length === 0) {
    return "Missing required field: `idea` for action=init"
  }

  const state = createJxWorkflowState({
    sessionID,
    idea: args.idea,
    productName: args.product_name,
  })
  saveJxWorkflowState(directory, state)

  return [
    "JX workflow initialized.",
    "",
    renderJxWorkflowStatus(state),
    "",
    "Next: `jx_web_build(action=\"role_plan\")`.",
  ].join("\n")
}

function requireState(sessionID: string, directory: string): { stateText?: string; state?: ReturnType<typeof readJxWorkflowState> } {
  const state = readJxWorkflowState(directory, sessionID)
  if (!state) {
    return {
      stateText: "Workflow not initialized. Run `jx_web_build(action=\"init\", idea=\"...\")` first.",
    }
  }

  return { state }
}

export function createJxWebBuildTool(
  ctx: PluginInput,
  options?: JxWebBuildToolOptions,
): ToolDefinition {
  return tool({
    description: JX_WEB_BUILD_DESCRIPTION,
    args: {
      action: tool.schema
        .enum(["init", "status", "role_plan", "dispatch_plan", "scaffold", "backlog", "approve"])
        .describe("Workflow action"),
      idea: tool.schema.string().optional().describe("Web app idea (required for init)"),
      product_name: tool.schema.string().optional().describe("Optional product name"),
      approval_notes: tool.schema.string().optional().describe("Approval notes for approve action"),
      force_restart: tool.schema.boolean().optional().describe("Reset existing session workflow on init"),
    },
    execute: async (rawArgs: JxWebBuildArgs, toolContext: JxToolContext): Promise<string> => {
      const sessionID = toolContext.sessionID
      if (!sessionID || sessionID.trim().length === 0) {
        return "Missing session context: sessionID"
      }

      const directory = resolveDirectory(ctx, toolContext)

      switch (rawArgs.action) {
        case "init":
          return handleInit(rawArgs, sessionID, directory)

        case "status": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderJxWorkflowStatus(state!)
        }

        case "role_plan": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderJxRolePlan(state!)
        }

        case "dispatch_plan": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderJxDispatchPlan(state!)
        }

        case "scaffold": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderJxScaffoldPlan(state!, {
            bootstrapTemplate: options?.bootstrapTemplate,
          })
        }

        case "backlog": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderJxImplementationBacklog(state!)
        }

        case "approve": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText

          const { updated, previousStage, nextStage } = approveJxStage({
            state: state!,
            notes: rawArgs.approval_notes,
          })
          saveJxWorkflowState(directory, updated)

          if (!nextStage) {
            return [
              `Stage approved: ${previousStage}`,
              "Workflow completed.",
              "",
              renderJxWorkflowStatus(updated),
            ].join("\n")
          }

          return [
            `Stage approved: ${previousStage}`,
            `Activated next stage: ${nextStage}`,
            "",
            renderJxWorkflowStatus(updated),
          ].join("\n")
        }

        default:
          return `Unsupported action: ${String(rawArgs.action)}`
      }
    },
  })
}
