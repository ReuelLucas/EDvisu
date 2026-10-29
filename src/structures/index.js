// Catálogo de estruturas: cada uma traz seu código C (listing), seus geradores de passos e seus botões.
// group: 'encadeada' (nós + ponteiros, memória dinâmica) ou 'vetor' (array dentro da struct / vetor de ponteiros).
import { circularList } from './circularList';
import { doublyList } from './doublyList';
import { hashTable } from './hashTable';
import { listVet } from './listVet';
import { queue } from './queue';
import { queueVet } from './queueVet';
import { simpleList } from './simpleList';
import { stack } from './stack';
import { stackVet } from './stackVet';

const linked = [simpleList, doublyList, circularList, stack, queue].map((s) => ({ ...s, group: 'encadeada', view: 'linked' }));

export const STRUCTURES = [...linked, listVet, stackVet, queueVet, hashTable];
export const GROUPS = [
  { id: 'encadeada', label: 'Encadeadas' },
  { id: 'vetor', label: 'Vetores' },
];
export const getStructure = (id) => STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
