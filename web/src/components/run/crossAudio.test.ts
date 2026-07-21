import { describe, expect, it, vi } from "vitest"

import { createCrossAudio } from "@/components/run/crossAudio"

describe("createCrossAudio", () => {
  it("returns null when AudioContext is unavailable", () => {
    expect(
      createCrossAudio(
        undefined as unknown as typeof AudioContext,
      ),
    ).toBeNull()
  })

  it("creates jump and crossing tones without throwing", async () => {
    const start = vi.fn()
    const stop = vi.fn()
    const connect = vi.fn()
    const FakeOscillator = vi.fn(() => ({
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect,
      start,
      stop,
    }))
    const FakeGain = vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect,
    }))
    class FakeAudioContext {
      currentTime = 0
      state = "running"
      destination = {}
      createOscillator = FakeOscillator
      createGain = FakeGain
      resume = vi.fn().mockResolvedValue(undefined)
      close = vi.fn().mockResolvedValue(undefined)
    }

    const audio = createCrossAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).not.toBeNull()
    await audio?.resume()
    audio?.playJump()
    audio?.playCrossing()
    audio?.startBed()
    audio?.stop()
    expect(start).toHaveBeenCalled()
  })
})
