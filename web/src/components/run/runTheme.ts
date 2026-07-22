/** Scoped theme hook on the full-screen run ritual root. */
export const RUN_THEME = "kitchen-run" as const

/**
 * Shared Catch / Cross type hierarchy — keep HUD + finish screens in lockstep.
 */
export const RUN_GAME_TITLE = "run-prompt text-xl md:text-2xl"
export const RUN_GAME_THEME = "truncate text-sm text-muted-foreground"
export const RUN_GAME_HUD =
  "run-prompt flex items-center gap-4 text-base font-medium md:text-lg"
export const RUN_GAME_FINISH_TITLE =
  "run-prompt text-3xl leading-tight md:text-4xl"
export const RUN_GAME_FINISH_SUB = "text-lg text-muted-foreground"
/** Display type for in-play celebrate banner (Cross “Crossed!”). */
export const RUN_GAME_CELEBRATE = "run-prompt text-2xl md:text-3xl"
