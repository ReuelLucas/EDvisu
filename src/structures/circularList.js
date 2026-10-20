// Lista circular (Lista/Lista-Unicamente-Encadeada-Circular/lista_int.c).
// O descritor guarda só `final`; o primeiro nó é final->prox, e o último aponta de volta para o primeiro.
// Na disciplina só inserir_inicio e inserir_final estão implementadas (as demais são funções vazias).
import {
  DESC_ID, addNode, addressOf, createRecorder, descVar, eid, elemVar, getField, intVar, newNode,
  setField, setPtr, setValor,
} from '../memoryModel';
import * as listing from './listings/circularList';

const finalEdge = (target) => eid(DESC_ID, 'final', target);

// inserir_inicio(Lista li, int valor)
export function buildInserirInicio(list, valor) {
  const rec = createRecorder('inserir_inicio', list);
  const newId = `n${list.nextId}`;
  let noDeclared = false;
  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada inserir_inicio(li, ${valor}): vamos colocar ${valor} como primeiro nó do anel.`);

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [newId, ...rec.order];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no != NULL? Sim: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  const final = getField(rec.state, 'final');
  if (final === null) {
    rec.push('ifvazia', 'li->final == NULL? Sim: o anel está vazio, o nó novo será o único.');
    rec.state = setPtr(rec.state, newId, 'prox', newId);
    rec.push('selfprox', 'no->prox = no: com um único nó, ele aponta para si mesmo (o anel fecha sobre ele).', { edge: eid(newId, 'prox', newId) });
    rec.state = setField(rec.state, 'final', newId);
    rec.floating = {};
    rec.push('setfinal', 'li->final = no: o descritor aponta para o nó novo, que é ao mesmo tempo primeiro e último.', { edge: finalEdge(newId), field: 'final' });
  } else {
    const primeiro = rec.state.nodes[final].prox;
    rec.push('ifvazia', 'li->final == NULL? Não: o anel já tem nós.');
    rec.state = setPtr(rec.state, newId, 'prox', primeiro);
    rec.push('setprox', `no->prox = li->final->prox: o nó novo passa a apontar para o atual primeiro nó (${rec.state.nodes[primeiro].valor}).`, { edge: eid(newId, 'prox', primeiro) });
    rec.state = setPtr(rec.state, final, 'prox', newId);
    rec.floating = {};
    rec.push('finalprox', `li->final->prox = no: o último nó (${rec.state.nodes[final].valor}) agora aponta para o nó novo, que passa a ser o primeiro. O final não muda.`, { edge: eid(final, 'prox', newId) });
  }

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: inserção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// inserir_final(Lista li, int valor)
export function buildInserirFinal(list, valor) {
  const rec = createRecorder('inserir_final', list);
  const newId = `n${list.nextId}`;
  let noDeclared = false;
  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada inserir_final(li, ${valor}): vamos colocar ${valor} como último nó do anel.`);
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [...rec.order, newId];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no == NULL? Não: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  const final = getField(rec.state, 'final');
  if (final === null) {
    rec.push('ifvazia', 'li->final == NULL? Sim: o anel está vazio, o nó novo será o único.');
    rec.state = setField(rec.state, 'final', newId);
    rec.floating = {};
    rec.push('setfinal', 'li->final = no: o descritor aponta para o nó novo. O prox dele ainda é lixo (?).', { edge: finalEdge(newId), field: 'final' });
    rec.state = setPtr(rec.state, newId, 'prox', newId);
    rec.push('selfprox', 'no->prox = no: com um único nó, ele aponta para si mesmo (o anel fecha sobre ele).', { edge: eid(newId, 'prox', newId) });
  } else {
    const primeiro = rec.state.nodes[final].prox;
    rec.push('ifvazia', 'li->final == NULL? Não: o anel já tem nós.');
    rec.state = setPtr(rec.state, newId, 'prox', primeiro);
    rec.push('setprox', `no->prox = li->final->prox: o nó novo passa a apontar para o primeiro nó (${rec.state.nodes[primeiro].valor}), fechando o anel.`, { edge: eid(newId, 'prox', primeiro) });
    rec.state = setPtr(rec.state, final, 'prox', newId);
    rec.floating = {};
    rec.push('finalprox', `li->final->prox = no: o último nó atual (${rec.state.nodes[final].valor}) passa a apontar para o nó novo.`, { edge: eid(final, 'prox', newId) });
    rec.state = setField(rec.state, 'final', newId);
    rec.push('setfinal2', 'li->final = no: o descritor passa a apontar para o nó novo, que agora é o último.', { edge: finalEdge(newId), field: 'final' });
  }

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: inserção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

export const circularList = {
  id: 'circular',
  label: 'Lista circular',
  kind: 'circular',
  initialValues: [10, 20, 30, 40],
  listing,
  structs: [
    { key: 'elemento', color: '#374151', cells: [{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'Elem*', name: 'final' }, { type: 'int', name: 'qtd' }] },
  ],
  structNote: 'O descritor guarda só final. O primeiro nó é final->prox, e o prox do último volta para o primeiro: não existe NULL no meio do anel.',
  limitation: 'No repositório da disciplina, só inserir_inicio e inserir_final estão implementadas; remover_*, acessar_* e destruir ainda são funções vazias.',
  buttons: { withValue: ['inserir_inicio', 'inserir_final'], without: [] },
  operations: {
    inserir_inicio: { build: buildInserirInicio, needsValue: true },
    inserir_final: { build: buildInserirFinal, needsValue: true },
  },
};
