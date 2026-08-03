import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// cmdk observes list size; jsdom does not provide ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver)

// cmdk scrolls the selected item into view.
Element.prototype.scrollIntoView =
  Element.prototype.scrollIntoView ?? (() => {})

afterEach(() => {
  cleanup()
})
