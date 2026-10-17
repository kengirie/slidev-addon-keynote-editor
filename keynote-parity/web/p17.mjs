import { open, read, sleep } from './lib.mjs'
const fm = () => read().split(/^---$/m)[3].trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
const server = () => p.evaluate(() => fetch('/__slidev/slides/2.json').then(r => r.json()).then(j => JSON.stringify(j.frontmatter.dragPos ?? null)))
await t.drag(300, 140, 350, 160); console.log('a title:', fm(), await server())
await t.drag(300, 380, 400, 430); console.log('b body:', fm(), await server())
await p.keyboard.press('Meta+z'); await sleep(3000); console.log('undo:', fm(), await server(), 'redo disabled:', await p.evaluate(() => document.querySelector('.studio-toolbar [title="Redo"]')?.disabled), 'undo label:', await p.evaluate(() => document.querySelector('.studio-toolbar [title^="Undo"]')?.title))
await p.keyboard.press('Meta+Shift+z'); await sleep(3000); console.log('redo(key):', fm(), await server())
await t.browser.close()
