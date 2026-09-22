import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { HomePage } from './pages/HomePage';
import { SubstancePage } from './pages/SubstancePage';
import { ReactionPage } from './pages/ReactionPage';
import { SearchPage } from './pages/SearchPage';
import { ElectrochemistryPage } from './pages/ElectrochemistryPage';
import { ToolsPage } from './pages/ToolsPage';
import { InfoPage } from './pages/InfoPage';

const NAV_ITEMS = [
  { to: '/', label: 'Start', end: true },
  { to: '/suche', label: 'Reaktionen' },
  { to: '/elektrochemie', label: 'Elektrochemie' },
  { to: '/werkzeuge', label: 'Werkzeuge' },
  { to: '/info', label: 'Hinweise' },
];

export function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <HashRouter>
      <div className="app-shell">
        <header className="topbar">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">⚗</span>
            <span>Synthese&shy;planer</span>
          </NavLink>

          <nav className="nav" aria-label="Hauptnavigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'hell' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'}
            title={theme === 'hell' ? 'Dunkles Design' : 'Helles Design'}
          >
            {theme === 'hell' ? '🌙' : '☀️'}
          </button>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stoff" element={<SubstancePage />} />
          <Route path="/reaktion/:id" element={<ReactionPage />} />
          <Route path="/suche" element={<SearchPage />} />
          <Route path="/elektrochemie" element={<ElectrochemistryPage />} />
          <Route path="/werkzeuge" element={<ToolsPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route
            path="*"
            element={
              <main className="page">
                <div className="empty-state">
                  <span className="icon">🔍</span>
                  <p>Diese Seite gibt es nicht.</p>
                  <NavLink className="button" to="/">
                    Zur Startseite
                  </NavLink>
                </div>
              </main>
            }
          />
        </Routes>
      </div>
    </HashRouter>
  );
}
