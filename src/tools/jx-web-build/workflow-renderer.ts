import { JX_STAGE_DEFINITIONS, JX_STAGE_ORDER, type JxRoleAssignment } from "./stage-definitions"
import type { JxWorkflowState } from "./workflow-state"
import { renderJxDispatchPlan } from "./dispatch-plan"

function renderStageLine(state: JxWorkflowState, stage: (typeof JX_STAGE_ORDER)[number]): string {
  const stageState = state.stages.find((item) => item.stage === stage)
  const status = stageState?.status ?? "locked"
  const marker = status === "approved" ? "[x]" : status === "active" ? "[>]" : "[ ]"
  return `${marker} ${stage} (${status})`
}

function buildRoleTaskTemplate(input: {
  stage: string
  role: JxRoleAssignment
  idea: string
}): string {
  const prompt = [
    `Project idea: ${input.idea}`,
    `Current stage: ${input.stage}`,
    `Role: ${input.role.title}`,
    `Objective: ${input.role.objective}`,
    `Required deliverable: ${input.role.deliverable}`,
    "Keep response structured and implementation-ready.",
  ].join("\\n")

  return [
    "task(",
    `  subagent_type=\"${input.role.suggestedAgent}\",`,
    "  load_skills=[],",
    `  description=\"${input.stage}: ${input.role.title}\",`,
    `  prompt=\"${prompt.replace(/\"/g, '\\\"')}\",`,
    "  run_in_background=false",
    ")",
  ].join("\n")
}

export function renderJxWorkflowStatus(state: JxWorkflowState): string {
  const lines = JX_STAGE_ORDER.map((stage) => renderStageLine(state, stage))

  return [
    "# JX Web Build Status",
    "",
    `Product: ${state.productName}`,
    `Current stage: ${state.currentStage}`,
    `Constraints: ${state.constraints.framework} + ${state.constraints.uiLibrary} + ${state.constraints.styling} (${state.constraints.focus})`,
    "",
    "## Stage Progress",
    ...lines,
    "",
    "## Next Actions",
    "- `jx_web_build(action=\"role_plan\")` for role-by-role tasks.",
    "- `jx_web_build(action=\"dispatch_plan\")` for execution order.",
    "- `jx_web_build(action=\"approve\", approval_notes=\"...\")` when gate passes.",
  ].join("\n")
}

export function renderJxRolePlan(state: JxWorkflowState): string {
  const definition = JX_STAGE_DEFINITIONS[state.currentStage]
  const roleSections = definition.roles.map((role, index) => {
    const template = buildRoleTaskTemplate({
      stage: state.currentStage,
      role,
      idea: state.idea,
    })

    return [
      `${index + 1}. ${role.title}`,
      `- Suggested agent: ${role.suggestedAgent}`,
      `- Objective: ${role.objective}`,
      `- Deliverable: ${role.deliverable}`,
      "- Execute:",
      "```txt",
      template,
      "```",
    ].join("\n")
  }).join("\n\n")

  return [
    `# JX Role Plan: ${definition.title}`,
    "",
    `Goal: ${definition.goal}`,
    `Gate: ${definition.gate}`,
    "",
    "## Role Breakdown",
    roleSections,
  ].join("\n")
}

export function renderJxScaffoldPlan(state: JxWorkflowState): string {
  const slug = state.productName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const projectDir = slug.length > 0 ? slug : "jx-web-app"

  return [
    "# JX Scaffold Plan",
    "",
    "## Commands",
    "```bash",
    `npx create-next-app@latest ${projectDir} --ts --eslint --tailwind --app --src-dir --import-alias \"@/*\" --use-npm`,
    `cd ${projectDir}`,
    "npx shadcn@latest init -d",
    "npx shadcn@latest add button card input form dialog drawer dropdown-menu tabs toast table badge skeleton",
    "npm run lint",
    "npm run build",
    "```",
    "",
    "## Baseline Structure",
    "- src/app/(marketing)/page.tsx",
    "- src/app/(app)/dashboard/page.tsx",
    "- src/app/api/health/route.ts",
    "- src/components/ui/*",
    "- src/components/blocks/*",
    "- src/lib/schemas/*",
    "- src/lib/actions/*",
    "",
    "## Build Notes",
    `- Idea: ${state.idea}`,
    "- Build highest-value 3 user flows first.",
    "- Include loading/empty/error states per flow.",
  ].join("\n")
}

export function renderJxImplementationBacklog(state: JxWorkflowState): string {
  if (state.currentStage !== "implementation") {
    return [
      "Backlog is available in implementation stage only.",
      `Current stage: ${state.currentStage}`,
    ].join("\n")
  }

  return [
    "# JX Implementation Backlog",
    "",
    "1. Scaffold app shell and route groups.",
    "2. Implement primary user flow end-to-end.",
    "3. Implement secondary flow and shared components.",
    "4. Add validation, error states, and empty states.",
    "5. Run lint/typecheck/build and fix blockers.",
    "6. Prepare QA checklist and release notes.",
  ].join("\n")
}

export { renderJxDispatchPlan }
