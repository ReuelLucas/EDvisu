// Tabela hash com lista encadeada (encadeamento separado). C autoral: tools/autoral/hash_encadeada.c
import { arrayIdle, createHashChain } from '../arrayModel';
import { chainBusca, chainCria, chainInsere, chainLibera, chainRemove } from './hashChainOps';
import * as listing from './listings/hashChain';

const INICIAL = [15, 20, 5, 26];

export const hashChain = {
  id: 'hash-encadeada',
  group: 'hash',
  label: 'Hash: lista encadeada',
  view: 'array',
  type: 'hashChain',
  initialValues: INICIAL,
  initialNote: 'TABLE_SIZE = 11. Cada posição guarda uma LISTA: 15 e 26 caem na posição 4 e ficam na mesma cadeia. Insira 37 (também posição 4) e veja o nó entrar no início.',
  limitation: 'Código C autoral (não está no repositório; só chaveDivisao é do professor). Confira com o livro do Backes.',
  create: (empty) => createHashChain(empty ? [] : INICIAL),
  idle: arrayIdle,
  listing,
  structs: [
    { key: 'elemento', color: '#16a34a', cells: [{ type: 'int', name: 'valor' }, { type: 'No*', name: 'prox' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'int', name: 'qtd' }, { type: 'int', name: 'TABLE_SIZE' }, { type: 'No**', name: 'itens' }] },
  ],
  structNote: 'Hash* aponta para a struct. itens aponta para um vetor de TABLE_SIZE ponteiros; cada posição é NULL (cadeia vazia) ou o primeiro nó de uma lista encadeada.',
  buttons: {
    withValue: ['insereHash_Encadeada', 'buscaHash_Encadeada', 'removeHash_Encadeada'],
    without: ['liberaHash', 'criaHash'],
  },
  operations: {
    insereHash_Encadeada: { build: chainInsere, needsValue: true },
    buscaHash_Encadeada: { build: chainBusca, needsValue: true },
    removeHash_Encadeada: { build: chainRemove, needsValue: true },
    liberaHash: { build: chainLibera, needsValue: false },
    criaHash: { build: chainCria, needsValue: false, onlyWhenDestroyed: true },
  },
};
