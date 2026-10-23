import React from 'react';
import { useTranslation } from 'react-i18next';
import { reportError } from '../lib/errorReport';

/**
 * Catches render-time errors anywhere below it and shows a styled recovery
 * card instead of unmounting the whole app (blank screen). Copy is translated
 * at render time, so it follows the user's language.
 */
export default function ErrorBoundary({ children, message }) {
  const { t } = useTranslation();
  return <BoundaryInner t={t} message={message}>{children}</BoundaryInner>;
}

// A tab left open across a deploy requests chunks that no longer exist. That
// is not a code bug — it needs a reload, not an error card. Detect it, reload
// once per URL, and fall back to the card only if the reload didn't help.
const CHUNK_ERROR = /failed to fetch dynamically imported module|importing a module script failed|loading chunk|chunkloaderror/i;

function isStaleChunkError(error) {
  return error?.name === 'ChunkLoadError' || CHUNK_ERROR.test(String(error?.message || ''));
}

class BoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info?.componentStack);
    reportError(error, { componentStack: info?.componentStack, kind: 'boundary' });

    if (isStaleChunkError(error)) {
      const here = window.location.pathname + window.location.search;
      let alreadyTried = null;
      try { alreadyTried = sessionStorage.getItem('qids-chunk-reload'); } catch { /* private mode */ }
      if (alreadyTried !== here) {
        try { sessionStorage.setItem('qids-chunk-reload', here); } catch { /* private mode */ }
        window.location.reload();
      }
    }
  }

  render() {
    const { t } = this.props;
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full border-[0.5px] border-error/40 bg-surface-container-low p-10 text-center">
          <div className="text-technical-sm font-technical-sm text-error uppercase tracking-[0.2em] mb-4">
            {t('err.title')}
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed mb-8">
            {this.props.message || t('err.default')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => this.setState({ error: null })} className="btn-primary">
              {t('err.retry')}
            </button>
            <button onClick={() => window.location.assign('/app/dashboard')} className="btn-outline">
              {t('err.go_home')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
