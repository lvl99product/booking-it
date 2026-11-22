import React, { useState, useRef, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { HomeTab } from './components/HomeTab';
import { HighlightsTab } from './components/HighlightsTab';
import { LibraryTab } from './components/LibraryTab';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';

// ---- SVG Icons ----
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HighlightsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" /><path d="M6 10h10" /><path d="M6 14h10" />
  </svg>
);

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

type TabId = 'home' | 'highlights' | 'library';

const TAB_LABELS: Record<TabId, string> = {
  home: 'Booking It',
  highlights: 'Highlights',
  library: 'Library',
};

// Inner shell that consumes context (needed because AppProvider wraps it)
import { useAppContext } from './context/AppContext';

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const mainRef = useRef<HTMLElement>(null);
  const { handleExport, handleImport, resetToStarter, resetToTestData } = useAppContext();

  // Scroll to top on tab change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Handle virtual keyboard viewport adjustments on mobile
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (vv && window.innerWidth < 480) {
        setViewportStyle({
          height: `${vv.height}px`,
          top: `${vv.offsetTop}px`,
          position: 'absolute',
        });
      } else {
        setViewportStyle({});
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Smoothly scroll focused form fields into the center of the viewport to prevent virtual keyboard obstruction
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isInput) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'highlights', label: 'Highlights', icon: <HighlightsIcon /> },
    { id: 'library', label: 'Library', icon: <LibraryIcon /> },
  ];

  return (
    <div className="app-container" style={viewportStyle}>
      <header className="app-header">
        <h1 className="app-logo">{TAB_LABELS[activeTab]}</h1>
        <div className="header-actions">
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'starter') {
                resetToStarter();
              } else if (val === 'test-data') {
                resetToTestData();
              }
              e.target.value = "";
            }}
            defaultValue=""
            className="testing-select"
            aria-label="App testing states selector"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              outline: 'none',
              marginRight: 'var(--space-4)',
            }}
          >
            <option value="" disabled>⚙️ Test State...</option>
            <option value="starter">🧹 Wipe to Starter</option>
            <option value="test-data">📚 Load Test Data</option>
          </select>

          <button
            onClick={handleExport}
            className="action-btn header-action-btn"
            title="Export backup"
            aria-label="Export data backup"
          >
            <ExportIcon />
          </button>
          <label
            className="action-btn header-action-btn"
            title="Import backup"
            aria-label="Import data backup"
            style={{ cursor: 'pointer' }}
          >
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <ImportIcon />
          </label>
        </div>
      </header>

      <main className="main-content" ref={mainRef}>
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'highlights' && <HighlightsTab />}
        {activeTab === 'library' && <LibraryTab />}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
