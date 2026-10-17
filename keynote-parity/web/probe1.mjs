import { open } from './lib.mjs'
const t = await open(2)
console.log(await t.page.evaluate(() => {
  const el = document.querySelector('#slide-content [data-slidev-no="2"] [data-box="title"]')
  return { fontSize: getComputedStyle(el).fontSize, studioBox: el.dataset.studioBox, def: el.dataset.studioBoxDefault, prompt: el.dataset.studioBoxPrompt, docked: document.documentElement.classList.contains('slidev-studio-docked'), list: document.querySelector('#slide-content [data-slidev-no="2"] [data-studio-layout-boxes]')?.dataset.studioLayoutBoxes }
}))
console.log('subtitle (empty, prompt):', await t.box('subtitle'), await t.page.evaluate(() => document.querySelector('#slide-content [data-slidev-no="2"] [data-box="subtitle"] .kbox-prompt')?.textContent))
await t.shot('/private/tmp/claude-501/-Users-3001macmini-slidev-keynote-template/056af4ff-ef94-458a-b2b4-37e2442d68af/scratchpad/ed-1.png')
console.log('errors', t.errors)
await t.browser.close()
