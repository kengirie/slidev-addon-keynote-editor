import { open, read, sleep } from './lib.mjs'
const fm = () => read().split(/^---$/m)[3].trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
const redoBtn = () => p.evaluate(() => document.querySelector('.studio-toolbar [title="Redo"]')?.disabled)
await t.drag(300, 380, 400, 430); console.log('move:', fm())
await p.keyboard.press('Meta+z'); await sleep(300); console.log('redo disabled right after undo:', await redoBtn())
await sleep(2500); console.log('after undo settles:', fm(), 'redo disabled:', await redoBtn())
await p.locator('.studio-toolbar [title="Redo"]').click(); await sleep(2500); console.log('click redo:', fm())
await t.browser.close()
