import { useEffect, useState } from 'react';
import { loadReactionModel, type ReactionModel } from '../chem/ai/model';

export type ModelStatus = 'laden' | 'bereit' | 'fehlt';

/** Lädt das Modell der Reaktions-KI einmalig (rund 1 MB, danach offline). */
export function useReactionModel(): { model: ReactionModel | null; status: ModelStatus } {
  const [state, setState] = useState<{ model: ReactionModel | null; status: ModelStatus }>({ model: null, status: 'laden' });
  useEffect(() => {
    let active = true;
    loadReactionModel().then((model) => {
      if (active) setState({ model, status: model ? 'bereit' : 'fehlt' });
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
