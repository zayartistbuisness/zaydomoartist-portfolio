import { useEffect } from 'react'

/**
 * Registry of chapter sections. DOM components register their <section>;
 * ChapterDriver (inside the canvas) writes progress every frame; scenes read
 * it with getChapter(id). Nothing here triggers React renders.
 *
 *   progress  0..1 across the pinned travel (section top at viewport top →
 *             section bottom at viewport bottom)
 *   enter     0..1 as the section's top rises from the viewport bottom to top
 *   visible   true while any part of the section is on screen
 *   rect      latest DOMRect of the section
 */
const chapters = new Map()

export function registerChapter(id, el) {
  chapters.set(id, { id, el, progress: 0, enter: 0, visible: false, rect: null })
  return () => { if (chapters.get(id)?.el === el) chapters.delete(id) }
}

export function getChapter(id) {
  return chapters.get(id) || { id, el: null, progress: 0, enter: 0, visible: false, rect: null }
}

export function allChapters() {
  return chapters.values()
}

/** DOM side: register a section ref under a chapter id. */
export function useChapterSection(id, ref) {
  useEffect(() => registerChapter(id, ref.current), [id, ref])
}
