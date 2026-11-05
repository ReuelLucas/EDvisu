// Tabelas hash de int (endereçamento aberto): sondagem linear, quadrática e duplo hash. C autoral (tools/autoral/hash_*.c).
import { arrayIdle, createHashOpen } from '../arrayModel';
import { SUFIXO, makeBusca, makeCria, makeInsere, makeRemove, openLibera } from './hashOpenOps';
import * as linearListing from './listings/hashLinear';
import * as quadListing from './listings/hashQuad';
import * as duploListing from './listings/hashDuplo';

const INICIAL = [15, 20, 5];

function make(strategy, label, listing, nota) {
  const suf = SUFIXO[strategy];
  const insere = `insereHash_${suf}`;
  const busca = `buscaHash_${suf}`;
  const remove = `removeHash_${suf}`;
  return {
    id: `hash-${strategy}`,
    group: 'hash',
    label,
    view: 'array',
    type: 'hashOpen',
    input: 'natural',
    initialValues: INICIAL,
    initialNote: nota,
    limitation: 'Código C autoral, escrito a partir dos slides da aula (as funções de sondagem são as dos slides). Confira com o livro do Backes.',
    create: (empty) => createHashOpen(strategy, empty ? [] : INICIAL),
    idle: arrayIdle,
    listing,
    structs: [
      { key: 'desc', color: '#1d4ed8', cells: [{ type: 'int', name: 'qtd' }, { type: 'int', name: 'TABLE_SIZE' }, { type: 'int*', name: 'itens' }] },
    ],
    structNote: 'Hash* aponta para a struct. itens aponta para um vetor de TABLE_SIZE ints. Posição vazia = VAZIO (-1, o "NULL" dos slides) e REMOVIDO = -2; por isso as chaves são inteiros >= 0.',
    buttons: { withValue: [insere, busca, remove], without: ['liberaHash', 'criaHash'] },
    operations: {
      [insere]: { build: makeInsere(strategy), needsValue: true },
      [busca]: { build: makeBusca(strategy), needsValue: true },
      [remove]: { build: makeRemove(strategy), needsValue: true },
      liberaHash: { build: openLibera, needsValue: false },
      criaHash: { build: makeCria(), needsValue: false, onlyWhenDestroyed: true },
    },
  };
}

const base = 'TABLE_SIZE = 11. A posição de origem de cada valor é valor % 11: 15 e 26 caem na posição 4, 20 e 31 na 9.';
export const hashLinear = make('linear', 'Hash: sondagem linear', linearListing,
  `${base} Insira 26: colide com 15 e a sondagem anda de 1 em 1.`);
export const hashQuad = make('quad', 'Hash: sondagem quadrática', quadListing,
  `${base} Em colisão o salto é 2*i + 5*i*i (função dos slides). Insira 26. Esta fórmula repete posições e pode falhar com espaço sobrando.`);
export const hashDuplo = make('duplo', 'Hash: duplo hash', duploListing,
  `${base} Em colisão o salto é H2, um segundo hash da chave. Insira 26 e 37: os dois colidem com 15 mas andam em passos diferentes.`);
