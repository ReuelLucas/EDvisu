// Pilha dinâmica (Pilha/Dinamica/pilha_int.c): push, pop, peek e size.
import {
  DESC_ID, addNode, addressOf, createRecorder, descVar, eid, elemVar, getField, intVar, newNode, outVar,
  setField, setPtr, setValor,
} from '../memoryModel';
import * as listing from './listings/stack';

const topoEdge = (target) => eid(DESC_ID, 'topo', target);

// push(Pilha p, int valor): empilha no topo
export function buildPush(list, valor) {
  const rec = createRecorder('push', list);
  const newId = `n${list.nextId}`;
  let noDeclared = false;
  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada push(p, ${valor}): vamos empilhar ${valor} no topo da pilha.`);
  rec.push('ifp', 'p == NULL? Não: o descritor da pilha existe.');

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [newId, ...rec.order];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(struct elemento)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no == NULL? Não: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  if (getField(rec.state, 'qtd') === 0) {
    rec.push('ifvazia', 'p->qtd == 0? Sim: a pilha está vazia, então não há nó abaixo do novo.');
    rec.state = setPtr(rec.state, newId, 'prox', null);
    rec.push('proxnull', 'no->prox = NULL: o nó novo será o único (a base da pilha).', { edge: eid(newId, 'prox', null) });
  } else {
    rec.push('ifvazia', 'p->qtd == 0? Não: já existem nós, o novo ficará em cima do topo atual.');
    const topo = getField(rec.state, 'topo');
    rec.state = setPtr(rec.state, newId, 'prox', topo);
    rec.push('proxtopo', `no->prox = p->topo: o nó novo passa a apontar para o topo atual (${rec.state.nodes[topo].valor}).`, { edge: eid(newId, 'prox', topo) });
  }

  rec.state = setField(rec.state, 'topo', newId);
  rec.floating = {};
  rec.push('settopo', `p->topo = no: o descritor passa a apontar para o nó novo, que é o novo topo (${valor}).`, { edge: topoEdge(newId), field: 'topo' });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `p->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: push concluído com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// pop(Pilha p): desempilha o topo
export function buildPop(list) {
  const rec = createRecorder('pop', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let aux = null;
  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada pop(p): vamos desempilhar o topo da pilha.');

  auxDeclared = true;
  aux = getField(rec.state, 'topo');
  rec.push('auxinit', aux === null ? 'aux = p->topo: a pilha está vazia, então aux vale NULL.' : `aux = p->topo: aux aponta para o topo atual (${valorDe(aux)}), o nó que será removido.`);

  if (aux === null) {
    rec.push('iftopo', 'p->topo != NULL? Não: a pilha está vazia.');
    rec.ret('ret1', 'return 1: não há o que desempilhar, a função devolve erro (1).');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('iftopo', 'p->topo != NULL? Sim: existe um topo para remover.');

  const proximo = rec.state.nodes[aux].prox;
  const removido = valorDe(aux);
  rec.state = setField(rec.state, 'topo', proximo);
  rec.floating = { [aux]: 'removendo' };
  rec.push(
    'settopo',
    `p->topo = p->topo->prox: o topo passa a ser ${proximo === null ? 'NULL (a pilha ficou vazia)' : `o nó ${valorDe(proximo)}`}. O nó ${removido} fica solto.`,
    { edge: topoEdge(proximo), field: 'topo' },
  );

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `p->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });

  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; aux guarda o endereço antigo (ponteiro pendente).`);

  rec.ret('ret0', 'return 0: pop concluído com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// peek(Pilha p, int *valor): lê o topo sem remover
export function buildPeek(list) {
  const rec = createRecorder('peek', list);
  let out = null;
  rec.makeVars = () => [descVar(rec.state), outVar('valor', out)];

  rec.push('sig', 'Chamada peek(p, &x): vamos ler o topo sem remover. O parâmetro valor aponta para uma variável x do chamador.');
  const topo = getField(rec.state, 'topo');
  if (topo === null) {
    rec.push('ifguard', 'p == NULL || p->topo == NULL? Sim: a pilha está vazia.');
    rec.ret('ret1', 'return 1: não há topo para ler, a função devolve erro (1).');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', 'p == NULL || p->topo == NULL? Não: existe um topo.');
  out = rec.state.nodes[topo].valor;
  rec.push('setvalor', `*valor = p->topo->valor: copia ${out} para a variável do chamador. A pilha não muda.`);
  rec.ret('ret0', `return 0: leitura concluída. O chamador agora tem x = ${out}.`);
  return { steps: rec.steps, list: rec.state };
}

// size(Pilha p): devolve a quantidade
export function buildSize(list) {
  const rec = createRecorder('size', list);
  rec.makeVars = () => [descVar(rec.state)];
  rec.push('sig', 'Chamada size(p): vamos consultar quantos elementos a pilha tem.');
  rec.push('ifp', 'p == NULL? Não: o descritor da pilha existe.');
  const qtd = getField(rec.state, 'qtd');
  rec.ret('ret', `return p->qtd: devolve ${qtd}. Não percorre a pilha: a quantidade já está guardada no descritor.`);
  return { steps: rec.steps, list: rec.state };
}

export const stack = {
  id: 'pilha',
  label: 'Pilha',
  kind: 'pilha',
  initialValues: [40, 30, 20, 10], // do topo para a base
  initialNote: 'Topo à esquerda: o 40 foi o último a ser empilhado.',
  listing,
  structs: [
    { key: 'elemento', color: '#374151', cells: [{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'struct elemento*', name: 'topo' }, { type: 'int', name: 'qtd' }] },
  ],
  structNote: 'Pilha é um ponteiro para a struct pilha (o descritor). O topo é o único ponto de entrada e saída: push e pop mexem só nele.',
  buttons: { withValue: ['push'], without: ['pop', 'peek', 'size'] },
  operations: {
    push: { build: buildPush, needsValue: true },
    pop: { build: buildPop, needsValue: false },
    peek: { build: buildPeek, needsValue: false },
    size: { build: buildSize, needsValue: false },
  },
};
