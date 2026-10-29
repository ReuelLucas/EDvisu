// Pilha estática (Pilha/Estatica/pilha_int.c): vetor dados[MAX] dentro da struct; topo = quantidade.
import { arrayIdle, createArray } from '../arrayModel';
import {
  pilhaBusca, pilhaDestruir, pilhaPeek, pilhaPop, pilhaPush, pilhaRemove, pilhaTamanho,
} from './arrayOps';
import * as listing from './listings/stackVet';

export const stackVet = {
  id: 'pilhaVet',
  group: 'vetor',
  label: 'Pilha (vetor)',
  view: 'array',
  type: 'pilhaVet',
  initialValues: [10, 20],
  initialNote: 'dados[0] é a base. topo aponta para a PRÓXIMA posição livre (e também é a quantidade). MAX = 3.',
  create: (empty) => createArray('pilhaVet', empty ? [] : [10, 20]),
  idle: arrayIdle,
  listing,
  structs: [{ key: 'desc', color: '#1d4ed8', cells: [{ type: 'int[MAX]', name: 'dados' }, { type: 'int', name: 'topo' }] }],
  structNote: 'Pilha é um ponteiro para a struct pilha. O vetor dados mora DENTRO da struct: um único malloc/free cuida de tudo.',
  buttons: { withValue: ['push', 'busca_valor', 'remove_valor'], without: ['pop', 'peek', 'tamanho_pilha', 'destruir_pilha'] },
  operations: {
    push: { build: pilhaPush, needsValue: true },
    busca_valor: { build: pilhaBusca, needsValue: true },
    remove_valor: { build: pilhaRemove, needsValue: true },
    pop: { build: pilhaPop, needsValue: false },
    peek: { build: pilhaPeek, needsValue: false },
    tamanho_pilha: { build: pilhaTamanho, needsValue: false },
    destruir_pilha: { build: pilhaDestruir, needsValue: false },
  },
};
