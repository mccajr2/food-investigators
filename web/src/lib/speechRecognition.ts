/** Browser speech recognition with a typed fallback when unavailable. */

export type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type SpeechRecognitionEventLike = {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  const speechWindow = window as SpeechWindow
  return Boolean(
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition,
  )
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") {
    return null
  }
  const speechWindow = window as SpeechWindow
  const Ctor =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function transcriptFromEvent(event: SpeechRecognitionEventLike): string {
  let text = ""
  for (let i = 0; i < event.results.length; i += 1) {
    text += event.results[i][0]?.transcript ?? ""
  }
  return text.trim()
}
