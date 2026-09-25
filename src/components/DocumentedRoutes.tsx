import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MainModule } from '@rdkit/rdkit';
import { structureKey } from '../chem/reactionKeys';
import { isPublishableProduct } from '../chem/safety';
import { describeAgents, knownSubstance, structureName } from '../chem/workbench';
import { reactionsToProduct, type DocumentedReaction } from '../data/documentedReactions';
import { MoleculeStructure } from './MoleculeStructure';

/**
 * Belegte Herstellungswege eines Stoffes aus der Patentliteratur.
 * Im Unterschied zum berechneten Synthesekatalog sind das keine Vorhersagen.
 */
export function DocumentedRoutes({
  rdkit,
  smiles,
  name,
}: {
  rdkit: MainModule | null;
  smiles?: string;
  name: string;
}) {
  const [routes, setRoutes] = useState<DocumentedReaction[] | null>(null);

  useEffect(() => {
    setRoutes(null);
    if (!rdkit || !smiles) return;
    const key = structureKey(rdkit, smiles);
    if (!key) return;
    let cancelled = false;
    reactionsToProduct(key).then((list) => {
      if (!cancelled) setRoutes(list.filter((reaction) => isPublishableProduct(reaction.product, rdkit)).slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [rdkit, smiles]);

  if (!rdkit || !routes?.length) return null;

  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ marginBottom: 4 }}>So wurde {name} tatsächlich hergestellt</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        <span className="badge badge-success">✓ Belegt</span> Wege aus US-Patenten (1976–2016). Anders als die
        berechneten Synthesen weiter unten sind diese Umsetzungen im Labor durchgeführt und beschrieben worden. Die
        Daten wurden automatisch aus den Patenttexten gewonnen und können vereinzelt Fehler enthalten.
      </p>
      <ul className="documented-list">
        {routes.map((reaction) => {
          const educts = reaction.reactants.map((key) => knownSubstance(rdkit, key));
          const allKnown = educts.every(Boolean);
          const reagents = describeAgents(rdkit, reaction.agents);
          return (
            <li key={reaction.id} className="documented-item">
              <div className="row" style={{ gap: 4, justifyContent: 'center' }}>
                {reaction.reactants.slice(0, 2).map((key) => (
                  <MoleculeStructure key={key} rdkit={rdkit} smiles={key} width={58} height={58} />
                ))}
              </div>
              <div style={{ minWidth: 0 }}>
                <div>
                  {reaction.reactants.map((key) => structureName(rdkit, key)).join(' + ')} → <strong>{name}</strong>
                </div>
                <div className="subtle small">
                  {reagents.length > 0 && <>Laut Vorschrift eingesetzt: {reagents.join(', ')} · </>}
                  {reaction.count > 1 ? `${reaction.count} Fundstellen` : '1 Fundstelle'} · Eintrag {reaction.source}
                </div>
                {allKnown && (
                  <Link
                    className="button button-secondary button-small"
                    style={{ marginTop: 6 }}
                    to={`/werkbank?stoffe=${educts.map((educt) => educt?.id).join(',')}`}
                  >
                    In der Werkbank nachstellen
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
