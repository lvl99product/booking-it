import React, { useState, useRef, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { HomeTab } from './components/HomeTab';
import { HighlightsTab } from './components/HighlightsTab';
import { LibraryTab } from './components/LibraryTab';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';

// ---- SVG Icons ----
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HighlightsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M8 7h8" /><path d="M8 11h6" />
  </svg>
);

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const MoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

type TabId = 'home' | 'highlights' | 'library';

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    handleExport, handleImport,
    showDiscoveryQuotes, toggleDiscoveryQuotes,
    resetToStarter, resetToTestData,
  } = useAppContext();

  // Scroll to top on tab change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Close header menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

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

  // Smoothly scroll focused form fields into view on mobile keyboards
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
        <h1 className="app-logo">Deez Books</h1>
        <div className="header-actions" ref={menuRef}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              handleImport(e);
              e.target.value = '';
              setMenuOpen(false);
            }}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            className="action-btn header-action-btn"
            title="Backup and options"
            aria-label="Backup and options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreIcon />
          </button>

          {menuOpen && (
            <div className="header-menu-popover" role="menu">
              <div className="header-menu-label">Preferences</div>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={showDiscoveryQuotes}
                className="header-menu-item header-menu-toggle"
                onClick={toggleDiscoveryQuotes}
              >
                <span className="header-menu-toggle-text">
                  <span>Discovery quotes</span>
                  <small>Suggest books to read</small>
                </span>
                <span className={`toggle-pill ${showDiscoveryQuotes ? 'on' : ''}`} aria-hidden="true">
                  <span className="toggle-pill-thumb" />
                </span>
              </button>

              <div className="header-menu-divider" />
              <div className="header-menu-label">Backup</div>
              <button
                type="button"
                role="menuitem"
                className="header-menu-item"
                onClick={() => {
                  handleExport();
                  setMenuOpen(false);
                }}
              >
                <ExportIcon />
                <span>Export JSON backup</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="header-menu-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImportIcon />
                <span>Import JSON backup</span>
              </button>

              <div className="header-menu-divider" />
              <div className="header-menu-label">Sample data</div>
              <button
                type="button"
                role="menuitem"
                className="header-menu-item"
                onClick={() => {
                  resetToTestData();
                  setMenuOpen(false);
                }}
              >
                <DatabaseIcon />
                <span>Load sample library</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="header-menu-item"
                onClick={() => {
                  resetToStarter();
                  setMenuOpen(false);
                }}
              >
                <ResetIcon />
                <span>Reset to empty state</span>
              </button>
            </div>
          )}
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
