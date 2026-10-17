import { open, restore, read, diff, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
await t.drag(300, 380, 400, 430); console.log('moved:', diff().trim().replace(/\n/g, ' | '))
await p.keyboard.press('Meta+z'); await sleep(2500); console.log('undo:', diff().trim().replace(/\n/g, ' | '))
await p.keyboard.press('Meta+Shift+z'); await sleep(2500); console.log('redo:', diff().trim().replace(/\n/g, ' | '))
await restore(); await t.browser.close()
// エディタを閉じたまま：Slidev 標準の v-drag（ダブルクリック）で動く
const u = await open(2, { editor: false })
const [x, y] = await u.s(900, 700)
await u.page.mouse.dblclick(x, y); await sleep(400)
const cb = await u.page.locator('#drag-control-container').boundingBox()
console.log('v-drag control:', !!cb)
await u.page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await u.page.mouse.down(); await u.page.mouse.move(cb.x + cb.width / 2 + 50, cb.y + cb.height / 2 + 80, { steps: 10 }); await u.page.mouse.up(); await sleep(1500)
console.log('closed editor drag:', diff().trim().replace(/\n/g, ' | '))
await restore(); await u.browser.close()
