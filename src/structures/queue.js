// Fila dinâmica (Fila/Fila-dinamica/fila_int.c): enqueue e dequeue.
import {
  DESC_ID, addNode, addressOf, createRecorder, descVar, eid, elemVar, getField, intVar, newNode,
  setField, setPtr, setValor,
} from '../memoryModel';
import { buildBuscaValor, buildRemoveValorSimples, buildDestruirLista } from './valueOps';
import * as listing from './listings/queue';

const descEdge = (field, target) => eid(DESC_ID, field, target);

// enqueue(Fila f, int dado): entra no final
export function buildEnqueue(list, dado) {
  const rec = createRecorder('enqueue', list);
  const newId = `n${list.nextId}`;
  let noDeclared = false;
  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('dado', dado)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada enqueue(f, ${dado}): vamos colocar ${dado} no final da fila.`);
  rec.push('iff', 'f == NULL? Não: o descritor da fila existe.');

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [...rec.order, newId];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);

  rec.state = setValor(rec.state, newId, dado);
  rec.push('setvalor', `no->valor = dado: guarda ${dado} no nó novo.`);

  rec.state = setPtr(rec.state, newId, 'prox', null);
  rec.push('setprox', 'no->prox = NULL: o nó novo será o último da fila.', { edge: eid(newId, 'prox', null) });

  const final = getField(rec.state, 'final');
  if (final === null) {
    rec.push('iffinal', 'f->final == NULL? Sim: a fila está vazia, o nó novo será também o primeiro.');
    rec.state = setField(rec.state, 'inicio', newId);
    rec.floating = {};
    rec.push('setinicio', 'f->inicio = no: o descritor passa a apontar para o nó novo como início da fila.', { edge: descEdge('inicio', newId), field: 'inicio' });
  } else {
    rec.push('iffinal', `f->final == NULL? Não: a fila já tem nós, o novo entra depois do último (${rec.state.nodes[final].valor}).`);
    rec.state = setPtr(rec.state, final, 'prox', newId);
    rec.floating = {};
    rec.push('linkfinal', `f->final->prox = no: o último nó passa a apontar para o nó novo (${dado}).`, { edge: eid(final, 'prox', newId) });
  }

  rec.state = setField(rec.state, 'final', newId);
  rec.push('setfinal', `f->final = no: o descritor passa a apontar para o nó novo como final da fila.`, { edge: descEdge('final', newId), field: 'final' });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `f->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: enqueue concluído com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// dequeue(Fila f): sai do início
export function buildDequeue(list) {
  const rec = createRecorder('dequeue', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let aux = null;
  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada dequeue(f): vamos retirar o primeiro elemento da fila.');

  if (getField(rec.state, 'qtd') === 0) {
    rec.ret('ifguard', 'f == NULL || f->qtd == 0? Sim: a fila está vazia, então a mesma linha já devolve return 1 (erro). Nada é removido.');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', 'f == NULL || f->qtd == 0? Não: a fila tem elementos.');

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', `aux = f->inicio: aux aponta para o primeiro nó (${valorDe(aux)}), o que será removido.`);

  const proximo = rec.state.nodes[aux].prox;
  const removido = valorDe(aux);
  rec.state = setField(rec.state, 'inicio', proximo);
  rec.floating = { [aux]: 'removendo' };
  rec.push(
    'setinicio',
    `f->inicio = aux->prox: o início passa a ser ${proximo === null ? 'NULL' : `o nó ${valorDe(proximo)}`}. O nó ${removido} fica solto.`,
    { edge: descEdge('inicio', proximo), field: 'inicio' },
  );

  if (proximo === null) {
    rec.push('ifvazio', 'f->inicio == NULL? Sim: a fila ficou vazia, então final também precisa virar NULL.');
    rec.state = setField(rec.state, 'final', null);
    rec.push('setfinal', 'f->final = NULL: sem isso, final ficaria apontando para um nó que vai ser liberado.', { edge: descEdge('final', null), field: 'final' });
  } else {
    rec.push('ifvazio', 'f->inicio == NULL? Não: ainda há elementos, final continua igual.');
  }

  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; aux guarda o endereço antigo (ponteiro pendente).`);

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `f->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: dequeue concluído com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

export const queue = {
  id: 'fila',
  label: 'Fila',
  kind: 'fila',
  initialValues: [10, 20, 30, 40], // do início para o final
  listing,
  structs: [
    { key: 'elemento', color: '#374151', cells: [{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'struct elemento*', name: 'inicio' }, { type: 'struct elemento*', name: 'final' }, { type: 'int', name: 'qtd' }] },
  ],
  structNote: 'Fila é um ponteiro para a struct fila. inicio aponta para quem sai primeiro; final aponta para o último, o que torna enqueue direto (sem percorrer).',
  buttons: { withValue: ['enqueue', 'busca_valor', 'remove_valor'], without: ['dequeue', 'destruir'] },
  operations: {
    enqueue: { build: buildEnqueue, needsValue: true },
    dequeue: { build: buildDequeue, needsValue: false },
    busca_valor: { build: buildBuscaValor, needsValue: true },
    remove_valor: { build: buildRemoveValorSimples, needsValue: true },
    destruir: { build: buildDestruirLista, needsValue: false },
  },
};
