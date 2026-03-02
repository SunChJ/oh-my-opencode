import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import {
  approveCurrentStage,
  createCjWorkflowState,
  readCjWorkflowState,
  saveCjWorkflowState,
} from "./workflow-state"
import {
  renderCurrentScaffoldPlan,
  renderCurrentStageRolePlan,
  renderDispatchPlan,
  renderWorkflowStatus,
} from "./workflow-renderer"

const CJ_WEB_BUILDER_DESCRIPTION = `CJ web-app workflow orchestrator for novice users.

Manages stage gates and role assignments to build a web app idea using Next.js + shadcn.

Stages: discovery -> ux_ui -> architecture -> implementation -> qa.
Use this tool to initialize workflow, inspect current stage, get role-task templates, and approve stage gates.`

type CjAction =
  | "start"
  | "status"
  | "next_role_tasks"
  | "dispatch_plan"
  | "approve_stage"
  | "scaffold_plan"

type CjWebBuilderArgs = {
  action: CjAction
  idea?: string
  product_name?: string
  approval_notes?: string
  force_restart?: boolean
}

type CjToolContext = {
  sessionID: string
  directory?: string
}

function resolveDirectory(ctx: PluginInput, toolContext: CjToolContext): string {
  if (typeof toolContext.directory === "string" && toolContext.directory.length > 0) {
    return toolContext.directory
  }
  return ctx.directory
}

function handleStart(args: CjWebBuilderArgs, sessionID: string, directory: string): string {
  const existing = readCjWorkflowState(directory, sessionID)

  if (existing && args.force_restart !== true) {
    return [
      "Workflow already exists for this session.",
      "Use `force_restart=true` to replace it, or call `status`.",
      "",
      renderWorkflowStatus(existing),
    ].join("\n")
  }

  if (!args.idea || args.idea.trim().length === 0) {
    return "Missing required field: `idea` for action=start"
  }

  const state = createCjWorkflowState({
    sessionID,
    idea: args.idea,
    productName: args.product_name,
  })
  saveCjWorkflowState(directory, state)

  return [
    "CJ workflow initialized.",
    "",
    renderWorkflowStatus(state),
    "",
    "Next: run `cj_web_builder(action=\"next_role_tasks\")`.",
  ].join("\n")
}

function requireState(sessionID: string, directory: string): { stateText?: string; state?: ReturnType<typeof readCjWorkflowState> } {
  const state = readCjWorkflowState(directory, sessionID)
  if (!state) {
    return {
      stateText: "Workflow not initialized. Run `cj_web_builder(action=\"start\", idea=\"...\")` first.",
    }
  }
  return { state }
}

export function createCjWebBuilderTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: CJ_WEB_BUILDER_DESCRIPTION,
    args: {
      action: tool.schema
        .enum(["start", "status", "next_role_tasks", "dispatch_plan", "approve_stage", "scaffold_plan"])
        .describe("Workflow action"),
      idea: tool.schema.string().optional().describe("Web app idea text (required for start)"),
      product_name: tool.schema.string().optional().describe("Optional product name"),
      approval_notes: tool.schema.string().optional().describe("Approval notes for approve_stage"),
      force_restart: tool.schema.boolean().optional().describe("Reset existing session workflow on start"),
    },
    execute: async (rawArgs: CjWebBuilderArgs, toolContext: CjToolContext): Promise<string> => {
      const directory = resolveDirectory(ctx, toolContext)
      const sessionID = toolContext.sessionID

      if (!sessionID || sessionID.trim().length === 0) {
        return "Missing session context: sessionID"
      }

      switch (rawArgs.action) {
        case "start": {
          return handleStart(rawArgs, sessionID, directory)
        }

        case "status": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderWorkflowStatus(state!)
        }

        case "next_role_tasks": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderCurrentStageRolePlan(state!)
        }

        case "scaffold_plan": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderCurrentScaffoldPlan(state!)
        }

        case "dispatch_plan": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText
          return renderDispatchPlan(state!)
        }

        case "approve_stage": {
          const { stateText, state } = requireState(sessionID, directory)
          if (stateText) return stateText

          const { updated, previousStage, nextStage } = approveCurrentStage({
            state: state!,
            notes: rawArgs.approval_notes,
          })

          saveCjWorkflowState(directory, updated)

          if (!nextStage) {
            return [
              `Stage approved: ${previousStage}`,
              "Workflow completed. All stage gates are approved.",
              "",
              renderWorkflowStatus(updated),
            ].join("\n")
          }

          return [
            `Stage approved: ${previousStage}`,
            `Activated next stage: ${nextStage}`,
            "",
            renderWorkflowStatus(updated),
          ].join("\n")
        }

        default:
          return `Unsupported action: ${String(rawArgs.action)}`
      }
    },
  })
}
