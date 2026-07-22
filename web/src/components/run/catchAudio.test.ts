import { describe, expect, it, vi } from "vitest"

import { createCatchAudio } from "@/components/run/catchAudio"

describe("createCatchAudio", () => {
  it("returns null when AudioContext is unavailable", () => {
    expect(
      createCatchAudio(
        undefined as unknown as typeof AudioContext,
      ),
    ).toBeNull()
  })

  it("creates catch blip, cheer, and bed tones without throwing", async () => {
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

    const audio = createCatchAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).not.toBeNull()
    await audio?.resume()
    audio?.playCatch()
    audio?.playCheer()
    audio?.startBed()
    audio?.stop()
    expect(start).toHaveBeenCalled()
  })

  it("exposes catch and cheer as distinct APIs", () => {
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

    const audio = createCatchAudio(
      FakeAudioContext as unknown as typeof AudioContext,
    )
    expect(audio).toMatchObject({
      playCatch: expect.any(Function),
      playCheer: expect.any(Function),
      startBed: expect.any(Function),
    })
    expect(audio?.playCatch).not.toBe(audio?.playCheer)
  })
})
