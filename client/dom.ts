/**
 * Slidev keeps more than one slide mounted at a time, since the next one is
 * pre-rendered for transitions and previews, so `#slide-content` is not a
 * single slide. Every DOM lookup Studio makes has to be scoped to the slide
 * being edited, or a click can be traced back to a completely different
 * slide's Markdown.
 */

export const CANVAS_SELECTOR = '#slide-content'

export function canvasElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(CANVAS_SELECTOR)
}

/** The rendered root of one slide, as marked by Slidev's `SlideWrapper`. */
export function slideElement(no: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`${CANVAS_SELECTOR} [data-slidev-no="${no}"]`)
}

/** Every block on that slide the editor can map back to source. */
export function mappedElements(no: number): HTMLElement[] {
  const root = slideElement(no)
  // `data-studio-prop` is how a theme says "these words are a frontmatter key".
  // Such an element has no line range, so it would never be found by the first
  // selector, and text rendered from a layout's props could not be clicked.
  return root ? [...root.querySelectorAll<HTMLElement>('[data-studio-src], [data-studio-prop], [data-studio-box]')] : []
}

/** A layout placeholder on that slide, by name. */
export function boxElement(no: number, name: string): HTMLElement | null {
  return slideElement(no)?.querySelector<HTMLElement>(`[data-studio-box="${CSS.escape(name)}"]`) ?? null
}

/** The layout's own list of its placeholders, hidden ones included. */
export function layoutBoxes(no: number): { name: string, prompt: string, hidden: boolean }[] {
  const raw = slideElement(no)?.querySelector<HTMLElement>('[data-studio-layout-boxes]')?.dataset.studioLayoutBoxes
  try {
    return raw ? JSON.parse(raw) : []
  }
  catch {
    return []
  }
}

/** Whether a node belongs to the slide currently being edited. */
export function belongsToSlide(node: Element, no: number): boolean {
  const root = slideElement(no)
  return !!root && root.contains(node)
}

/**
 * Puts a placeholder where it now is, until the slide's frontmatter (updated
 * once the write lands) draws it there too.
 */
export function placeBox(el: HTMLElement, g: { x: number, y: number, w: number, h: number, rotate: number }, origin: { x: number, y: number }) {
  el.style.left = `${g.x - origin.x}px`
  el.style.top = `${g.y - origin.y}px`
  el.style.width = `${g.w}px`
  el.style.height = `${g.h}px`
  el.style.transform = g.rotate ? `rotate(${g.rotate}deg)` : ''
}
