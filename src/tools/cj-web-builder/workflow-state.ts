import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { ensureDir, writeJsonAtomic } from "../../features/claude-tasks/storage"
import type { CjWorkflowStage } from "./stage-definitions"
import { STAGE_ORDER, getNextStage } from "./stage-definitions"

const StageStateSchema = z.object({
  stage: z.enum(STAGE_ORDER),
  status: z.enum(["locked", "active", "approved"]),
  approvedAt: z.string().optional(),
  approvalNotes: z.string().optional(),
})

const CjWorkflowStateSchema = z.object({
  sessionID: z.string(),
  productName: z.string(),
  idea: z.string(),
  stack: z.object({
    framework: z.literal("nextjs"),
    ui: z.literal("shadcn"),
    styling: z.literal("tailwind"),
  }),
  currentStage: z.enum(STAGE_ORDER),
  stages: z.array(StageStateSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type StageState = z.infer<typeof StageStateSchema>
export type CjWorkflowState = z.infer<typeof CjWorkflowStateSchema>

export function getCjWorkflowDir(directory: string): string {
  return join(directory, ".opencode", "cj-workflows")
}

export function getCjWorkflowPath(directory: string, sessionID: string): string {
  return join(getCjWorkflowDir(directory), `${sessionID}.json`)
}

export function readCjWorkflowState(
  directory: string,
  sessionID: string,
): CjWorkflowState | null {
  const statePath = getCjWorkflowPath(directory, sessionID)
  if (!existsSync(statePath)) {
    return null
  }

  try {
    const content = readFileSync(statePath, "utf-8")
    const parsed = JSON.parse(content)
    const result = CjWorkflowStateSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createCjWorkflowState(input: {
  sessionID: string
  idea: string
  productName?: string
}): CjWorkflowState {
  const now = new Date().toISOString()

  const stages: StageState[] = STAGE_ORDER.map((stage, index) => ({
    stage,
    status: index === 0 ? "active" : "locked",
  }))

  return {
    sessionID: input.sessionID,
    productName: input.productName?.trim() || "Untitled Web App",
    idea: input.idea.trim(),
    stack: {
      framework: "nextjs",
      ui: "shadcn",
      styling: "tailwind",
    },
    currentStage: "discovery",
    stages,
    createdAt: now,
    updatedAt: now,
  }
}

export function saveCjWorkflowState(directory: string, state: CjWorkflowState): void {
  const workflowDir = getCjWorkflowDir(directory)
  ensureDir(workflowDir)
  const statePath = getCjWorkflowPath(directory, state.sessionID)
  writeJsonAtomic(statePath, state)
}

export function approveCurrentStage(input: {
  state: CjWorkflowState
  notes?: string
}): { updated: CjWorkflowState; previousStage: CjWorkflowStage; nextStage: CjWorkflowStage | null } {
  const { state, notes } = input
  const now = new Date().toISOString()
  const previousStage = state.currentStage
  const nextStage = getNextStage(previousStage)

  const updatedStages = state.stages.map((stageState) => {
    if (stageState.stage === previousStage) {
      return {
        ...stageState,
        status: "approved" as const,
        approvedAt: now,
        approvalNotes: notes,
      }
    }

    if (nextStage && stageState.stage === nextStage && stageState.status === "locked") {
      return {
        ...stageState,
        status: "active" as const,
      }
    }

    return stageState
  })

  return {
    updated: {
      ...state,
      currentStage: nextStage ?? previousStage,
      stages: updatedStages,
      updatedAt: now,
    },
    previousStage,
    nextStage,
  }
}
