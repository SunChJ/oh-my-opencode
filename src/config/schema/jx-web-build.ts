import { z } from "zod"

export const JxWebBuildConfigSchema = z.object({
  /**
   * Optional starter template for JX scaffold bootstrap.
   * Supports git URLs or local project paths.
   */
  bootstrap_template: z.string().optional(),
})

export type JxWebBuildConfig = z.infer<typeof JxWebBuildConfigSchema>
