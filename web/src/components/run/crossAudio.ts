/**
 * Tiny Web Audio helpers for Cross — no asset files, no new deps.
 * Soft volumes; callers start the context on a user gesture (first move).
 */

type CrossAudio = {
  resume: () => Promise<void>
  playJump: () => void
  /** Short descending “ouch” when bumped by a hazard. */
  playOuch: () => void
  /** Clearer rising cheer when the player reaches the goal. */
  playCrossing: () => void
  /** Longer / brighter cheer when the round sets a new personal best. */
  playNewBest: () => void
  startBed: () => void
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

export function createCrossAudio(
  AudioContextCtor: typeof AudioContext = globalThis.AudioContext,
): CrossAudio | null {
  if (typeof AudioContextCtor !== "function") {
    return null
  }

  let ctx: AudioContext | null = null
  let bedTimer: number | null = null
  let bedStep = 0

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
    playJump() {
      const audio = ensure()
      if (!audio) {
        return
      }
      tone(audio, { frequency: 520, duration: 0.07, type: "triangle", gain: 0.06 })
      tone(audio, {
        frequency: 680,
        duration: 0.06,
        type: "triangle",
        gain: 0.04,
        when: 0.04,
      })
    },
    playOuch() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Descending / slightly rough — distinct from jump and cheer.
      tone(audio, { frequency: 220, duration: 0.12, type: "sawtooth", gain: 0.05 })
      tone(audio, {
        frequency: 165,
        duration: 0.14,
        type: "triangle",
        gain: 0.045,
        when: 0.07,
      })
      tone(audio, {
        frequency: 110,
        duration: 0.16,
        type: "sine",
        gain: 0.04,
        when: 0.14,
      })
    },
    playCrossing() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Brighter cheer than the old 3-note chime — obvious “you made it”.
      tone(audio, { frequency: 523.25, duration: 0.1, type: "sine", gain: 0.08 })
      tone(audio, {
        frequency: 659.25,
        duration: 0.1,
        type: "sine",
        gain: 0.08,
        when: 0.07,
      })
      tone(audio, {
        frequency: 783.99,
        duration: 0.12,
        type: "triangle",
        gain: 0.075,
        when: 0.14,
      })
      tone(audio, {
        frequency: 1046.5,
        duration: 0.18,
        type: "sine",
        gain: 0.07,
        when: 0.24,
      })
      tone(audio, {
        frequency: 1318.5,
        duration: 0.12,
        type: "triangle",
        gain: 0.045,
        when: 0.34,
      })
    },
    playNewBest() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Longer fanfare than playCrossing — clear “personal best” moment.
      tone(audio, { frequency: 523.25, duration: 0.1, type: "triangle", gain: 0.075 })
      tone(audio, {
        frequency: 659.25,
        duration: 0.1,
        type: "sine",
        gain: 0.08,
        when: 0.08,
      })
      tone(audio, {
        frequency: 783.99,
        duration: 0.11,
        type: "sine",
        gain: 0.08,
        when: 0.16,
      })
      tone(audio, {
        frequency: 987.77,
        duration: 0.12,
        type: "triangle",
        gain: 0.07,
        when: 0.26,
      })
      tone(audio, {
        frequency: 1174.7,
        duration: 0.14,
        type: "sine",
        gain: 0.065,
        when: 0.38,
      })
      tone(audio, {
        frequency: 1396.9,
        duration: 0.2,
        type: "triangle",
        gain: 0.05,
        when: 0.5,
      })
      tone(audio, {
        frequency: 1568.0,
        duration: 0.16,
        type: "sine",
        gain: 0.04,
        when: 0.64,
      })
    },
    startBed() {
      const audio = ensure()
      if (!audio || bedTimer !== null) {
        return
      }
      const notes = [261.63, 329.63, 392.0, 329.63]
      bedTimer = window.setInterval(() => {
        const live = ensure()
        if (!live) {
          return
        }
        const frequency = notes[bedStep % notes.length] ?? 261.63
        bedStep += 1
        tone(live, {
          frequency,
          duration: 0.35,
          type: "sine",
          gain: 0.018,
        })
      }, 480)
    },
    stop() {
      if (bedTimer !== null) {
        window.clearInterval(bedTimer)
        bedTimer = null
      }
      if (ctx) {
        void ctx.close()
        ctx = null
      }
    },
  }
}
