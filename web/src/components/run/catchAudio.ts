/**
 * Tiny Web Audio helpers for Catch — no asset files, no new deps.
 * Soft volumes; callers start the context on a user gesture (first move).
 * Bed notes/pacing differ from Cross so the two games feel distinct.
 */

type CatchAudio = {
  resume: () => Promise<void>
  playCatch: () => void
  playCheer: () => void
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

export function createCatchAudio(
  AudioContextCtor: typeof AudioContext = globalThis.AudioContext,
): CatchAudio | null {
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
    playCatch() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Bright short blip — score without looking.
      tone(audio, { frequency: 880, duration: 0.06, type: "square", gain: 0.05 })
      tone(audio, {
        frequency: 1174.7,
        duration: 0.07,
        type: "triangle",
        gain: 0.04,
        when: 0.04,
      })
    },
    playCheer() {
      const audio = ensure()
      if (!audio) {
        return
      }
      // Same family as Cross cheer, different intervals / top note.
      tone(audio, { frequency: 392.0, duration: 0.1, type: "sine", gain: 0.075 })
      tone(audio, {
        frequency: 523.25,
        duration: 0.1,
        type: "sine",
        gain: 0.075,
        when: 0.08,
      })
      tone(audio, {
        frequency: 659.25,
        duration: 0.12,
        type: "triangle",
        gain: 0.07,
        when: 0.16,
      })
      tone(audio, {
        frequency: 783.99,
        duration: 0.16,
        type: "sine",
        gain: 0.065,
        when: 0.26,
      })
      tone(audio, {
        frequency: 987.77,
        duration: 0.14,
        type: "triangle",
        gain: 0.04,
        when: 0.38,
      })
    },
    startBed() {
      const audio = ensure()
      if (!audio || bedTimer !== null) {
        return
      }
      // Pentatonic-ish bounce — faster/lighter than Cross’s 480ms bed.
      const notes = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23]
      bedTimer = window.setInterval(() => {
        const live = ensure()
        if (!live) {
          return
        }
        const frequency = notes[bedStep % notes.length] ?? 293.66
        bedStep += 1
        tone(live, {
          frequency,
          duration: 0.28,
          type: "triangle",
          gain: 0.016,
        })
      }, 360)
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
