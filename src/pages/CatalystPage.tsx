import { Link, useParams } from 'react-router-dom';
import { CatalystGuideView } from '../components/CatalystGuideView';
import { METAL_CATALYSTS, metalCatalystById } from '../data/metalCatalysts';

/** Übersicht aller Metallkatalysatoren (#/katalysatoren) und Anleitung zu einem (#/katalysator/pd-c) */
export function CatalystPage() {
  const { id } = useParams();
  const catalyst = id ? metalCatalystById(id) : undefined;

  if (id && catalyst) {
    return (
      <main className="page">
        <p className="small">
          <Link to="/katalysatoren">← Alle Metallkatalysatoren</Link>
        </p>
        <div className="card">
          <CatalystGuideView catalyst={catalyst} />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>Metallkatalysatoren</h1>
        <p className="lead">
          {METAL_CATALYSTS.length} Katalysatoren mit Anleitung, wie man sie herstellt – von der Kupferspirale für den
          Schulversuch bis zum Palladiumkomplex für Kreuzkupplungen. Welcher zu einer Reaktion passt, sagt die Werkbank, wenn
          «Metallkatalysator» eingestellt ist.
        </p>
      </div>
      {id && !catalyst && <p className="warning-text">Diesen Katalysator gibt es nicht.</p>}
      <div className="catalyst-list">
        {METAL_CATALYSTS.map((entry) => (
          <Link key={entry.id} to={`/katalysator/${entry.id}`} className="card catalyst-card">
            <strong>{entry.name}</strong>
            <div className="small subtle">
              <span className="mono">{entry.short}</span> · {entry.metal} · {entry.level}
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              {entry.uses[0]}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
