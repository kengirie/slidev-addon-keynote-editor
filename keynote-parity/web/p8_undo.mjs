import { open, restore, read, diff, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
await t.drag(300, 380, 400, 430); console.log('moved:', diff().trim().replace(/\n/g, ' | '))
await p.keyboard.press('Meta+z'); await sleep(2500); console.log('undo:', diff().trim().replace(/\n/g, ' | '))
await p.keyboard.press('Meta+Shift+z'); await sleep(2500); console.log('redo:', diff().trim().replace(/\n/g, ' | '))
await restore(); await t.browser.close()
// エディタを閉じたまま：エディタが入っているデッキでは v-drag は付かない（閉じた状態は見るだけ）
const u = await open(2, { editor: false })
const [x, y] = await u.s(900, 700)
await u.page.mouse.dblclick(x, y); await sleep(400)
console.log('closed editor: v-drag control shown =', await u.page.locator('#drag-control-container').count() > 0, '| md:', diff().trim() || '(変化なし)')
await u.browser.close()
