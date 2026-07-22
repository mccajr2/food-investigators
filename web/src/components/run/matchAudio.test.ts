import { describe, expect, it, vi } from "vitest"

import { createMatchAudio } from "@/components/run/matchAudio"

describe("createMatchAudio", () => {
  it("returns null when AudioContext is unavailable", () => {
    expect(
      createMatchAudio(
        undefined as unknown as typeof AudioContext,
      ),
    ).toBeNull()
  })

  it("creates flip, match, cheer, and new-best tones without throwing", async () => {
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

    const audio = createMatchAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).not.toBeNull()
    await audio?.resume()
    audio?.playFlip()
    audio?.playMatch()
    audio?.playCheer()
    audio?.playNewBest()
    audio?.stop()
    expect(start).toHaveBeenCalled()
  })

  it("exposes flip, match, cheer, and new-best as distinct APIs", () => {
    class FakeAudioContext {
      currentTime = 0
      state = "running"
      destination = {}
      createOscillator = vi.fn(() => ({
        type: "sine",
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }))
      createGain = vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }))
      resume = vi.fn().mockResolvedValue(undefined)
      close = vi.fn().mockResolvedValue(undefined)
    }

    const audio = createMatchAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).toMatchObject({
      playFlip: expect.any(Function),
      playMatch: expect.any(Function),
      playCheer: expect.any(Function),
      playNewBest: expect.any(Function),
    })
    expect(audio?.playFlip).not.toBe(audio?.playMatch)
    expect(audio?.playNewBest).not.toBe(audio?.playCheer)
  })
})
