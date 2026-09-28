// DOM → scene hand-off for the Contact chapter (render-free).
export const contactStore = { slot: null }
export const getContactSlot = () => contactStore.slot
export const setContactSlot = (el) => { contactStore.slot = el }
