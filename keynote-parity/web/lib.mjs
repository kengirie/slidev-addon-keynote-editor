// ブラウザ側（Slidev + エディタ）を操作するための共通処理
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const require = createRequire('/Users/3001macmini/slidev-keynote-template/package.json')
const { chromium } = require('playwright-chromium')

export const MD = process.env.MD ?? '/Users/3001macmini/slidev-keynote-template/slidev-theme-keynote-basic/example/editor.md'
export const BAK = process.env.BAK
export const URL = process.env.URL ?? 'http://localhost:3040'
export const sleep = ms => new Promise(r => setTimeout(r, ms))
export const diff = () => { try { return execSync(`diff ${BAK} ${MD}`).toString() || '(変化なし)' } catch (e) { return e.stdout.toString() } }
export async function restore() { writeFileSync(MD, readFileSync(BAK)); await sleep(2500) }
export function read() { return readFileSync(MD, 'utf8') }

export async function open(no = 2, { editor = true } = {}) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !/FloatingVue|Wake Lock/.test(m.text())) errors.push(m.text().slice(0, 300)) })
  await page.goto(`${URL}/${no}`, { waitUntil: 'networkidle' })
  await sleep(1200)
  if (editor) { await page.keyboard.press('e'); await sleep(1200) }
  const api = {
    browser, page, errors,
    /** スライド座標 → 画面座標（エディタの縮小表示込み） */
    async s(x, y) {
      return page.evaluate(([x, y, no]) => {
        const r = document.querySelector(`#slide-content [data-slidev-no="${no}"]`).getBoundingClientRect()
        const k = r.width / 1920
        return [r.left + x * k, r.top + y * k]
      }, [x, y, no])
    },
    /** 枠の位置（スライド座標） */
    async box(name) {
      return page.evaluate(([name, no]) => {
        const slide = document.querySelector(`#slide-content [data-slidev-no="${no}"]`).getBoundingClientRect()
        const el = document.querySelector(`#slide-content [data-slidev-no="${no}"] [data-box="${name}"]`)
        if (!el) return null
        const k = slide.width / 1920, r = el.getBoundingClientRect()
        return [r.left - slide.left, r.top - slide.top, r.width, r.height].map(v => Math.round(v / k))
      }, [name, no])
    },
    async click(x, y, opts = {}) { const [a, b] = await api.s(x, y); await page.mouse.click(a, b, opts); await sleep(400) },
    async dblclick(x, y) { const [a, b] = await api.s(x, y); await page.mouse.dblclick(a, b); await sleep(500) },
    async drag(x1, y1, x2, y2, { mods = [], steps = 20, hold = 0 } = {}) {
      const [a, b] = await api.s(x1, y1); const [c, d] = await api.s(x2, y2)
      for (const m of mods) await page.keyboard.down(m)
      await page.mouse.move(a, b); await page.mouse.down()
      await page.mouse.move(c, d, { steps })
      if (hold) await sleep(hold)
      await page.mouse.up()
      for (const m of mods) await page.keyboard.up(m)
      await sleep(1500)
    },
    async state() {
      return page.evaluate(() => { const s = window.__studio__; return { sel: s.selection.value && { kind: s.selection.value.kind, box: s.selection.value.box, label: s.selection.value.label }, editing: s.editing.value } })
    },
    async shot(path) { await page.screenshot({ path }) },
  }
  return api
}
