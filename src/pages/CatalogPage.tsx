import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalog';
import { catalogStats, searchCatalog } from '../data/catalog';
import { SynthesisCard } from '../components/SynthesisCard';
import { formatNumber } from '../chem/format';

const CATEGORIES = [
  { id: '', label: 'Alle' },
  { id: 'organisch', label: 'Organisch' },
  { id: 'anorganisch', label: 'Anorganisch' },
  { id: 'elektrochemie', label: 'Elektrochemie' },
  { id: 'technisch', label: 'Technisch' },
];

const LEVELS = ['', 'Schulversuch', 'Laborpraktikum', 'Fortgeschritten', 'Nur Fachlabor'];

export function CatalogPage() {
  const { catalog, loading } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [namedOnly, setNamedOnly] = useState(true);

  const query = params.get('q') ?? '';

  const results = useMemo(
    () => searchCatalog(catalog, query, { category: category || undefined, level: level || undefined, namedOnly }, 60),
    [catalog, query, category, level, namedOnly],
  );

  const stats = useMemo(() => catalogStats(catalog), [catalog]);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Synthesekatalog</h1>
        <p className="lead">
          Jede Synthese hier ist gerechnet, nicht abgeschrieben: Die Produkte entstehen durch Anwenden
          der hinterlegten Reaktionsvorschriften auf die Stoffe der Datenbank, die anorganischen
          Gleichungen sind exakt ausgeglichen.
        </p>
      </div>

      <div className="card no-print" style={{ marginBottom: 18 }}>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="Nach Produkt, Edukt oder Reaktion suchen – etwa «Aspirin» oder «Silberchlorid»"
          aria-label="Synthesen durchsuchen"
          onChange={(event) => {
            const next = new URLSearchParams(params);
            if (event.target.value) next.set('q', event.target.value);
            else next.delete('q');
            setParams(next, { replace: true });
          }}
        />

        <div className="row" style={{ marginTop: 12 }}>
          {CATEGORIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`chip${category === entry.id ? ' active' : ''}`}
              onClick={() => setCategory(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          {LEVELS.map((entry) => (
            <button
              key={entry || 'alle'}
              type="button"
              className={`chip${level === entry ? ' active' : ''}`}
              onClick={() => setLevel(entry)}
            >
              {entry || 'Jede Einstufung'}
            </button>
          ))}
          <button
            type="button"
            className={`chip${namedOnly ? ' active' : ''}`}
            aria-pressed={namedOnly}
            onClick={() => setNamedOnly((current) => !current)}
            title="Nur Synthesen, deren Produkt in der Stoffdatenbank steht"
          >
            Nur benannte Produkte
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card row">
          <span className="spinner" />
          <span className="muted">Katalog wird geladen …</span>
        </div>
      ) : (
        <>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <p className="muted" style={{ margin: 0 }}>
              {results.length === 60 ? 'Mehr als 60' : results.length} Treffer von insgesamt{' '}
              {formatNumber(stats.total, 0)} Synthesen zu {formatNumber(stats.distinctProducts, 0)}{' '}
              verschiedenen Produkten.
            </p>
          </div>

          {results.length ? (
            <div className="grid grid-2">
              {results.map((synthesis) => (
                <SynthesisCard key={synthesis.id} synthesis={synthesis} />
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <span className="icon">🔍</span>
              <p>
                Keine Synthese gefunden. Versuche einen Stoffnamen wie «Aceton», eine Formel wie «AgCl»
                oder einen Reaktionsnamen wie «Veresterung».
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
