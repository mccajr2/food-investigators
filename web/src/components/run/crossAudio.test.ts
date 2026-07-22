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

  it("creates jump, ouch, and crossing tones without throwing", async () => {
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
    audio?.playOuch()
    audio?.playCrossing()
    audio?.playNewBest()
    audio?.startBed()
    audio?.stop()
    expect(start).toHaveBeenCalled()
  })

  it("exposes playOuch and playNewBest as distinct APIs", () => {
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

    const audio = createCrossAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).toMatchObject({
      playJump: expect.any(Function),
      playOuch: expect.any(Function),
      playCrossing: expect.any(Function),
      playNewBest: expect.any(Function),
    })
    expect(audio?.playOuch).not.toBe(audio?.playJump)
    expect(audio?.playOuch).not.toBe(audio?.playCrossing)
    expect(audio?.playNewBest).not.toBe(audio?.playCrossing)
  })
})
