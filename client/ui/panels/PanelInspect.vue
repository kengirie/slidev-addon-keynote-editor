<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { configs } from '@slidev/client/env.ts'
import { useCatalog } from '../../composables/useCatalog'
import { useStudio } from '../../context'
import { readProp, writeProp } from '../../md/props'
import { readDrag, writeDrag } from '../../md/drag'
import { getBlock, replaceBlock } from '../../md/lines'
import { canStyle, readClasses, writeClasses } from '../../md/classes'
import { canReorder, deleteBlock, duplicateBlock, freePosition, moveBlockBy, returnToFlow } from '../../actions'
import { missed, selection } from '../../state'
import { formatBoxPos, parseBoxPos, resetBox, setBoxHidden } from '../../md/boxes'
import { layoutBoxes } from '../../dom'
import PropField from '../parts/PropField.vue'
import StudioField from '../parts/StudioField.vue'
import StudioIcon from '../parts/StudioIcon.vue'

/**
 * The properties panel: where the selected block lives, how it is styled, and
 * the raw Markdown behind it. Every control writes the smallest possible edit
 * back to the slide.
 */
const studio = useStudio()
const { components } = useCatalog()

const range = computed(() => selection.value?.range ?? null)

/** Whether this block can carry a class at all, in Markdown or as an attribute. */
const styleable = computed(() => !!range.value && canStyle(studio.content(), range.value, !!configs.mdc))

/**
 * The catalog entry behind the selected tag, if it is a component. That is
 * where the prop list, its labels and its options come from, so a component
 * gets a real form rather than a text box full of markup.
 */
const component = computed(() => {
  const tag = selection.value?.tag
  return tag ? components.find(c => c.name === tag) ?? null : null
})

const editableProps = computed(() => component.value?.props.filter(p => !p.hidden) ?? [])

function valueOf(prop: (typeof editableProps.value)[number]) {
  return range.value ? readProp(studio.content(), range.value, prop) : null
}

/**
 * Bumped when a prop write leaves the source untouched, to rebuild the fields.
 *
 * A refused write, such as clearing a prop the component requires, leaves the
 * Markdown as it was, so Vue sees the same bound value and the field goes on
 * showing what was typed: the panel then claims a value the deck does not have.
 * Only that case rebuilds. Doing it after every write threw focus out of the
 * form on each keystroke's worth of change, which stopped Tab walking it.
 */
const revision = ref(0)

async function setProp(prop: (typeof editableProps.value)[number], value: string | boolean | null) {
  if (!range.value)
    return

  const before = studio.content()
  const next = writeProp(before, range.value, prop, value)
  await studio.commit(next, `Set ${prop.name}`)
  if (next === before)
    revision.value += 1
}
const block = computed(() => (range.value ? getBlock(studio.content(), range.value) : ''))
const drag = computed(() => (range.value ? readDrag(studio.content(), range.value) : null))
const pos = computed(() => drag.value?.pos ?? null)

const draft = ref('')
watch(block, value => (draft.value = value), { immediate: true })
const dirty = computed(() => draft.value !== block.value)

const classes = ref('')
watch([block, range], () => {
  classes.value = range.value ? readClasses(studio.content(), range.value) : ''
}, { immediate: true })

/** An emptied height means "size to content", which is `null`, not zero. */
async function setPos(field: 'x' | 'y' | 'w' | 'h' | 'rotate', value: number | null) {
  if (!range.value || !pos.value)
    return
  await studio.commit(
    writeDrag(studio.content(), range.value, { ...pos.value, [field]: value }),
    'Set position',
  )
}

async function toFreePosition() {
  if (selection.value)
    await freePosition(studio, selection.value)
}

async function toFlow() {
  if (selection.value)
    await returnToFlow(studio, selection.value)
}

async function applyClasses() {
  if (!range.value)
    return
  await studio.commit(writeClasses(studio.content(), range.value, classes.value), 'Set classes')
}

async function applyDraft() {
  if (!range.value || !dirty.value)
    return
  await studio.commit(replaceBlock(studio.content(), range.value, draft.value), 'Edit block')
}

async function move(direction: -1 | 1) {
  if (selection.value)
    await moveBlockBy(studio, selection.value, direction)
}

async function duplicate() {
  if (selection.value)
    await duplicateBlock(studio, selection.value)
}

async function remove() {
  if (selection.value)
    await deleteBlock(studio, selection.value)
}

/* ---- Layout placeholders (Keynote) ---- */

/** The selected placeholder's geometry: where it was moved to, or the layout's default. */
const boxGeometry = computed(() => {
  const current = selection.value
  if (current?.kind !== 'box' || !current.box)
    return null
  void studio.frontmatter()
  void revision.value
  // From the box as drawn: a position written in place is on screen before the
  // frontmatter the panel holds catches up.
  const box = studio.canvas.boxOf(current.el)
  const saved = parseBoxPos(studio.frontmatter().dragPos?.[current.box])
  return { x: box.x, y: box.y, w: box.w, h: box.h, rotate: saved?.rotate ?? 0 }
})
const boxMoved = computed(() => {
  const name = selection.value?.box
  return !!name && (studio.frontmatter().dragPos?.[name] != null || studio.frontmatter().boxes?.[name] != null)
})

async function setBoxField(field: 'x' | 'y' | 'w' | 'h' | 'rotate', value: number) {
  const name = selection.value?.box
  if (!name || !boxGeometry.value || !Number.isFinite(value))
    return
  const next = { ...boxGeometry.value, [field]: value }
  // Painted at once and written in place, like a drag, so the slide is not rebuilt.
  const el = selection.value!.el
  el.style.left = `${next.x - studio.canvas.originOf(el).x}px`
  el.style.top = `${next.y - studio.canvas.originOf(el).y}px`
  el.style.width = `${next.w}px`
  el.style.height = `${next.h}px`
  el.style.transform = next.rotate ? `rotate(${next.rotate}deg)` : ''
  await studio.setDragPos(name, formatBoxPos(next), 'Set placeholder position')
}

/** Keynote's フォーマット ＞ 選択内容にレイアウトを再適用. */
async function reapplyLayout() {
  const name = selection.value?.box
  if (name)
    await studio.editFrontmatterRaw(raw => resetBox(raw, name), 'Reapply layout')
}

async function hideBox() {
  const name = selection.value?.box
  if (!name)
    return
  selection.value = null
  await studio.editFrontmatterRaw(raw => setBoxHidden(raw, name, true), 'Delete placeholder')
}

/** The slide's placeholders, for the show/hide checkboxes Keynote has in the sidebar. */
const slideBoxes = computed(() => {
  // Which boxes there are comes from the layout; whether each is shown comes
  // from the frontmatter itself, which is updated before the slide re-renders.
  const overrides = studio.frontmatter().boxes ?? {}
  return layoutBoxes(studio.no()).map(b => ({ ...b, hidden: !!overrides[b.name]?.hide }))
})

async function toggleBox(name: string, shown: boolean) {
  await studio.editFrontmatterRaw(raw => setBoxHidden(raw, name, !shown), shown ? 'Show placeholder' : 'Hide placeholder')
}
</script>

<template>
  <template v-if="!selection && slideBoxes.length">
    <section class="studio-section">
      <h3 class="studio-section__title">
        スライドレイアウト
      </h3>
      <label v-for="b in slideBoxes" :key="b.name" class="studio-check">
        <input type="checkbox" :checked="!b.hidden" @change="toggleBox(b.name, ($event.target as HTMLInputElement).checked)">
        {{ b.prompt || b.name }}
      </label>
    </section>
  </template>

  <section v-if="selection?.kind === 'box' && boxGeometry" class="studio-section">
    <h3 class="studio-section__title">
      プレースホルダ「{{ selection.box }}」
    </h3>
    <StudioField label="X">
      <input type="number" :value="Math.round(boxGeometry.x)" @change="setBoxField('x', +($event.target as HTMLInputElement).value)">
    </StudioField>
    <StudioField label="Y">
      <input type="number" :value="Math.round(boxGeometry.y)" @change="setBoxField('y', +($event.target as HTMLInputElement).value)">
    </StudioField>
    <StudioField label="幅">
      <input type="number" :value="Math.round(boxGeometry.w)" @change="setBoxField('w', +($event.target as HTMLInputElement).value)">
    </StudioField>
    <StudioField label="高さ">
      <input type="number" :value="Math.round(boxGeometry.h)" @change="setBoxField('h', +($event.target as HTMLInputElement).value)">
    </StudioField>
    <StudioField label="回転">
      <input type="number" :value="Math.round(boxGeometry.rotate)" @change="setBoxField('rotate', +($event.target as HTMLInputElement).value)">
    </StudioField>
    <p class="studio-hint">
      X・Y は枠の左上、スライドの左上からの pt（Keynote の「配置」と同じ）
    </p>
    <div class="studio-button-row">
      <button class="studio-button" :disabled="!boxMoved" @click="reapplyLayout">
        選択内容にレイアウトを再適用
      </button>
      <button class="studio-button" @click="hideBox">
        削除（非表示）
      </button>
    </div>
  </section>

  <div v-else-if="!selection" class="studio-empty">
    <template v-if="missed">
      <p>That part of the slide does not come from the Markdown.</p>
      <p class="studio-hint">
        It is drawn by the layout, so it is edited under Layout rather than on
        the canvas. Everything written in the slide body can be clicked.
      </p>
    </template>
    <template v-else>
      Click anything on the slide to select it.
    </template>
  </div>

  <template v-else-if="selection?.kind === 'box'" />

  <div v-else-if="selection?.prop" class="studio-empty">
    <p>
      These words are the slide's <code>{{ selection.prop }}</code>.
    </p>
    <p class="studio-hint">
      Double click to rewrite them here, or open the Layout panel to change them
      along with the rest of the slide's settings.
    </p>
  </div>

  <div v-else-if="!range" class="studio-empty">
    <p>This element could not be traced back to the Markdown.</p>
    <p class="studio-hint">
      That happens when a custom Markdown transformer moves lines around. The
      element still renders, it just cannot be edited visually.
    </p>
  </div>

  <template v-else>
    <section class="studio-section">
      <h3 class="studio-section__title">
        {{ selection.label }}
      </h3>
      <p class="studio-hint">
        Lines {{ range[0] + 1 }}–{{ range[1] }} of this slide
      </p>
    </section>

    <section class="studio-section">
      <h3 class="studio-section__title">
        Position
      </h3>
      <div v-if="!pos" class="studio-button-row">
        <button class="studio-button" @click="toFreePosition">
          <StudioIcon name="free" :size="14" /> Free position
        </button>
      </div>
      <template v-else>
        <StudioField label="X">
          <input type="number" :value="Math.round(pos.x)" @change="setPos('x', +($event.target as HTMLInputElement).value)">
        </StudioField>
        <StudioField label="Y">
          <input type="number" :value="Math.round(pos.y)" @change="setPos('y', +($event.target as HTMLInputElement).value)">
        </StudioField>
        <StudioField label="Width">
          <input type="number" :value="Math.round(pos.w)" @change="setPos('w', +($event.target as HTMLInputElement).value)">
        </StudioField>
        <StudioField label="Height">
          <input
            type="number"
            :value="pos.h === null ? '' : Math.round(pos.h)"
            placeholder="auto"
            @change="setPos('h', ($event.target as HTMLInputElement).value.trim() === '' ? null : +($event.target as HTMLInputElement).value)"
          >
        </StudioField>
        <StudioField label="Rotation">
          <input type="number" :value="Math.round(pos.rotate)" @change="setPos('rotate', +($event.target as HTMLInputElement).value)">
        </StudioField>
        <button class="studio-button" @click="toFlow">
          <StudioIcon name="flow" :size="14" /> Return to flow
        </button>
        <p class="studio-hint">
          Free elements are positioned in canvas units ({{ studio.canvas.slideWidth.value }} wide).
        </p>
      </template>
    </section>

    <section v-if="component" class="studio-section">
      <h3 class="studio-section__title">
        {{ component.name }} props
      </h3>
      <p v-if="!editableProps.length" class="studio-hint">
        This component takes no props.
      </p>
      <PropField
        v-for="prop in editableProps"
        :key="`${prop.name}-${revision}`"
        :prop="prop"
        :value="valueOf(prop)"
        @change="setProp(prop, $event)"
      />
      <p v-if="component.description" class="studio-hint">
        {{ component.description }}
      </p>
    </section>

    <section class="studio-section">
      <h3 class="studio-section__title">
        Style
      </h3>
      <StudioField v-if="styleable" label="Classes">
        <input v-model="classes" type="text" placeholder="text-xl opacity-80" @change="applyClasses">
      </StudioField>
      <p v-if="!selection.tag && !configs.mdc" class="studio-hint">
        Classes on Markdown blocks need <code>mdc: true</code> in the headmatter.
      </p>
      <p v-else-if="!styleable" class="studio-hint">
        This block cannot carry a class of its own. A trailing
        <code>{{ '{.class}' }}</code> would land on its last line instead. Wrap
        it in a <code>&lt;div&gt;</code> to style it.
      </p>
    </section>

    <section class="studio-section">
      <h3 class="studio-section__title">
        Arrange
      </h3>
      <div class="studio-button-row">
        <button class="studio-button" title="Move earlier" :disabled="!canReorder(selection)" @click="move(-1)">
          <StudioIcon name="up" :size="14" />
        </button>
        <button class="studio-button" title="Move later" :disabled="!canReorder(selection)" @click="move(1)">
          <StudioIcon name="down" :size="14" />
        </button>
        <button class="studio-button" title="Duplicate" :disabled="!canReorder(selection)" @click="duplicate">
          <StudioIcon name="copy" :size="14" />
        </button>
        <button class="studio-button studio-button--danger" title="Delete" @click="remove">
          <StudioIcon name="trash" :size="14" />
        </button>
      </div>
      <p v-if="!canReorder(selection)" class="studio-hint">
        This element shares a block with its neighbours, so it can be edited and
        deleted but not reordered on its own.
      </p>
    </section>

    <section class="studio-section">
      <h3 class="studio-section__title">
        Markdown
      </h3>
      <textarea v-model="draft" rows="6" spellcheck="false" />
      <div class="studio-button-row" style="margin-top: 6px">
        <button class="studio-button" :disabled="!dirty" @click="applyDraft">
          Apply
        </button>
        <button class="studio-button" :disabled="!dirty" @click="draft = block">
          Revert
        </button>
      </div>
    </section>
  </template>
</template>
