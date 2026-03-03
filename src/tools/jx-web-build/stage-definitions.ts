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
  recommendedSkills: string[]
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
        recommendedSkills: ["prd"],
      },
      {
        id: "reference-researcher",
        title: "Reference Researcher",
        suggestedAgent: "jx-reference-researcher",
        objective: "Collect relevant product patterns and implementation constraints.",
        deliverable: "Reference brief with examples and key risks.",
        recommendedSkills: ["nextjs-app-router-patterns", "shadcn-ui"],
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
        recommendedSkills: ["prd"],
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
        id: "experience-designer",
        title: "Experience Designer",
        suggestedAgent: "jx-ui-designer",
        objective: "Unify route flow, interaction states, and component composition.",
        deliverable: "Single experience spec: flow map + UI system + state coverage.",
        recommendedSkills: ["shadcn-ui", "tailwind-design-system", "accessibility-compliance"],
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
        recommendedSkills: ["nextjs-app-router-patterns", "tailwind-design-system"],
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
        recommendedSkills: ["nextjs-app-router-patterns", "shadcn-ui"],
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
        id: "qa-polish-lead",
        title: "QA & Polish Lead",
        suggestedAgent: "jx-qa-lead",
        objective: "Run acceptance QA and final UX consistency polish in one pass.",
        deliverable: "Go/no-go report + prioritized polish checklist.",
        recommendedSkills: ["webapp-testing", "accessibility-compliance", "code-review-excellence"],
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
