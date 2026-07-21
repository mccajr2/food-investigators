/**
 * Tiny Web Audio helpers for Cross — no asset files, no new deps.
 * Soft volumes; callers start the context on a user gesture (first move).
 */

type CrossAudio = {
  resume: () => Promise<void>
  playJump: () => void
  playCrossing: () => void
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
    playCrossing() {
      const audio = ensure()
      if (!audio) {
        return
      }
      tone(audio, { frequency: 523.25, duration: 0.1, type: "sine", gain: 0.07 })
      tone(audio, {
        frequency: 659.25,
        duration: 0.1,
        type: "sine",
        gain: 0.07,
        when: 0.08,
      })
      tone(audio, {
        frequency: 783.99,
        duration: 0.14,
        type: "sine",
        gain: 0.06,
        when: 0.16,
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
