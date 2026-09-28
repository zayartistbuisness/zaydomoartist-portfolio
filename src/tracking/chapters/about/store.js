// DOM → scene hand-off for the About chapter (render-free).
export const aboutStore = { slot: null }
export const getAboutSlot = () => aboutStore.slot
export const setAboutSlot = (el) => { aboutStore.slot = el }
