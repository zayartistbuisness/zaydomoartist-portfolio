import { Component } from 'react'

/**
 * Contains a failure to one chapter: if a chapter's DOM or 3D scene throws
 * (or WebGL fails for it), the rest of the site keeps working and the
 * chapter simply renders nothing.
 */
export default class ChapterBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error(`[chapter ${this.props.id}]`, error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
