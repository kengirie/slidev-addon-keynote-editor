import YAML from 'yaml'

/**
 * Layout placeholders ("boxes"), as slidev-addon-boxes renders them.
 *
 * A layout declares named boxes with default geometry. A slide only records a
 * box once it has been moved, as Slidev's own `v-drag` does: `dragPos.<name>`
 * holds `x,y,w,h[,rotate]` in slide units. Hiding a box is `boxes.<name>.hide`.
 *
 * These edits are made on the frontmatter's YAML document rather than line by
 * line, because both keys are nested maps. The document keeps comments, key
 * order and the flow style of maps the author wrote by hand.
 */

export interface BoxGeometry {
  x: number
  y: number
  w: number
  h: number
  rotate: number
}

export function formatBoxPos(g: BoxGeometry): string {
  const parts = [g.x, g.y, g.w, g.h].map(Math.round)
  if (Math.round(g.rotate))
    parts.push(Math.round(g.rotate))
  return parts.join(',')
}

export function parseBoxPos(raw: unknown): BoxGeometry | null {
  if (typeof raw !== 'string')
    return null
  const n = raw.replace(/^\[|\]$/g, '').split(',').map(v => Number(v.trim()))
  if (n.length < 4 || !n.slice(0, 4).every(Number.isFinite))
    return null
  return { x: n[0], y: n[1], w: n[2], h: n[3], rotate: Number.isFinite(n[4]) ? n[4] : 0 }
}

function edit(raw: string, change: (doc: YAML.Document) => void): string {
  const doc = YAML.parseDocument(raw ?? '')
  if (!doc.contents)
    doc.contents = doc.createNode({}) as any
  change(doc)
  prune(doc, ['dragPos'])
  prune(doc, ['boxes'])
  const text = doc.toString()
  // An emptied document stringifies as "{}\n", which is not what an empty
  // frontmatter block looks like.
  return text.trim() === '{}' ? '' : text
}

/** Removes empty maps along a path, innermost first, so no `boxes: {}` is left behind. */
function prune(doc: YAML.Document, path: string[]) {
  const node = doc.getIn(path, true) as any
  if (!YAML.isMap(node))
    return
  for (const item of [...node.items]) {
    const child = item.value
    if (YAML.isMap(child) && child.items.length === 0)
      node.delete(item.key)
  }
  if (node.items.length === 0)
    doc.deleteIn(path)
}

/** Writes or clears `dragPos.<name>`. */
export function setBoxPos(raw: string, name: string, geometry: BoxGeometry | null): string {
  return edit(raw, (doc) => {
    if (geometry)
      doc.setIn(['dragPos', name], formatBoxPos(geometry))
    else if (doc.hasIn(['dragPos', name]))
      doc.deleteIn(['dragPos', name])
  })
}

/**
 * Sets the whole `dragPos` map, for a frontmatter text that may be out of date.
 *
 * A position written in place (HMR skipped) updates the server's frontmatter
 * but not always the text it reports back, so the text is brought up to date
 * from the map before it is used for undo.
 */
export function setDragPosMap(raw: string, map: Record<string, string>): string {
  return edit(raw, (doc) => {
    if (doc.has('dragPos'))
      doc.delete('dragPos')
    if (Object.keys(map).length)
      doc.set('dragPos', doc.createNode(map))
  })
}

/** Shows or hides a box on this slide, as Keynote's title/body checkboxes do. */
export function setBoxHidden(raw: string, name: string, hidden: boolean): string {
  return edit(raw, (doc) => {
    if (hidden) {
      if (!doc.hasIn(['boxes', name]))
        doc.setIn(['boxes', name], doc.createNode({ hide: true }, { flow: true }))
      else
        doc.setIn(['boxes', name, 'hide'], true)
    }
    else if (doc.hasIn(['boxes', name, 'hide'])) {
      doc.deleteIn(['boxes', name, 'hide'])
    }
  })
}

/**
 * Keynote's "Reapply Layout to Selection": the box goes back to the layout's
 * position and size, and is shown again. Its text is kept.
 */
export function resetBox(raw: string, name: string): string {
  return edit(raw, (doc) => {
    if (doc.hasIn(['dragPos', name]))
      doc.deleteIn(['dragPos', name])
    for (const key of ['x', 'y', 'w', 'h', 'rotate', 'hide']) {
      if (doc.hasIn(['boxes', name, key]))
        doc.deleteIn(['boxes', name, key])
    }
  })
}

/**
 * Text for a box that is still empty: it is given its own named slot.
 *
 * A box only renders what its slot holds, so filling a placeholder is adding
 * `::name::` and the text to the end of the slide. Slot sugar sections can come
 * in any order, so appending never disturbs what is already there.
 */
export function fillBox(content: string, name: string, text: string): string {
  const body = content.replace(/\s+$/, '')
  const block = `::${name}::\n${text.trim()}\n`
  return body ? `${body}\n\n${block}` : block
}

const RE_SLOT_MARKER = /^::[\w-]+::\s*$/
const RE_CLICK_OPEN = /^<v-clicks?\b[^>]*>$/
const RE_CLICK_CLOSE = /^<\/v-clicks?>$/

/**
 * The lines a placeholder's text occupies, for edits that act on a whole box
 * (a click animation, as Keynote builds an object in).
 *
 * A box's text is its named slot, `::name::` up to the next slot marker; the
 * layout's main box also takes what comes before the first marker. Blank lines
 * at either end are left out, and so is a `<v-click>`/`<v-clicks>` wrapper
 * already around the text, so that the wrapper is what an animation edit finds
 * and rewrites rather than wrapping a second time.
 */
export function slotRange(content: string, name: string, isMain: boolean): [number, number] | null {
  const lines = content.split(/\r?\n/)
  let start = lines.findIndex(line => line.trim() === `::${name}::`)
  let end: number
  if (start >= 0) {
    start += 1
    end = lines.findIndex((line, i) => i >= start && RE_SLOT_MARKER.test(line.trim()))
  }
  else if (isMain) {
    start = 0
    end = lines.findIndex(line => RE_SLOT_MARKER.test(line.trim()))
  }
  else {
    return null
  }
  if (end < 0)
    end = lines.length

  const trim = () => {
    while (start < end && !lines[start].trim())
      start += 1
    while (end > start && !lines[end - 1].trim())
      end -= 1
  }
  trim()
  if (start >= end)
    return null

  if (RE_CLICK_OPEN.test(lines[start].trim()) && RE_CLICK_CLOSE.test(lines[end - 1].trim())) {
    start += 1
    end -= 1
    trim()
    if (start >= end)
      return null
  }
  return [start, end]
}

/** Whether a box's text is one list and nothing else, which can appear item by item. */
export function isSingleList(content: string, range: [number, number]): boolean {
  const lines = content.split(/\r?\n/).slice(range[0], range[1]).filter(line => line.trim())
  return lines.length > 0 && /^([-*+]|\d+[.)])\s/.test(lines[0]) && lines.every(line => /^(\s*([-*+]|\d+[.)])\s|\s+\S)/.test(line))
}

/**
 * Adds a block to the slide's free layer (`::free::`), where objects that are
 * not in a placeholder live. Appended to that section when there is one, or a
 * new section at the end of the slide.
 *
 * Without this an inserted component landed in whichever slot came last, and
 * so inside that placeholder's box.
 */
export function appendToFree(content: string, block: string): string {
  const lines = content.split(/\r?\n/)
  const at = lines.findIndex(line => line.trim() === '::free::')
  const text = block.trim()
  if (at < 0) {
    const body = content.replace(/\s+$/, '')
    return `${body ? `${body}\n\n` : ''}::free::\n\n${text}\n`
  }
  let end = lines.findIndex((line, i) => i > at && RE_SLOT_MARKER.test(line.trim()))
  if (end < 0)
    end = lines.length
  let last = end
  while (last > at + 1 && !lines[last - 1].trim())
    last -= 1
  const next = [...lines.slice(0, last), '', text, '', ...lines.slice(end)]
  return next.join('\n').replace(/\n{3,}/g, '\n\n')
}
