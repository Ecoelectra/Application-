import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { MetalCatalyst } from '../data/metalCatalysts';
import { CatalystGuideView } from './CatalystGuideView';

/** Anleitung als Fenster über der Werkbank – das Reaktionsgefäß bleibt erhalten */
export function CatalystDialog({
  catalyst,
  onClose,
  onAddToVessel,
}: {
  catalyst: MetalCatalyst;
  onClose: () => void;
  onAddToVessel?: (catalyst: MetalCatalyst) => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    closeButton.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-label={`Anleitung: ${catalyst.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="row-between dialog-bar">
          <Link className="small" to={`/katalysator/${catalyst.id}`}>
            Als eigene Seite öffnen
          </Link>
          <button ref={closeButton} type="button" className="icon-button" aria-label="Anleitung schließen" onClick={onClose}>
            ×
          </button>
        </div>
        <CatalystGuideView
          catalyst={catalyst}
          headingLevel={2}
          onAddToVessel={
            onAddToVessel
              ? (entry) => {
                  onAddToVessel(entry);
                  onClose();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
