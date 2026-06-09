/**
 * 通用 Error Boundary
 * - 捕获子树渲染错误，展示降级 UI，避免白屏
 */
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 24, color: '#FF5252' }}>
            <h3>出现错误</h3>
            <p>{this.state.message}</p>
            <button className="btn" onClick={() => location.reload()}>
              重新加载
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
