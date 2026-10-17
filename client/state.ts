import type { StudioTarget } from './types'
import { useLocalStorage } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

export type PanelId = 'inspect' | 'components' | 'animate' | 'layout' | 'slides' | 'assets'

/**
 * Open from the start, as Keynote always is: `slidev` in dev is the editing
 * view, and E closes it to look at the slide alone. (A new key, so a browser
 * that ran Studio before does not keep its closed state.)
 */
export const studioOpen = useLocalStorage('slidev-keynote-editor:open', true)
export const activePanel = useLocalStorage<PanelId>('slidev-studio:panel', 'inspect')
export const dockWidth = useLocalStorage('slidev-studio:dock-width', 320)

/** Snap a dragged element to the canvas and to its neighbours. Hold Alt to skip. */
export const snapEnabled = useLocalStorage('slidev-studio:snap', true)
export const gridEnabled = useLocalStorage('slidev-studio:grid', false)
export const gridSize = useLocalStorage('slidev-studio:grid-size', 20)
/** Outline every mapped block, so it is obvious what can be selected. */
export const outlineEnabled = useLocalStorage('slidev-studio:outlines', false)

export const selection = shallowRef<StudioTarget | null>(null)
/**
 * The last click landed on the slide but on nothing the editor can trace.
 * Without this the click is simply dropped and the panel keeps saying "click
 * anything", which reads as the editor being broken rather than as that
 * particular thing not being editable.
 */
export const missed = shallowRef(false)

/** The selection's text is being edited in place. */
export const editing = ref(false)

/**
 * How text editing should start, Keynote style.
 *
 * - `caret`: a click on the text of a box that is already selected puts the
 *   insertion point where it landed
 * - `word`: a double click selects the word under the pointer
 * - `replace`: typing while a box is selected replaces all of its text
 */
export type EditIntent =
  | { mode: 'caret' | 'word', x: number, y: number }
  | { mode: 'replace', text: string }
export const editIntent = shallowRef<EditIntent | null>(null)

/**
 * The placeholder whose text is being edited, so ⌘Return can go back to
 * having the box itself selected, as Keynote does.
 */
export const editingBox = shallowRef<{ el: HTMLElement, name: string } | null>(null)
export const hovered = shallowRef<StudioTarget | null>(null)

/** A write is in flight; the UI blocks further edits until it lands. */
export const busy = ref(false)
export const lastError = ref<string | null>(null)

export function reportError(error: unknown) {
  lastError.value = error instanceof Error ? error.message : String(error)
  // eslint-disable-next-line no-console
  console.error('[slidev-studio]', error)
  setTimeout(() => (lastError.value = null), 6000)
}

export function clearSelection() {
  selection.value = null
  hovered.value = null
}

// A single place to look when something in the editor is not behaving: the
// live state is on `window.__studio__` while the dev server is running.
if (typeof window !== 'undefined')
  (window as any).__studio__ = { studioOpen, activePanel, selection, hovered, busy, lastError, editing, missed, editIntent, editingBox }
