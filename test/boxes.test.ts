import { describe, expect, it } from 'vitest'
import { fillBox, formatBoxPos, parseBoxPos, resetBox, setBoxHidden, setBoxPos } from '../client/md/boxes'

describe('layout placeholders in the frontmatter', () => {
  it('writes dragPos for a moved box, keeping comments and other keys', () => {
    const raw = 'layout: default\nboxes:\n  body: { y: 420 } # hand written\n'
    expect(setBoxPos(raw, 'title', { x: 300, y: 85, w: 1730, h: 113, rotate: 0 }))
      .toBe('layout: default\nboxes:\n  body: { y: 420 } # hand written\ndragPos:\n  title: 300,85,1730,113\n')
  })

  it('rounds and adds the rotation only when there is one', () => {
    expect(formatBoxPos({ x: 1.4, y: 2.6, w: 3, h: 4, rotate: 0 })).toBe('1,3,3,4')
    expect(formatBoxPos({ x: 1, y: 2, w: 3, h: 4, rotate: 15 })).toBe('1,2,3,4,15')
    expect(parseBoxPos('1,2,3,4,15')).toEqual({ x: 1, y: 2, w: 3, h: 4, rotate: 15 })
    expect(parseBoxPos('1,2,3')).toBeNull()
  })

  it('hides a box, and showing it again leaves nothing behind', () => {
    const hidden = setBoxHidden('layout: default\n', 'body', true)
    expect(hidden).toBe('layout: default\nboxes:\n  body: { hide: true }\n')
    expect(setBoxHidden(hidden, 'body', false)).toBe('layout: default\n')
  })

  it('reapplies the layout: position, size and visibility go, other settings stay', () => {
    const raw = 'layout: default\ndragPos:\n  body: 1,2,3,4\n  title: 5,6,7,8\nboxes:\n  body: { y: 420, role: footer, hide: true }\n'
    expect(resetBox(raw, 'body'))
      .toBe('layout: default\ndragPos:\n  title: 5,6,7,8\nboxes:\n  body: { role: footer }\n')
  })

  it('fills an empty box with its own slot', () => {
    expect(fillBox('::title::\nT\n', 'subtitle', 'S')).toBe('::title::\nT\n\n::subtitle::\nS\n')
  })
})

describe('a component closed in a later block', () => {
  it('is given the lines up to its closing tag', async () => {
    const MarkdownIt = (await import('markdown-it')).default
    const { studioMarkdownSetup } = await import('../node/markdown-source')
    const md = new MarkdownIt({ html: true })
    studioMarkdownSetup(md, { annotate: 'all' })
    const html = md.render('# T\n\n<KBox name="free" x="1">\n\nText **bold**\n\n</KBox>\n\nAfter\n')
    expect(html).toMatch(/<KBox name="free" x="1" data-studio-src="2,7"/)
  })
})
