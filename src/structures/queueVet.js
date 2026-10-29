// Fila estática (Fila/Fila-estatica/fila_int.c): vetor circular dados[MAX] com inicio, final e qtd.
import { arrayIdle, createArray } from '../arrayModel';
import {
  filaAcessar, filaBusca, filaDestruir, filaInserir, filaRemove, filaRemover, filaTamanho,
} from './arrayOps';
import * as listing from './listings/queueVet';

export const queueVet = {
  id: 'filaVet',
  group: 'vetor',
  label: 'Fila (vetor)',
  view: 'array',
  type: 'filaVet',
  initialValues: [10, 20, 30],
  initialNote: 'Vetor circular (MAX = 5): inicio e final "dão a volta" com % MAX. Experimente remover e inserir várias vezes.',
  create: (empty) => createArray('filaVet', empty ? [] : [10, 20, 30]),
  idle: arrayIdle,
  listing,
  structs: [
    {
      key: 'desc', color: '#1d4ed8',
      cells: [{ type: 'int[MAX]', name: 'dados' }, { type: 'int', name: 'inicio' }, { type: 'int', name: 'final' }, { type: 'int', name: 'qtd' }],
    },
  ],
  structNote: 'Fila é um ponteiro para a struct fila. inicio e final são ÍNDICES do vetor (não ponteiros).',
  buttons: { withValue: ['inserir', 'busca_valor', 'remove_valor'], without: ['remover', 'acessar', 'tamanho', 'destruir'] },
  operations: {
    inserir: { build: filaInserir, needsValue: true },
    busca_valor: { build: filaBusca, needsValue: true },
    remove_valor: { build: filaRemove, needsValue: true },
    remover: { build: filaRemover, needsValue: false },
    acessar: { build: filaAcessar, needsValue: false },
    tamanho: { build: filaTamanho, needsValue: false },
    destruir: { build: filaDestruir, needsValue: false },
  },
};
