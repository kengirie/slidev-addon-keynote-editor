import type { SlidePatch } from '@slidev/types'
import type { MaybeRefOrGetter } from 'vue'
import { useDynamicSlideInfo } from '@slidev/client/composables/useSlideInfo.ts'
import { computed, ref, toValue } from 'vue'
import { patchFrontmatterRaw } from '../md/frontmatter'
import { setDragPosMap } from '../md/boxes'
import { busy, reportError } from '../state'

/**
 * The single write path to the deck.
 *
 * Every editor action ends here: it produces new Markdown for the slide and
 * posts it to Slidev's own slide endpoint, the same one the built-in editor
 * and `v-drag` use. The Markdown file stays the source of truth, so anything
 * Studio does is a diff the user can read, revert, or write by hand instead.
 */

type HistoryEntry =
  | { kind: 'content', label: string, no: number, before: string, after: string }
  | { kind: 'frontmatter', label: string, no: number, before: Record<string, any>, after: Record<string, any> }
  | { kind: 'frontmatterRaw', label: string, no: number, before: string, after: string }

const undoStack = ref<HistoryEntry[]>([])
const redoStack = ref<HistoryEntry[]>([])
const HISTORY_LIMIT = 100

export const canUndo = computed(() => undoStack.value.length > 0)
export const canRedo = computed(() => redoStack.value.length > 0)
export const lastAction = computed(() => undoStack.value.at(-1)?.label ?? null)

async function send(no: number, data: SlidePatch) {
  const { update } = useDynamicSlideInfo(no)
  busy.value = true
  try {
    return await update(data)
  }
  catch (error) {
    reportError(error)
  }
  finally {
    busy.value = false
  }
}

/**
 * The frontmatter as the deck has it right now, not as it was cached.
 *
 * Positions written in place (HMR skipped, as Slidev's v-drag does) reach the
 * server's frontmatter before the text it reports, so the text is caught up
 * with the server's `dragPos` here. Every writer of the raw block goes through
 * this; editing the stale text would quietly drop every box moved since the
 * last rebuild.
 */
async function currentFrontmatter(no: number): Promise<{ raw: string, frontmatter: Record<string, any> } | null> {
  try {
    const info = await fetch(`/__slidev/slides/${no}.json`).then(r => r.json())
    if (typeof info?.frontmatterRaw !== 'string')
      return null
    const frontmatter = info.frontmatter ?? {}
    const dragPos = frontmatter.dragPos
    const raw = dragPos && typeof dragPos === 'object' ? setDragPosMap(info.frontmatterRaw, dragPos) : info.frontmatterRaw
    return { raw, frontmatter }
  }
  catch {
    return null
  }
}

function push(entry: HistoryEntry) {
  undoStack.value.push(entry)
  if (undoStack.value.length > HISTORY_LIMIT)
    undoStack.value.shift()
  redoStack.value = []
}

export function useSlideSource(no: MaybeRefOrGetter<number>) {
  const slideNo = computed(() => toValue(no))
  const { info } = useDynamicSlideInfo(slideNo)

  const content = computed(() => info.value?.content ?? '')
  const frontmatter = computed(() => info.value?.frontmatter ?? {})
  const note = computed(() => info.value?.note ?? '')

  /**
   * Replaces the slide body. `skipHmr` is for gestures that already show their
   * own result. A drag paints its position directly, so re-rendering mid-drag
   * would only make it stutter.
   */
  async function setContent(next: string, label: string, options: { skipHmr?: boolean, history?: boolean } = {}) {
    const before = content.value
    if (before === next)
      return
    if (options.history !== false)
      push({ kind: 'content', label, no: slideNo.value, before, after: next })
    await send(slideNo.value, { content: next, skipHmr: options.skipHmr })
  }

  /**
   * Frontmatter is sent as raw text rather than as a patch.
   *
   * A patch updates Slidev's own resolved copy of the deck, so the file watcher
   * then finds nothing changed and never rebuilds the slide. Since the layout
   * is compiled into the slide, switching it that way appeared to do nothing
   * until the server restarted. Sending the raw block is what Slidev's own
   * editor does, and it rebuilds properly.
   *
   * The raw text is edited line by line, so comments and key order survive.
   * Anything a line edit cannot safely rewrite falls back to the patch.
   */
  async function setFrontmatter(values: Record<string, any>, label: string) {
    // Read the block back from the server first. The cached copy is whatever
    // the last response left behind, and Slidev does not always answer a write
    // with the new raw text, so patching the cache meant every control wrote
    // over the key the one before it had set.
    // The slide is fixed before anything is awaited: navigating while the
    // request is in flight must not send this slide's frontmatter to another.
    const at = slideNo.value
    const currentRaw = (await currentFrontmatter(at))?.raw ?? info.value?.frontmatterRaw ?? ''
    const { raw, unhandled } = patchFrontmatterRaw(currentRaw, values)

    const handled = Object.fromEntries(Object.entries(values).filter(([key]) => !unhandled.includes(key)))
    if (Object.keys(handled).length) {
      push({ kind: 'frontmatterRaw', label, no: at, before: currentRaw, after: raw })
      await send(at, { frontmatterRaw: raw })
    }

    if (unhandled.length) {
      const rest = Object.fromEntries(unhandled.map(key => [key, values[key]]))
      const before: Record<string, any> = {}
      for (const key of unhandled)
        before[key] = frontmatter.value[key] ?? null
      push({ kind: 'frontmatter', label, no: at, before, after: rest })
      await send(at, { frontmatter: rest })
    }
  }

  /**
   * Rewrites the frontmatter block with a function of its current text.
   *
   * For edits a line patch cannot make, such as nested maps like
   * `dragPos.<name>`. The text is read back from the server first, for the same
   * reason as above, and the result is recorded for undo.
   */
  async function editFrontmatterRaw(change: (raw: string) => string, label: string) {
    const at = slideNo.value
    const currentRaw = (await currentFrontmatter(at))?.raw ?? info.value?.frontmatterRaw ?? ''
    const raw = change(currentRaw)
    if (raw === currentRaw)
      return
    push({ kind: 'frontmatterRaw', label, no: at, before: currentRaw, after: raw })
    await send(at, { frontmatterRaw: raw })
  }

  /**
   * Moves a layout placeholder without rebuilding the slide.
   *
   * The same write Slidev's own `v-drag` makes: the whole `dragPos` map as a
   * frontmatter patch, with HMR skipped. The server updates the file and its
   * own copy of the frontmatter, and the box the gesture already painted stays
   * where it was dropped, so nothing on screen is rebuilt or flickers.
   *
   * Undo and redo are recorded as raw frontmatter, which does rebuild: going
   * back is the one time the slide has to be drawn from the file again.
   */
  async function setDragPos(name: string, value: string | null, label: string, on?: number) {
    // `on` is the slide the gesture belonged to: an arrow-key nudge is written
    // a moment after the last key, by which time the deck may have moved on.
    const at = on ?? slideNo.value
    const fresh = await currentFrontmatter(at)
    // The cached info belongs to whichever slide is current now, which need not
    // be `at`: it is only a fallback when the server could not be asked, and
    // only for the slide it describes.
    const cached = at === slideNo.value ? info.value : null
    const reportedRaw = fresh ? fresh.raw : (cached?.frontmatterRaw ?? '')
    const before: Record<string, string> = { ...(fresh ? (fresh.frontmatter.dragPos ?? {}) : (cached?.frontmatter?.dragPos ?? {})) }
    if (before[name] === value)
      return
    const current = { ...before }
    if (value === null)
      delete current[name]
    else
      current[name] = value
    push({
      kind: 'frontmatterRaw',
      label,
      no: at,
      before: setDragPosMap(reportedRaw, before),
      after: setDragPosMap(reportedRaw, current),
    })
    await send(at, {
      frontmatter: { dragPos: Object.keys(current).length ? current : null },
      skipHmr: true,
    } as SlidePatch)
  }

  async function setNote(next: string) {
    await send(slideNo.value, { note: next })
  }

  return { info, content, frontmatter, note, setContent, setFrontmatter, editFrontmatterRaw, setDragPos, setNote }
}

/**
 * Undo and redo replay whole-slide snapshots rather than inverse operations.
 * Slides are small, and storing the text makes every action undoable without
 * each one having to describe its own inverse.
 */
export function useStudioHistory() {
  async function replay(entry: HistoryEntry, direction: 'before' | 'after') {
    if (entry.kind === 'content')
      await send(entry.no, { content: entry[direction] })
    else if (entry.kind === 'frontmatterRaw')
      await send(entry.no, { frontmatterRaw: entry[direction] })
    else
      await send(entry.no, { frontmatter: entry[direction] })
  }

  async function undo() {
    const entry = undoStack.value.pop()
    if (!entry)
      return
    redoStack.value.push(entry)
    await replay(entry, 'before')
  }

  async function redo() {
    const entry = redoStack.value.pop()
    if (!entry)
      return
    undoStack.value.push(entry)
    await replay(entry, 'after')
  }

  function reset() {
    undoStack.value = []
    redoStack.value = []
  }

  return { undo, redo, reset, canUndo, canRedo, lastAction }
}
