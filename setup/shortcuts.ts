import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { studioOpen } from '../client/state'

/**
 * `E` toggles the editor, chosen because Slidev leaves it free and it is the
 * same key most drawing tools use for "edit".
 *
 * Undo and redo are not here: they are a plain keydown listener in
 * `StudioRoot`. Slidev's shortcuts go through VueUse's magic keys, and macOS
 * sends no keyup for a key pressed with ⌘, so after ⌘Z the Z stayed "down"
 * and ⇧⌘Z then fired only some of the time.
 *
 * Escape is deliberately not here. It backs out one layer at a time, which
 * depends on what has focus, and a second binding that always cleared the
 * selection meant cancelling an inline edit also lost the block being edited.
 * `useSelection` owns it.
 */
const authoring = __DEV__ && __SLIDEV_FEATURE_EDITOR__

export default (_nav: NavOperations, shortcuts: ShortcutOptions[]): ShortcutOptions[] => {
  // Same reason as the context menu: nothing to toggle in a built deck, and
  // `E` should stay free for whatever the deck itself wants to do with it.
  if (!authoring)
    return shortcuts

  return [
    ...shortcuts,
    {
      name: 'studio_toggle',
      key: 'e',
      fn: () => (studioOpen.value = !studioOpen.value),
    },
  ]
}
