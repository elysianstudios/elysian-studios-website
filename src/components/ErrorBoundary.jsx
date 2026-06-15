import { Component } from 'react'

// Catches render-time errors anywhere in the tree so a crash shows a
// readable message instead of leaving a frozen / blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1rem',
          padding: '2rem', textAlign: 'center', fontFamily: 'var(--sans)',
        }}>
          <h2 style={{ fontFamily: 'var(--serif)' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--ink-muted)', maxWidth: '40ch' }}>
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
