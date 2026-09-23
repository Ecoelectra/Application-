import type { ReactionRule } from '../types';
import { CARBONYL_REACTIONS } from './carbonyl';
import { SUBSTITUTION_REACTIONS } from './substitution';
import { ALKENE_REACTIONS } from './alkene';
import { AROMATIC_REACTIONS } from './aromatic';
import { ELECTROCHEMISTRY_REACTIONS } from './electrochemistry';
import { INORGANIC_REACTIONS } from './inorganic';
import { NAMED_REACTIONS } from './named';
import { TRANSFORM_REACTIONS } from './transform';

export const REACTIONS: ReactionRule[] = [...CARBONYL_REACTIONS, ...SUBSTITUTION_REACTIONS, ...ALKENE_REACTIONS, ...AROMATIC_REACTIONS, ...ELECTROCHEMISTRY_REACTIONS, ...INORGANIC_REACTIONS, ...NAMED_REACTIONS, ...TRANSFORM_REACTIONS];

export const REACTION_BY_ID: ReadonlyMap<string, ReactionRule> = new Map(
  REACTIONS.map((reaction) => [reaction.id, reaction]),
);

export function reactionById(id: string): ReactionRule | undefined {
  return REACTION_BY_ID.get(id);
}
