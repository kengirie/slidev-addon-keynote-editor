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
