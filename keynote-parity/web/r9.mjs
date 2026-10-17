import { open, restore, diff, sleep } from './lib.mjs'
const t = await open(1, { editor: false })
const p = t.page
const box = await p.locator('#slide-content [data-slidev-no="1"] [data-box="memo"]').boundingBox()
await p.mouse.dblclick(box.x + 20, box.y + 20); await sleep(500)
const cb = await p.locator('#drag-control-container').boundingBox()
console.log('v-drag control:', !!cb)
await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await p.mouse.down()
await p.mouse.move(cb.x + cb.width / 2 - 100, cb.y + cb.height / 2 - 50, { steps: 10 }); await p.mouse.up(); await sleep(1500)
console.log('md:', diff().trim().replace(/\n/g, ' | '))
await restore(); await t.browser.close()
