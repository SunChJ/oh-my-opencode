import type { CjWorkflowState } from "./workflow-state"
import type { CjWorkflowStage, RoleAssignment } from "./stage-definitions"
import { STAGE_DEFINITIONS, STAGE_ORDER } from "./stage-definitions"
export { renderDispatchPlan } from "./dispatch-plan"

function renderStageLine(state: CjWorkflowState, stage: CjWorkflowStage): string {
  const stageState = state.stages.find((item) => item.stage === stage)
  const status = stageState?.status ?? "locked"
  const marker = status === "approved" ? "[x]" : status === "active" ? "[>]" : "[ ]"
  return `${marker} ${stage} (${status})`
}

function createTaskTemplate(input: {
  role: RoleAssignment
  stage: CjWorkflowStage
  idea: string
}): string {
  const { role, stage, idea } = input
  const description = `${stage}: ${role.title}`
  const prompt = [
    `Project idea: ${idea}`,
    `Current stage: ${stage}`,
    `Your role: ${role.title}`,
    `Objective: ${role.objective}`,
    `Required deliverable: ${role.deliverable}`,
    "Keep output concise, structured, and implementation-ready.",
  ].join("\\n")

  return [
    "task(",
    `  subagent_type=\"${role.suggestedAgent}\",`,
    "  load_skills=[],",
    `  description=\"${description}\",`,
    `  prompt=\"${prompt.replace(/\"/g, '\\\"')}\",`,
    "  run_in_background=false",
    ")",
  ].join("\n")
}

function renderRolePlan(state: CjWorkflowState): string {
  const definition = STAGE_DEFINITIONS[state.currentStage]

  const roleSections = definition.roles
    .map((role, index) => {
      const template = createTaskTemplate({
        role,
        stage: state.currentStage,
        idea: state.idea,
      })

      return [
        `${index + 1}. ${role.title}`,
        `- Suggested agent: ${role.suggestedAgent}`,
        `- Objective: ${role.objective}`,
        `- Deliverable: ${role.deliverable}`,
        "- Task template:",
        "```txt",
        template,
        "```",
      ].join("\n")
    })
    .join("\n\n")

  return [
    `# CJ Stage Plan: ${definition.title}`,
    "",
    `Goal: ${definition.goal}`,
    `Gate: ${definition.gate}`,
    "",
    "## Role Breakdown",
    roleSections,
    "",
    "After deliverables are reviewed, approve stage using:",
    "`cj_web_builder(action=\"approve_stage\", approval_notes=\"approved by user\")`",
  ].join("\n")
}

function renderScaffoldPlan(state: CjWorkflowState): string {
  const slug = state.productName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const projectDir = slug.length > 0 ? slug : "my-web-app"

  return [
    "# Next.js + shadcn Scaffold Plan",
    "",
    "## Commands",
    "```bash",
    `npx create-next-app@latest ${projectDir} --ts --eslint --tailwind --app --src-dir --import-alias \"@/*\" --use-npm`,
    `cd ${projectDir}`,
    "npx shadcn@latest init -d",
    "npx shadcn@latest add button card input form dialog dropdown-menu tabs toast",
    "npm run lint",
    "npm run build",
    "```",
    "",
    "## Baseline App Structure",
    "- app/(marketing)/page.tsx",
    "- app/(app)/dashboard/page.tsx",
    "- app/api/health/route.ts",
    "- components/ui/* (shadcn)",
    "- components/sections/*",
    "- lib/actions/*",
    "- lib/schemas/*",
    "",
    "## First Build Sprint",
    `- Idea summary: ${state.idea}`,
    "- Build top 3 user flows from approved UX spec.",
    "- Each flow should include loading/empty/error states.",
    "- Keep implementation aligned with approved stage docs.",
  ].join("\n")
}

export function renderWorkflowStatus(state: CjWorkflowState): string {
  const lines = STAGE_ORDER.map((stage) => renderStageLine(state, stage))

  return [
    "# CJ Workflow Status",
    "",
    `Product: ${state.productName}`,
    `Current stage: ${state.currentStage}`,
    `Stack: ${state.stack.framework} + ${state.stack.ui} + ${state.stack.styling}`,
    "",
    "## Stage Progress",
    ...lines,
    "",
    "## Next Actions",
    "- Use `cj_web_builder(action=\"next_role_tasks\")` to get role tasks for current stage.",
    "- Approve gate with `cj_web_builder(action=\"approve_stage\", approval_notes=\"...\")`.",
  ].join("\n")
}

export function renderCurrentStageRolePlan(state: CjWorkflowState): string {
  return renderRolePlan(state)
}

export function renderCurrentScaffoldPlan(state: CjWorkflowState): string {
  return renderScaffoldPlan(state)
}
