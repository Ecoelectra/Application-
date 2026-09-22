import { Link } from 'react-router-dom';
import type { ReactionRule } from '../data/types';
import { functionalGroupName } from '../data/functionalGroups';

interface Props {
  rule: ReactionRule;
  score?: number;
  matchedGroups?: string[];
  products?: string[];
  reason?: string;
  /** Substrat, das beim Öffnen der Reaktion mitgegeben wird */
  substrate?: string;
}

/** Vorschlags- und Trefferkarte für eine Reaktion. */
export function ReactionCard({ rule, score, matchedGroups, products, reason, substrate }: Props) {
  const target = substrate
    ? `/reaktion/${rule.id}?substrat=${encodeURIComponent(substrate)}`
    : `/reaktion/${rule.id}`;

  return (
    <Link to={target} className="reaction-card">
      <div className="row-between" style={{ marginBottom: 4 }}>
        <h3>{rule.name}</h3>
        <span className={`badge badge-${rule.category}`}>{rule.category}</span>
      </div>

      <div className="subtle">{rule.reactionType}</div>
      <p className="summary">{rule.summary}</p>

      {products && products.length > 0 && (
        <div className="small" style={{ marginBottom: 8 }}>
          <span className="muted">Produkt: </span>
          <code>{products.slice(0, 2).join(' + ')}</code>
        </div>
      )}

      <div className="row" style={{ gap: 6 }}>
        {(matchedGroups ?? []).slice(0, 3).map((id) => (
          <span key={id} className="badge">
            {functionalGroupName(id)}
          </span>
        ))}
        {rule.electro && <span className="badge badge-elektrochemie">Elektrolyse</span>}
      </div>

      {reason && (
        <p className="subtle" style={{ marginTop: 8, marginBottom: 0 }}>
          {reason}
        </p>
      )}

      {score !== undefined && (
        <div className="score-bar" aria-label={`Passgenauigkeit ${score}`}>
          <span style={{ width: `${Math.min(100, Math.max(8, score))}%` }} />
        </div>
      )}
    </Link>
  );
}
