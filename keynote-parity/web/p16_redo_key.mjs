import { open, read, sleep } from './lib.mjs'
const fm = () => read().split(/^---$/m)[3].trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
await p.evaluate(() => document.addEventListener('keydown', e => { window.__keys = (window.__keys || []).concat(`${e.metaKey ? 'M+' : ''}${e.shiftKey ? 'S+' : ''}${e.key}:${e.defaultPrevented}`) }, true))
await t.drag(300, 380, 400, 430); console.log('move:', fm(), (await t.state()).sel)
await p.keyboard.press('Meta+z'); await sleep(2500); console.log('undo:', fm(), (await t.state()).sel)
await p.keyboard.press('Meta+Shift+z'); await sleep(2500); console.log('redo key:', fm(), await p.evaluate(() => window.__keys))
await p.keyboard.press('Escape'); await sleep(300)
await p.keyboard.press('Meta+Shift+z'); await sleep(2500); console.log('redo key without selection:', fm())
await t.browser.close()
