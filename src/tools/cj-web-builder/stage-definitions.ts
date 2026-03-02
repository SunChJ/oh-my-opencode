export const STAGE_ORDER = [
  "discovery",
  "ux_ui",
  "architecture",
  "implementation",
  "qa",
] as const

export type CjWorkflowStage = (typeof STAGE_ORDER)[number]

export type RoleAssignment = {
  id: string
  title: string
  suggestedAgent: string
  objective: string
  deliverable: string
}

export type StageDefinition = {
  stage: CjWorkflowStage
  title: string
  goal: string
  gate: string
  roles: RoleAssignment[]
}

export const STAGE_DEFINITIONS: Record<CjWorkflowStage, StageDefinition> = {
  discovery: {
    stage: "discovery",
    title: "Discovery",
    goal: "Expand idea into PRD-lite with clear scope and acceptance criteria.",
    gate: "PRD-lite reviewed and approved.",
    roles: [
      {
        id: "requirements_owner",
        title: "Requirements Owner",
        suggestedAgent: "oracle",
        objective: "Clarify target users, problems, and success metrics.",
        deliverable: "PRD-lite (problem, users, scope, non-goals, acceptance criteria).",
      },
      {
        id: "research_owner",
        title: "Research Owner",
        suggestedAgent: "librarian",
        objective: "Collect references and similar product patterns.",
        deliverable: "Reference brief with reusable patterns and risks.",
      },
    ],
  },
  ux_ui: {
    stage: "ux_ui",
    title: "UX & UI",
    goal: "Design information architecture and UI spec for core flows.",
    gate: "Page map and UI component spec approved.",
    roles: [
      {
        id: "ux_owner",
        title: "UX Owner",
        suggestedAgent: "metis",
        objective: "Define user flow, page map, states, and edge cases.",
        deliverable: "UX flow spec with page-level requirements.",
      },
      {
        id: "ui_owner",
        title: "UI Owner",
        suggestedAgent: "momus",
        objective: "Define visual system and shadcn component mapping.",
        deliverable: "UI spec (tokens, components, interaction states, accessibility notes).",
      },
    ],
  },
  architecture: {
    stage: "architecture",
    title: "Architecture",
    goal: "Convert approved UX/UI into executable Next.js architecture.",
    gate: "Technical design and implementation task breakdown approved.",
    roles: [
      {
        id: "architecture_owner",
        title: "Architecture Owner",
        suggestedAgent: "hephaestus",
        objective: "Design app structure, routes, data contracts, and module boundaries.",
        deliverable: "Technical design doc and implementation sequence.",
      },
    ],
  },
  implementation: {
    stage: "implementation",
    title: "Implementation",
    goal: "Build the app incrementally using stage-approved requirements.",
    gate: "Core features implemented and checks passing.",
    roles: [
      {
        id: "build_owner",
        title: "Build Owner",
        suggestedAgent: "sisyphus",
        objective: "Implement features task-by-task in Next.js + shadcn.",
        deliverable: "Working app increments with test/lint/build passing.",
      },
    ],
  },
  qa: {
    stage: "qa",
    title: "QA & Handoff",
    goal: "Verify quality, stabilize edge cases, and prepare user handoff.",
    gate: "QA checklist completed and release notes prepared.",
    roles: [
      {
        id: "qa_owner",
        title: "QA Owner",
        suggestedAgent: "explore",
        objective: "Run regressions, check UX consistency, and document known limits.",
        deliverable: "QA report and release checklist.",
      },
      {
        id: "review_owner",
        title: "Review Owner",
        suggestedAgent: "momus",
        objective: "Polish interaction details and visual coherence.",
        deliverable: "Final UI polish checklist.",
      },
    ],
  },
}

export function getNextStage(stage: CjWorkflowStage): CjWorkflowStage | null {
  const currentIndex = STAGE_ORDER.indexOf(stage)
  if (currentIndex < 0 || currentIndex >= STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[currentIndex + 1]
}
