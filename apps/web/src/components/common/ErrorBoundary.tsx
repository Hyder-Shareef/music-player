import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw, Music2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chong Music Uncaught App Error:', error, errorInfo);
  }

  private handleReload = () => {
    localStorage.removeItem('chong_player_state'); // Clear potentially corrupt state if needed
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #181a24 0%, #08090d 100%)',
            color: '#fff',
            padding: 24,
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #fa233b 0%, #ff5e62 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(250, 35, 59, 0.4)',
              marginBottom: 20,
            }}
          >
            <Music2 size={32} color="#fff" />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px 0' }}>
            Restoring Chong Music
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', maxWidth: 440, margin: '0 0 24px 0', lineHeight: 1.6 }}>
            A temporary display issue occurred. Your library and session are safely stored. Click below to refresh the audio interface.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #fa233b 0%, #d81b31 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(250, 35, 59, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <RotateCw size={16} />
            <span>Reload Audio Interface</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
