import { useMemo, type ReactElement } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles } from '../chem/rdkit';
import { MoleculeStructure } from './MoleculeStructure';

interface Props {
  rdkit: MainModule | null;
  /** Reaktions-SMILES der Form "Edukte>Reagenzien>Produkte" oder "Edukte>>Produkte" */
  rxnSmiles?: string;
  /** Textform der Gleichung als Rückfallebene und Beschriftung */
  text: string;
  width?: number;
  height?: number;
  caption?: string;
}

interface ParsedReaction {
  reactants: string[];
  agents: string[];
  products: string[];
}

/** Zerlegt ein Reaktions-SMILES in seine Bestandteile. */
function parseReactionSmiles(rxnSmiles: string): ParsedReaction | null {
  const parts = rxnSmiles.split('>');
  if (parts.length < 2) return null;

  const split = (text: string): string[] =>
    text
      .split('.')
      .map((entry) => entry.trim())
      .filter(Boolean);

  if (parts.length === 2) {
    return { reactants: split(parts[0]), agents: [], products: split(parts[1]) };
  }
  return {
    reactants: split(parts[0]),
    agents: split(parts[1]),
    products: split(parts[parts.length - 1]),
  };
}

/**
 * Stellt eine Reaktionsgleichung als Folge von Strukturformeln dar.
 *
 * Die Strukturen werden einzeln gezeichnet und mit «+» und «→» verbunden.
 * RDKits eingebaute Reaktionsdarstellung wird bewusst nicht verwendet: Sie
 * zeichnet Reaktionstemplates ohne Atommarkierung blass und gestrichelt.
 */
export function ReactionEquation({ rdkit, rxnSmiles, text, height = 150, caption }: Props) {
  const parsed = useMemo(() => {
    if (!rdkit || !rxnSmiles) return null;
    const reaction = parseReactionSmiles(rxnSmiles);
    if (!reaction) return null;
    // Nur zeichnen, wenn sich alle Bestandteile lesen lassen
    const readable = [...reaction.reactants, ...reaction.products].every(
      (smiles) => canonicalSmiles(rdkit, smiles) !== null,
    );
    return readable ? reaction : null;
  }, [rdkit, rxnSmiles]);

  if (!parsed) {
    return (
      <figure style={{ margin: 0 }}>
        <div className="equation-scroll">
          <div className="equation-text">{text}</div>
        </div>
        {caption && (
          <figcaption className="subtle" style={{ marginTop: 6 }}>
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const structureWidth = Math.max(140, Math.min(240, 900 / Math.max(3, parsed.reactants.length + parsed.products.length)));

  const renderSide = (molecules: string[]): ReactElement[] =>
    molecules.flatMap((smiles, index) => {
      const elements = [
        <MoleculeStructure
          key={`${smiles}-${index}`}
          rdkit={rdkit}
          smiles={smiles}
          width={structureWidth}
          height={height}
        />,
      ];
      if (index < molecules.length - 1) {
        elements.push(
          <span key={`plus-${smiles}-${index}`} className="equation-operator">
            +
          </span>,
        );
      }
      return elements;
    });

  return (
    <figure style={{ margin: 0 }}>
      <div className="equation-scroll">
        <div className="equation-row">
          {renderSide(parsed.reactants)}
          <span className="equation-arrow" aria-label="reagiert zu">
            {parsed.agents.length > 0 && (
              <span className="equation-agents mono">{parsed.agents.join(' + ')}</span>
            )}
            →
          </span>
          {renderSide(parsed.products)}
        </div>
      </div>
      <div className="equation-scroll">
        <div className="equation-text">{text}</div>
      </div>
      {caption && (
        <figcaption className="subtle" style={{ marginTop: 6 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
