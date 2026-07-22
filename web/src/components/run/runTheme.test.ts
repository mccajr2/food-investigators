import { describe, expect, it } from "vitest"

import {
  RUN_GAME_CELEBRATE,
  RUN_GAME_FINISH_SUB,
  RUN_GAME_FINISH_TITLE,
  RUN_GAME_HUD,
  RUN_GAME_THEME,
  RUN_GAME_TITLE,
} from "@/components/run/runTheme"

describe("run game typography tokens", () => {
  it("keeps Catch/Cross HUD and finish titles on the run-prompt family", () => {
    expect(RUN_GAME_TITLE).toContain("run-prompt")
    expect(RUN_GAME_HUD).toContain("run-prompt")
    expect(RUN_GAME_FINISH_TITLE).toContain("run-prompt")
    expect(RUN_GAME_FINISH_TITLE).toContain("leading-tight")
    expect(RUN_GAME_CELEBRATE).toContain("run-prompt")
    expect(RUN_GAME_THEME).toContain("text-muted-foreground")
    expect(RUN_GAME_FINISH_SUB).toContain("text-muted-foreground")
  })
})
