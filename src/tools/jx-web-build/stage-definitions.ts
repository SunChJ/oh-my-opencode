export const JX_STAGE_ORDER = [
  "ideation",
  "product_spec",
  "experience_design",
  "technical_design",
  "implementation",
  "launch_readiness",
] as const

export type JxWorkflowStage = (typeof JX_STAGE_ORDER)[number]

export type JxRoleAssignment = {
  id: string
  title: string
  suggestedAgent: string
  objective: string
  deliverable: string
}

export type JxStageDefinition = {
  stage: JxWorkflowStage
  title: string
  goal: string
  gate: string
  roles: JxRoleAssignment[]
}

export const JX_STAGE_DEFINITIONS: Record<JxWorkflowStage, JxStageDefinition> = {
  ideation: {
    stage: "ideation",
    title: "Idea Clarification",
    goal: "Turn user intent into a clear product statement with user and scope boundaries.",
    gate: "Idea statement accepted by user.",
    roles: [
      {
        id: "problem-analyst",
        title: "Problem Analyst",
        suggestedAgent: "jx-problem-analyst",
        objective: "Clarify user, problem, and expected outcomes in plain language.",
        deliverable: "Idea brief with target user, primary scenario, and non-goals.",
      },
      {
        id: "reference-researcher",
        title: "Reference Researcher",
        suggestedAgent: "jx-reference-researcher",
        objective: "Collect relevant product patterns and implementation constraints.",
        deliverable: "Reference brief with examples and key risks.",
      },
    ],
  },
  product_spec: {
    stage: "product_spec",
    title: "Product Spec",
    goal: "Produce PRD-lite and acceptance criteria for MVP.",
    gate: "PRD-lite and acceptance criteria approved.",
    roles: [
      {
        id: "prd-owner",
        title: "PRD Owner",
        suggestedAgent: "jx-prd-owner",
        objective: "Create a concrete PRD-lite suitable for implementation.",
        deliverable: "PRD-lite with flows, requirements, and acceptance checklist.",
      },
    ],
  },
  experience_design: {
    stage: "experience_design",
    title: "Experience Design",
    goal: "Define IA, user flows, and UI composition for Web-first responsive experience.",
    gate: "Flow map and UI spec approved.",
    roles: [
      {
        id: "ux-designer",
        title: "UX Designer",
        suggestedAgent: "jx-ux-designer",
        objective: "Define route map, page hierarchy, and interaction flow.",
        deliverable: "UX flow spec and page-by-page requirements.",
      },
      {
        id: "ui-designer",
        title: "UI Designer",
        suggestedAgent: "jx-ui-designer",
        objective: "Define visual tokens and shadcn component mapping.",
        deliverable: "UI spec with states (empty/loading/error/success).",
      },
    ],
  },
  technical_design: {
    stage: "technical_design",
    title: "Technical Design",
    goal: "Translate approved design into executable Next.js architecture.",
    gate: "Technical plan and task breakdown approved.",
    roles: [
      {
        id: "solution-architect",
        title: "Solution Architect",
        suggestedAgent: "jx-solution-architect",
        objective: "Define app structure, modules, data contracts, and implementation sequence.",
        deliverable: "Technical design doc and task graph for implementation.",
      },
    ],
  },
  implementation: {
    stage: "implementation",
    title: "Implementation",
    goal: "Implement MVP using Next.js + shadcn in incremental milestones.",
    gate: "Core features complete and checks pass.",
    roles: [
      {
        id: "delivery-engineer",
        title: "Delivery Engineer",
        suggestedAgent: "jx-delivery-engineer",
        objective: "Build feature slices and keep project shippable.",
        deliverable: "Running app with lint/typecheck/build passing.",
      },
    ],
  },
  launch_readiness: {
    stage: "launch_readiness",
    title: "Launch Readiness",
    goal: "Run QA, polish UX details, and prepare release handoff.",
    gate: "QA report and launch checklist approved.",
    roles: [
      {
        id: "qa-lead",
        title: "QA Lead",
        suggestedAgent: "jx-qa-lead",
        objective: "Verify behavior and edge cases against acceptance criteria.",
        deliverable: "QA report with pass/fail and residual risk list.",
      },
      {
        id: "ux-polish-lead",
        title: "UX Polish Lead",
        suggestedAgent: "jx-ux-polish-lead",
        objective: "Ensure consistency of visual and interaction quality.",
        deliverable: "Polish checklist and final improvement notes.",
      },
    ],
  },
}

export function getNextJxStage(stage: JxWorkflowStage): JxWorkflowStage | null {
  const index = JX_STAGE_ORDER.indexOf(stage)
  if (index < 0 || index >= JX_STAGE_ORDER.length - 1) {
    return null
  }

  return JX_STAGE_ORDER[index + 1]
}
