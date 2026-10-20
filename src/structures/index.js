// Catálogo de estruturas: cada uma traz seu código C (listing), seus geradores de passos e seus botões.
import { circularList } from './circularList';
import { doublyList } from './doublyList';
import { queue } from './queue';
import { simpleList } from './simpleList';
import { stack } from './stack';

export const STRUCTURES = [simpleList, doublyList, circularList, stack, queue];
export const getStructure = (id) => STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
