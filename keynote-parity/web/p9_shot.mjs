import { open, sleep } from './lib.mjs'
const t = await open(2)
await t.click(900, 700)
const [x, y] = await t.s(0, 0); const [x2, y2] = await t.s(1920, 1080)
await t.page.screenshot({ path: process.argv[2], clip: { x, y, width: x2 - x, height: y2 - y } })
await t.browser.close()
