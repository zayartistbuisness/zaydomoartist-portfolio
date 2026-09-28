import GroundPlane from '../../kit/GroundPlane'
import DomImage from '../../kit/DomImage'
import { getChapter } from '../../kit/chapterStore'
import { range } from '../../kit/space'
import { getAboutSlot } from './store'

const ID = 'about'
// "TURN" from Zay's approved editorial set, cut out (no pasted rectangle):
// the figure keeps its silhouette and the lower body dissolves into ink.
const PORTRAIT = '/tracking/portrait/zay-turn-cutout.webp'

// Resolves from engraved lines to the photograph as the section arrives.
const resolve = () => range(0.25, 0.85, getChapter(ID).enter)

export default function Scene() {
  return (
    <>
      <GroundPlane id={ID} color="#ebe7de" />
      <DomImage src={PORTRAIT} getSlot={getAboutSlot} getResolve={resolve} fadeFrom={0.02} fadeTo={0.34} black={0.02} white={0.95} />
    </>
  )
}
