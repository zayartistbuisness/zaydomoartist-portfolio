import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { lockPageScroll } from '../../lib/useLenis'

export default function ReelDialog({ open, onClose }) {
  const dialogRef = useRef(null)
  const videoRef = useRef(null)
  const closeRef = useRef(null)
  const backdropPressRef = useRef(false)
  const [playbackMessage, setPlaybackMessage] = useState('')

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const video = videoRef.current
    const trigger = document.activeElement
    if (!dialog.open) dialog.showModal()
    const unlock = lockPageScroll()

    let active = true
    // No media URL is attached until the visitor explicitly opens the reel.
    video.src = '/reel/reel-web.mp4'
    const playReel = async () => {
      try {
        await video.play()
        if (active) setPlaybackMessage('')
      } catch (error) {
        // Closing aborts a pending play; never retry or force muted playback.
        if (active && error?.name !== 'AbortError') {
          setPlaybackMessage('Playback did not start. Use the video controls to try again.')
        }
      }
    }
    void playReel()

    const close = () => {
      if (!active) return
      active = false
      const hadFocus = dialog.contains(document.activeElement)
      video.pause()
      video.removeAttribute('src')
      video.load()
      if (dialog.open) dialog.close()
      unlock()
      if (trigger?.isConnected && (hadFocus || document.activeElement === document.body)) {
        trigger.focus({ preventScroll: true })
      }
      closeRef.current = null
      backdropPressRef.current = false
    }
    closeRef.current = close
    return close
  }, [open])

  const requestClose = () => closeRef.current?.()
  const isBackdrop = (event) => {
    if (event.target !== event.currentTarget) return false
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
    return event.clientX < left || event.clientX > right ||
      event.clientY < top || event.clientY > bottom
  }

  return (
    <dialog
      ref={dialogRef}
      className="world-reel-dialog"
      aria-labelledby="world-reel-title"
      data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); requestClose() }}
      onClose={(event) => {
        // Ignore a queued close from Strict Mode if the dialog has reopened.
        if (event.currentTarget.open) return
        requestClose()
        setPlaybackMessage('')
        if (open) onClose()
      }}
      onPointerDown={(event) => { backdropPressRef.current = event.button === 0 && isBackdrop(event) }}
      onPointerCancel={() => { backdropPressRef.current = false }}
      onClick={(event) => {
        const dismiss = backdropPressRef.current && isBackdrop(event)
        backdropPressRef.current = false
        if (dismiss) requestClose()
      }}
    >
      <div className="world-reel-panel">
        <div className="world-reel-bar">
          <h2 id="world-reel-title">Zay “Domo” Artist / Acting reel</h2>
          <button type="button" autoFocus onClick={requestClose} aria-label="Close acting reel"><X size={22} /></button>
        </div>
        <video
          ref={videoRef}
          poster={open ? '/reel/reel-poster.jpg' : undefined}
          controls
          playsInline
          preload="none"
          aria-label="Acting reel, self-tape and scene selections"
          onPlay={() => setPlaybackMessage('')}
        />
        {playbackMessage && <p role="status">{playbackMessage}</p>}
        <p>Self-tape &amp; scene selections <span>2026</span></p>
      </div>
    </dialog>
  )
}
