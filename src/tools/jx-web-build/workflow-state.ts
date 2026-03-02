import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { ensureDir, writeJsonAtomic } from "../../features/claude-tasks/storage"
import type { JxWorkflowStage } from "./stage-definitions"
import { JX_STAGE_ORDER, getNextJxStage } from "./stage-definitions"

const JxStageStateSchema = z.object({
  stage: z.enum(JX_STAGE_ORDER),
  status: z.enum(["locked", "active", "approved"]),
  approvedAt: z.string().optional(),
  approvalNotes: z.string().optional(),
})

const JxWorkflowStateSchema = z.object({
  sessionID: z.string(),
  productName: z.string(),
  idea: z.string(),
  constraints: z.object({
    framework: z.literal("nextjs"),
    uiLibrary: z.literal("shadcn"),
    styling: z.literal("tailwind"),
    focus: z.literal("web-responsive"),
  }),
  currentStage: z.enum(JX_STAGE_ORDER),
  stages: z.array(JxStageStateSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type JxStageState = z.infer<typeof JxStageStateSchema>
export type JxWorkflowState = z.infer<typeof JxWorkflowStateSchema>

export function getJxWorkflowDir(directory: string): string {
  return join(directory, ".opencode", "jx-web-build-workflows")
}

export function getJxWorkflowPath(directory: string, sessionID: string): string {
  return join(getJxWorkflowDir(directory), `${sessionID}.json`)
}

export function readJxWorkflowState(directory: string, sessionID: string): JxWorkflowState | null {
  const statePath = getJxWorkflowPath(directory, sessionID)
  if (!existsSync(statePath)) {
    return null
  }

  try {
    const raw = readFileSync(statePath, "utf-8")
    const parsed = JSON.parse(raw)
    const result = JxWorkflowStateSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createJxWorkflowState(input: {
  sessionID: string
  idea: string
  productName?: string
}): JxWorkflowState {
  const now = new Date().toISOString()
  const stages: JxStageState[] = JX_STAGE_ORDER.map((stage, index) => ({
    stage,
    status: index === 0 ? "active" : "locked",
  }))

  return {
    sessionID: input.sessionID,
    productName: input.productName?.trim() || "Untitled JX Web App",
    idea: input.idea.trim(),
    constraints: {
      framework: "nextjs",
      uiLibrary: "shadcn",
      styling: "tailwind",
      focus: "web-responsive",
    },
    currentStage: "ideation",
    stages,
    createdAt: now,
    updatedAt: now,
  }
}

export function saveJxWorkflowState(directory: string, state: JxWorkflowState): void {
  const workflowDir = getJxWorkflowDir(directory)
  ensureDir(workflowDir)
  writeJsonAtomic(getJxWorkflowPath(directory, state.sessionID), state)
}

export function approveJxStage(input: {
  state: JxWorkflowState
  notes?: string
}): {
  updated: JxWorkflowState
  previousStage: JxWorkflowStage
  nextStage: JxWorkflowStage | null
} {
  const now = new Date().toISOString()
  const previousStage = input.state.currentStage
  const nextStage = getNextJxStage(previousStage)

  const stages = input.state.stages.map((stageState) => {
    if (stageState.stage === previousStage) {
      return {
        ...stageState,
        status: "approved" as const,
        approvedAt: now,
        approvalNotes: input.notes,
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
      ...input.state,
      currentStage: nextStage ?? previousStage,
      stages,
      updatedAt: now,
    },
    previousStage,
    nextStage,
  }
}
