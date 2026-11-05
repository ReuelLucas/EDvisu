// Lista sequencial (vetor). NÃO existe no repositório do professor: todo o código C é AUTORAL (tools/autoral/lista_vetor.c).
import { arrayIdle, createArray } from '../arrayModel';
import {
  listaBusca, listaDestruir, listaInserirFinal, listaInserirInicio, listaRemove, listaRemoverFinal, listaRemoverInicio, listaTamanho,
} from './arrayOps';
import * as listing from './listings/listVet';

export const listVet = {
  id: 'listaVet',
  group: 'vetor',
  label: 'Lista (vetor)',
  view: 'array',
  type: 'listaVet',
  initialValues: [10, 20, 30, 40],
  initialNote: 'Lista sequencial com MAX = 6. Os elementos ficam juntos no começo do vetor; inserir/remover no início desloca os outros.',
  limitation: 'Esta estrutura não existe no repositório do professor: o código C é autoral (confira com o livro do Backes).',
  create: (empty) => createArray('listaVet', empty ? [] : [10, 20, 30, 40]),
  idle: arrayIdle,
  listing,
  structs: [{ key: 'desc', color: '#1d4ed8', cells: [{ type: 'int[MAX]', name: 'dados' }, { type: 'int', name: 'qtd' }] }],
  structNote: 'Lista é um ponteiro para a struct lista. qtd diz quantas posições do vetor estão em uso.',
  buttons: {
    withValue: ['inserir_inicio', 'inserir_final', 'busca_valor', 'remove_valor'],
    without: ['remover_inicio', 'remover_final', 'tamanho_lista', 'destruir'],
  },
  operations: {
    inserir_inicio: { build: listaInserirInicio, needsValue: true },
    inserir_final: { build: listaInserirFinal, needsValue: true },
    busca_valor: { build: listaBusca, needsValue: true },
    remove_valor: { build: listaRemove, needsValue: true },
    remover_inicio: { build: listaRemoverInicio, needsValue: false },
    remover_final: { build: listaRemoverFinal, needsValue: false },
    tamanho_lista: { build: listaTamanho, needsValue: false },
    destruir: { build: listaDestruir, needsValue: false },
  },
};
