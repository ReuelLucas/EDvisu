// Tabela hash SEM colisão com vetor de char. C autoral (tools/autoral/hash_char.c); chaveDivisao é do repositório.
import { arrayIdle, createHashChar } from '../arrayModel';
import { charBusca, charCria, charInsereRejeita, charInsereSobrescreve, charLibera, charRemove } from './hashCharOps';
import * as listing from './listings/hashChar';

const INICIAL = ['a', 'b', 'c'];

export const hashTable = {
  id: 'hash',
  group: 'hash',
  label: 'Hash: vetor de char',
  view: 'array',
  type: 'hashChar',
  input: 'char',
  initialValues: INICIAL,
  initialNote: 'TABLE_SIZE = 11, sem tratamento de colisão. A posição de cada char é (código ASCII) % 11. "a" (97) e "l" (108) caem na posição 9: insira "l" e veja a colisão.',
  limitation: 'Código C autoral: a hash do repositório guarda int*; esta versão guarda char no vetor. Confira com o livro do Backes.',
  create: (empty) => createHashChar(empty ? [] : INICIAL),
  idle: arrayIdle,
  listing,
  structs: [{ key: 'desc', color: '#1d4ed8', cells: [{ type: 'int', name: 'qtd' }, { type: 'int', name: 'TABLE_SIZE' }, { type: 'char*', name: 'itens' }] }],
  structNote: "Hash* aponta para a struct. itens aponta para um vetor de TABLE_SIZE chars; cada posição guarda um char ou '\\0' (vazia).",
  buttons: {
    withValue: ['insereHash_SemColisao_Rejeita', 'insereHash_SemColisao_Sobrescreve', 'buscaHash_SemColisao', 'removeHash_SemColisao'],
    without: ['liberaHash', 'criaHash'],
  },
  operations: {
    insereHash_SemColisao_Rejeita: { build: charInsereRejeita, needsValue: true },
    insereHash_SemColisao_Sobrescreve: { build: charInsereSobrescreve, needsValue: true },
    buscaHash_SemColisao: { build: charBusca, needsValue: true },
    removeHash_SemColisao: { build: charRemove, needsValue: true },
    liberaHash: { build: charLibera, needsValue: false },
    criaHash: { build: charCria, needsValue: false, onlyWhenDestroyed: true },
  },
};
