/**
 * Tiny Web Audio helpers for Match — no asset files, no new deps.
 * Soft volumes; callers start the context on a user gesture (first flip).
 */

type MatchAudio = {
  resume: () => Promise<void>
  playFlip: () => void
  playMatch: () => void
  playCheer: () => void
  /** Longer / brighter cheer when the round sets a new personal best. */
  playNewBest: () => void
  stop: () => void
}

function tone(
  ctx: AudioContext,
  {
    frequency,
    duration,
    type = "sine",
    gain = 0.08,
    when = 0,
  }: {
    frequency: number
    duration: number
    type?: OscillatorType
    gain?: number
    when?: number
  },
) {
  const start = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function createMatchAudio(
  AudioContextCtor: typeof AudioContext = globalThis.AudioContext,
): MatchAudio | null {
  if (typeof AudioContextCtor !== "function") {
    return null
  }

  let ctx: AudioContext | null = null

  function ensure(): AudioContext | null {
    if (!ctx) {
      try {
        ctx = new AudioContextCtor()
      } catch {
        return null
      }
    }
    return ctx
  }

  return {
    async resume() {
      const audio = ensure()
      if (audio?.state === "suspended") {
        await audio.resume()
      }
    },
    playFlip() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Soft tick — card turn without shouting.
      tone(audio, { frequency: 640, duration: 0.05, type: "triangle", gain: 0.04 })
    },
    playMatch() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Two-note “got it” — distinct from flip and end cheer.
      tone(audio, { frequency: 523.25, duration: 0.08, type: "sine", gain: 0.06 })
      tone(audio, {
        frequency: 783.99,
        duration: 0.12,
        type: "triangle",
        gain: 0.055,
        when: 0.06,
      })
    },
    playCheer() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Same family as Catch/Cross end cheer, different intervals.
      tone(audio, { frequency: 440.0, duration: 0.1, type: "sine", gain: 0.07 })
      tone(audio, {
        frequency: 554.37,
        duration: 0.1,
        type: "sine",
        gain: 0.07,
        when: 0.08,
      })
      tone(audio, {
        frequency: 659.25,
        duration: 0.12,
        type: "triangle",
        gain: 0.065,
        when: 0.16,
      })
      tone(audio, {
        frequency: 880.0,
        duration: 0.16,
        type: "sine",
        gain: 0.055,
        when: 0.28,
      })
    },
    playNewBest() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Longer fanfare than playCheer — clear “personal best” moment.
      tone(audio, { frequency: 440.0, duration: 0.1, type: "triangle", gain: 0.07 })
      tone(audio, {
        frequency: 554.37,
        duration: 0.1,
        type: "sine",
        gain: 0.075,
        when: 0.08,
      })
      tone(audio, {
        frequency: 659.25,
        duration: 0.11,
        type: "sine",
        gain: 0.075,
        when: 0.16,
      })
      tone(audio, {
        frequency: 830.61,
        duration: 0.12,
        type: "triangle",
        gain: 0.065,
        when: 0.28,
      })
      tone(audio, {
        frequency: 1046.5,
        duration: 0.18,
        type: "sine",
        gain: 0.05,
        when: 0.42,
      })
      tone(audio, {
        frequency: 1318.5,
        duration: 0.16,
        type: "triangle",
        gain: 0.04,
        when: 0.58,
      })
    },
    stop() {
      if (ctx) {
        void ctx.close()
        ctx = null
      }
    },
  }
}
