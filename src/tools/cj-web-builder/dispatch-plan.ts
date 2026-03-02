import type { CjWorkflowState } from "./workflow-state"
import type { CjWorkflowStage, RoleAssignment } from "./stage-definitions"
import { STAGE_DEFINITIONS } from "./stage-definitions"

type DispatchMode = "sequential" | "parallel"

type DispatchItem = {
  role: RoleAssignment
  mode: DispatchMode
  note: string
}

function createDispatchItems(stage: CjWorkflowStage, roles: RoleAssignment[]): DispatchItem[] {
  if (roles.length <= 1) {
    return roles.map((role) => ({
      role,
      mode: "sequential",
      note: "Single-role stage",
    }))
  }

  if (stage === "discovery") {
    return roles.map((role) => ({
      role,
      mode: "parallel",
      note: "Run in parallel, then merge findings into one PRD-lite.",
    }))
  }

  if (stage === "ux_ui" || stage === "qa") {
    return roles.map((role, index) => ({
      role,
      mode: "sequential",
      note: index === 0
        ? "Execute first and produce baseline artifact."
        : "Start after previous role deliverable is accepted.",
    }))
  }

  return roles.map((role) => ({
    role,
    mode: "sequential",
    note: "Default sequential execution.",
  }))
}

function buildTaskCallTemplate(input: {
  item: DispatchItem
  idea: string
  stage: CjWorkflowStage
}): string {
  const { item, idea, stage } = input
  const runInBackground = item.mode === "parallel"
  const prompt = [
    `Project idea: ${idea}`,
    `Current stage: ${stage}`,
    `Role: ${item.role.title}`,
    `Objective: ${item.role.objective}`,
    `Deliverable: ${item.role.deliverable}`,
    item.note,
  ].join("\\n")

  return [
    "task(",
    `  subagent_type=\"${item.role.suggestedAgent}\",`,
    "  load_skills=[],",
    `  description=\"${stage}: ${item.role.title}\",`,
    `  prompt=\"${prompt.replace(/\"/g, '\\\"')}\",`,
    `  run_in_background=${runInBackground ? "true" : "false"}`,
    ")",
  ].join("\n")
}

export function renderDispatchPlan(state: CjWorkflowState): string {
  const definition = STAGE_DEFINITIONS[state.currentStage]
  const items = createDispatchItems(state.currentStage, definition.roles)

  const modeSummary = items.every((item) => item.mode === "parallel")
    ? "parallel"
    : items.some((item) => item.mode === "parallel")
      ? "mixed"
      : "sequential"

  const sections = items
    .map((item, index) => {
      const taskTemplate = buildTaskCallTemplate({
        item,
        idea: state.idea,
        stage: state.currentStage,
      })

      return [
        `${index + 1}. ${item.role.title} (${item.mode})`,
        `- Agent: ${item.role.suggestedAgent}`,
        `- Objective: ${item.role.objective}`,
        `- Note: ${item.note}`,
        "- Execute:",
        "```txt",
        taskTemplate,
        "```",
      ].join("\n")
    })
    .join("\n\n")

  return [
    `# CJ Dispatch Plan: ${definition.title}`,
    "",
    `Stage: ${state.currentStage}`,
    `Dispatch mode: ${modeSummary}`,
    "",
    "## Execution Order",
    sections,
    "",
    "## Gate Rule",
    "Do not approve this stage until all listed deliverables are reviewed.",
  ].join("\n")
}
