import { useMemo } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { moleculeSvg } from '../chem/rdkit';

interface Props {
  rdkit: MainModule | null;
  smiles: string;
  width?: number;
  height?: number;
  highlightAtoms?: number[];
  legend?: string;
  /** Alternativtext, falls die Struktur nicht gezeichnet werden kann */
  fallback?: string;
}

/** Zeichnet eine Strukturformel als SVG. */
export function MoleculeStructure({
  rdkit,
  smiles,
  width = 300,
  height = 220,
  highlightAtoms,
  legend,
  fallback,
}: Props) {
  const svg = useMemo(() => {
    if (!rdkit || !smiles) return null;
    return moleculeSvg(rdkit, smiles, { width, height, highlightAtoms, legend });
  }, [rdkit, smiles, width, height, highlightAtoms, legend]);

  if (!svg) {
    return (
      <div className="structure" style={{ minHeight: height }}>
        <span className="subtle mono">{fallback ?? smiles}</span>
      </div>
    );
  }

  return (
    <div
      className="structure"
      role="img"
      aria-label={legend ? `Strukturformel von ${legend}` : `Strukturformel ${smiles}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
