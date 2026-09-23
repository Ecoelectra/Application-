import { Link } from 'react-router-dom';
import type { Synthesis } from '../data/catalog';

/** Zeigt eine konkrete Synthese als Karte: Produkt, Weg und Bedingungen. */
export function SynthesisCard({ synthesis }: { synthesis: Synthesis }) {
  const educts = [...synthesis.educts.map((educt) => educt.name), ...synthesis.otherEducts];

  return (
    <article className="card synthesis-card">
      <div className="card-title">
        <div>
          <h3 style={{ marginBottom: 2 }}>
            {synthesis.productId ? (
              <Link to={`/stoff?name=${encodeURIComponent(synthesis.product)}`}>{synthesis.product}</Link>
            ) : (
              synthesis.product
            )}
          </h3>
          <div className="subtle">{synthesis.ruleName}</div>
        </div>
        <span
          className={`badge badge-${
            synthesis.category === 'anorganisch'
              ? 'anorganisch'
              : synthesis.category === 'elektrochemie'
                ? 'elektrochemie'
                : 'organisch'
          }`}
        >
          {synthesis.category}
        </span>
      </div>

      <p className="small" style={{ marginBottom: 8 }}>
        <span className="muted">aus </span>
        {educts.map((name, index) => (
          <span key={name}>
            {index > 0 && <span className="muted"> + </span>}
            <Link to={`/stoff?name=${encodeURIComponent(name)}`}>{name}</Link>
          </span>
        ))}
      </p>

      <div className="equation-scroll">
        <div className="equation-text">{synthesis.equation}</div>
      </div>

      <dl className="definition-list" style={{ marginTop: 10 }}>
        <dt>Bedingungen</dt>
        <dd>{synthesis.conditions}</dd>
        <dt>Einstufung</dt>
        <dd>{synthesis.safetyLevel}</dd>
      </dl>

      {synthesis.ruleId && (
        <Link className="button button-secondary button-small" to={`/reaktion/${synthesis.ruleId}`}>
          Anleitung und Mechanismus
        </Link>
      )}
    </article>
  );
}
