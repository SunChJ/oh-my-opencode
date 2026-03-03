import type { JxWorkflowState } from "./workflow-state"
import type { JxRoleAssignment, JxWorkflowStage } from "./stage-definitions"
import { JX_STAGE_DEFINITIONS } from "./stage-definitions"

type DispatchMode = "sequential" | "parallel"

type DispatchStep = {
  role: JxRoleAssignment
  mode: DispatchMode
  note: string
}

function formatLoadSkills(skills: string[]): string {
  if (skills.length === 0) {
    return "  load_skills=[],"
  }
  return `  load_skills=[${skills.map((skill) => `"${skill}"`).join(", ")}],`
}

function buildDispatchSteps(stage: JxWorkflowStage, roles: JxRoleAssignment[]): DispatchStep[] {
  if (roles.length <= 1) {
    return roles.map((role) => ({ role, mode: "sequential", note: "Single-role stage." }))
  }

  if (stage === "ideation") {
    return roles.map((role) => ({
      role,
      mode: "parallel",
      note: "Run in parallel and merge outputs before gate approval.",
    }))
  }

  if (stage === "experience_design" || stage === "launch_readiness") {
    return roles.map((role, index) => ({
      role,
      mode: "sequential",
      note: index === 0
        ? "Execute first and produce base deliverable."
        : "Run after previous deliverable is accepted.",
    }))
  }

  return roles.map((role) => ({
    role,
    mode: "sequential",
    note: "Execute in sequence.",
  }))
}

function buildTaskTemplate(input: {
  stage: JxWorkflowStage
  idea: string
  step: DispatchStep
}): string {
  const { stage, idea, step } = input
  const prompt = [
    `Project idea: ${idea}`,
    `Current stage: ${stage}`,
    `Role: ${step.role.title}`,
    `Objective: ${step.role.objective}`,
    `Deliverable: ${step.role.deliverable}`,
    `Execution note: ${step.note}`,
  ].join("\\n")

  return [
    "task(",
    `  subagent_type=\"${step.role.suggestedAgent}\",`,
    formatLoadSkills(step.role.recommendedSkills),
    `  description=\"${stage}: ${step.role.title}\",`,
    `  prompt=\"${prompt.replace(/\"/g, '\\\"')}\",`,
    `  run_in_background=${step.mode === "parallel" ? "true" : "false"}`,
    ")",
  ].join("\n")
}

export function renderJxDispatchPlan(state: JxWorkflowState): string {
  const definition = JX_STAGE_DEFINITIONS[state.currentStage]
  const steps = buildDispatchSteps(state.currentStage, definition.roles)
  const summary = steps.every((step) => step.mode === "parallel")
    ? "parallel"
    : steps.some((step) => step.mode === "parallel")
      ? "mixed"
      : "sequential"

  const sections = steps.map((step, index) => {
    const taskTemplate = buildTaskTemplate({
      stage: state.currentStage,
      idea: state.idea,
      step,
    })

    return [
      `${index + 1}. ${step.role.title} (${step.mode})`,
      `- Agent: ${step.role.suggestedAgent}`,
      `- Skills: ${step.role.recommendedSkills.join(", ")}`,
      `- Objective: ${step.role.objective}`,
      `- Deliverable: ${step.role.deliverable}`,
      `- Note: ${step.note}`,
      "- Execute:",
      "```txt",
      taskTemplate,
      "```",
    ].join("\n")
  }).join("\n\n")

  return [
    `# JX Dispatch Plan: ${definition.title}`,
    "",
    `Stage: ${state.currentStage}`,
    `Dispatch mode: ${summary}`,
    "",
    "## Execution Steps",
    sections,
    "",
    "## Gate Rule",
    "Do not approve current stage until all required deliverables are reviewed.",
  ].join("\n")
}
