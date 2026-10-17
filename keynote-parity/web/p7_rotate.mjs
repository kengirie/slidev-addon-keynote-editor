import { open, restore, read, sleep } from './lib.mjs'
const fm = () => read().split(/^---$/m)[3].trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
await t.click(900, 700); await t.drag(1825, 985, 1700, 1060, { mods: ['Meta'] }); console.log('cmd + BR handle:', fm())
await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500)
await t.click(900, 700); await t.drag(1825, 985, 1700, 1060, { mods: ['Meta', 'Shift'] }); console.log('cmd+shift:', fm())
await restore()
console.log('handles:', await p.evaluate(() => { const h = document.querySelector('.studio-handle'); if (!h) return null; const c = getComputedStyle(h); return [c.width, c.height, c.borderColor, c.backgroundColor] }))
await t.browser.close()
