// Tabela hash (Tabela-hash/1_tabela_hash.c): vetor de ponteiros int **itens, sem tratamento de colisão.
import { arrayIdle, createHash } from '../arrayModel';
import {
  hashBusca, hashCria, hashInsereRejeita, hashInsereSobrescreve, hashLibera, hashRemove,
} from './hashOps';
import * as listing from './listings/hash';

export const hashTable = {
  id: 'hash',
  group: 'vetor',
  label: 'Tabela hash',
  view: 'array',
  type: 'hash',
  initialValues: [15, 20, 5],
  initialNote: 'TABLE_SIZE = 11. A posição de cada valor é valor % 11. Tente inserir 26: cai na mesma posição do 15 (colisão).',
  create: (empty) => createHash(empty ? [] : [15, 20, 5]),
  idle: arrayIdle,
  listing,
  structs: [{ key: 'desc', color: '#1d4ed8', cells: [{ type: 'int', name: 'qtd' }, { type: 'int', name: 'TABLE_SIZE' }, { type: 'int**', name: 'itens' }] }],
  structNote: 'Hash* aponta para a struct. itens aponta para um vetor de TABLE_SIZE ponteiros; cada posição é NULL ou aponta para um int no heap.',
  buttons: {
    withValue: ['insereHash_SemColisao_Rejeita', 'insereHash_SemColisao_Sobrescreve', 'buscaHash_SemColisao', 'removeHash_SemColisao'],
    without: ['liberaHash', 'criaHash'],
  },
  operations: {
    insereHash_SemColisao_Rejeita: { build: hashInsereRejeita, needsValue: true },
    insereHash_SemColisao_Sobrescreve: { build: hashInsereSobrescreve, needsValue: true },
    buscaHash_SemColisao: { build: hashBusca, needsValue: true },
    removeHash_SemColisao: { build: hashRemove, needsValue: true },
    liberaHash: { build: hashLibera, needsValue: false },
    criaHash: { build: hashCria, needsValue: false, onlyWhenDestroyed: true },
  },
};
