import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { ThemeProvider } from './theme.jsx';
import { ToastProvider } from './toast.jsx';
import './styles.css';

class Boundary extends React.Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  render() {
    if (!this.state.e) return this.props.children;
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 420 }}>
          <h3>Something went wrong</h3>
          <p className="mut">{this.state.e.message}</p>
          <button className="btn" onClick={() => location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </Boundary>
  </React.StrictMode>
);
