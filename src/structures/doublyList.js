// Lista duplamente encadeada (Lista/Lista-Duplamente-Encadeada/lista_int.c).
// Cada nó tem prox e ant; o descritor guarda inicio, final e qtd.
import {
  DESC_ID, addNode, addressOf, createRecorder, descVar, eid, elemVar, getField, intVar, newNode,
  setField, setPtr, setValor,
} from '../memoryModel';
import { buildTamanhoLista } from './listCommon';
import * as listing from './listings/doublyList';

const descEdge = (field, target) => eid(DESC_ID, field, target);

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

  rec.push('sig', `Chamada inserir_inicio(li, ${valor}): vamos colocar ${valor} no início da lista.`);

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [newId, ...rec.order];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no != NULL? Sim: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  const primeiro = getField(rec.state, 'inicio');
  rec.state = setPtr(rec.state, newId, 'prox', primeiro);
  rec.push('setprox', `no->prox = li->inicio: o nó novo aponta para ${primeiro === null ? 'NULL (a lista estava vazia)' : `o atual primeiro nó (${rec.state.nodes[primeiro].valor})`}.`, { edge: eid(newId, 'prox', primeiro) });

  rec.state = setPtr(rec.state, newId, 'ant', null);
  rec.push('setant', 'no->ant = NULL: o nó novo será o primeiro, então não tem anterior.', { edge: eid(newId, 'ant', null) });

  if (primeiro !== null) {
    rec.push('ifinicio', 'li->inicio != NULL? Sim: já existe um primeiro nó, ele precisa apontar de volta para o novo.');
    rec.state = setPtr(rec.state, primeiro, 'ant', newId);
    rec.push('antinicio', `li->inicio->ant = no: o antigo primeiro (${rec.state.nodes[primeiro].valor}) passa a ter o nó novo como anterior.`, { edge: eid(primeiro, 'ant', newId) });
  } else {
    rec.push('ifinicio', 'li->inicio != NULL? Não: a lista estava vazia, então o nó novo também será o último.');
    rec.state = setField(rec.state, 'final', newId);
    rec.push('setfinal', 'li->final = no: o descritor aponta o final para o nó novo.', { edge: descEdge('final', newId), field: 'final' });
  }

  rec.state = setField(rec.state, 'inicio', newId);
  rec.floating = {};
  rec.push('setinicio', 'li->inicio = no: o descritor passa a apontar para o nó novo, que agora é o primeiro.', { edge: descEdge('inicio', newId), field: 'inicio' });

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

  rec.push('sig', `Chamada inserir_final(li, ${valor}): vamos colocar ${valor} no final da lista.`);
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [...rec.order, newId];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no == NULL? Não: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  rec.state = setPtr(rec.state, newId, 'prox', null);
  rec.push('setprox', 'no->prox = NULL: o nó novo será o último.', { edge: eid(newId, 'prox', null) });

  const final = getField(rec.state, 'final');
  rec.state = setPtr(rec.state, newId, 'ant', final);
  rec.push('setant', `no->ant = li->final: o anterior do nó novo é ${final === null ? 'NULL (a lista estava vazia)' : `o atual último nó (${rec.state.nodes[final].valor})`}.`, { edge: eid(newId, 'ant', final) });

  if (final !== null) {
    rec.push('iffinal', 'li->final != NULL? Sim: o último nó atual precisa apontar para o novo.');
    rec.state = setPtr(rec.state, final, 'prox', newId);
    rec.floating = {};
    rec.push('finalprox', `li->final->prox = no: o último nó atual (${rec.state.nodes[final].valor}) passa a apontar para o nó novo.`, { edge: eid(final, 'prox', newId) });
  } else {
    rec.push('iffinal', 'li->final != NULL? Não: a lista estava vazia, então o nó novo também será o primeiro.');
    rec.state = setField(rec.state, 'inicio', newId);
    rec.floating = {};
    rec.push('setinicio', 'li->inicio = no: o descritor aponta o início para o nó novo.', { edge: descEdge('inicio', newId), field: 'inicio' });
  }

  rec.state = setField(rec.state, 'final', newId);
  rec.push('setfinal', 'li->final = no: o descritor passa a apontar para o nó novo, que agora é o último.', { edge: descEdge('final', newId), field: 'final' });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: inserção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// remover_inicio(Lista li)
export function buildRemoverInicio(list) {
  const rec = createRecorder('remover_inicio', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let noDeclared = false;
  let no = null;
  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (noDeclared) vars.push(elemVar('no', no, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada remover_inicio(li): vamos retirar o primeiro nó da lista.');

  if (getField(rec.state, 'inicio') === null) {
    rec.push('ifvazio', 'li->inicio == NULL? Sim: a lista está vazia.');
    rec.ret('ret1', 'return 1: não há o que remover, a função devolve erro (1).');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifvazio', 'li->inicio == NULL? Não: a lista tem pelo menos um nó.');

  noDeclared = true;
  no = getField(rec.state, 'inicio');
  rec.push('no', `no = li->inicio: no aponta para o primeiro nó (${valorDe(no)}), o que será removido.`);

  const proximo = rec.state.nodes[no].prox;
  const removido = valorDe(no);
  rec.state = setField(rec.state, 'inicio', proximo);
  rec.floating = { [no]: 'removendo' };
  rec.push('setinicio', `li->inicio = no->prox: o descritor passa a apontar para ${proximo === null ? 'NULL' : `o nó ${valorDe(proximo)}`}. O nó ${removido} fica solto.`, { edge: descEdge('inicio', proximo), field: 'inicio' });

  if (proximo === null) {
    // BUG do código original: li->inicio é NULL e a linha seguinte o desreferencia.
    rec.push(
      'antnull',
      `li->inicio->ant = NULL: li->inicio vale NULL, então esta linha acessa NULL->ant. No C isso causa falha de segmentação (segfault) e o programa termina aqui. O código da disciplina só funciona ao remover quando a lista tem 2 ou mais nós. A lista foi restaurada para você continuar.`,
      { crash: true },
    );
    return { steps: rec.steps, list };
  }

  rec.state = setPtr(rec.state, proximo, 'ant', null);
  rec.push('antnull', `li->inicio->ant = NULL: o novo primeiro nó (${valorDe(proximo)}) deixa de apontar para o nó removido.`, { edge: eid(proximo, 'ant', null) });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });

  rec.free(no);
  rec.push('free', `free(no): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; no guarda o endereço antigo (ponteiro pendente).`);

  rec.ret('ret0', 'return 0: remoção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// remover_final(Lista li)
export function buildRemoverFinal(list) {
  const rec = createRecorder('remover_final', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let noDeclared = false;
  let no = null;
  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (noDeclared) vars.push(elemVar('no', no, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada remover_final(li): vamos retirar o último nó da lista.');

  const qtd = getField(rec.state, 'qtd');
  if (getField(rec.state, 'inicio') === null || qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->inicio == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover, a função devolve erro (1).');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', 'li == NULL || li->inicio == NULL || li->qtd == 0? Não: a lista tem nós.');

  noDeclared = true;
  no = getField(rec.state, 'final');
  rec.push('no', `no = li->final: no aponta para o último nó (${valorDe(no)}), o que será removido.`);

  const anterior = rec.state.nodes[no].ant;
  const removido = valorDe(no);
  rec.state = setField(rec.state, 'final', anterior);
  rec.floating = { [no]: 'removendo' };
  rec.push('setfinal', `li->final = no->ant: o descritor passa a apontar o final para ${anterior === null ? 'NULL' : `o nó ${valorDe(anterior)}`}. O nó ${removido} fica solto.`, { edge: descEdge('final', anterior), field: 'final' });

  if (anterior !== null) {
    rec.push('iffinal', 'li->final != NULL? Sim: o novo último nó ainda aponta para o removido.');
    rec.state = setPtr(rec.state, anterior, 'prox', null);
    rec.push('proxnull', `li->final->prox = NULL: o nó ${valorDe(anterior)} passa a ser o último.`, { edge: eid(anterior, 'prox', null) });
  } else {
    rec.push('iffinal', 'li->final != NULL? Não: a lista ficou vazia, então inicio também precisa virar NULL.');
    rec.state = setField(rec.state, 'inicio', null);
    rec.push('inicionull', 'li->inicio = NULL: a lista agora está vazia.', { edge: descEdge('inicio', null), field: 'inicio' });
  }

  rec.state = setField(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });

  rec.free(no);
  rec.push('free', `free(no): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; no guarda o endereço antigo (ponteiro pendente).`);

  rec.ret('ret0', 'return 0: remoção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

export const doublyList = {
  id: 'dupla',
  label: 'Lista dupla',
  kind: 'dupla',
  initialValues: [10, 20, 30, 40],
  listing,
  structs: [
    { key: 'elemento', color: '#374151', cells: [{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }, { type: 'struct elemento*', name: 'ant' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'Elem*', name: 'inicio' }, { type: 'Elem*', name: 'final' }, { type: 'int', name: 'qtd' }] },
  ],
  structNote: 'Cada nó aponta para o próximo e para o anterior. O descritor guarda inicio e final, então inserir e remover nas duas pontas não precisa percorrer a lista.',
  limitation: 'remover_inicio com um único nó trava no código original (NULL->ant). O visualizador mostra o travamento em vez de esconder o erro.',
  buttons: { withValue: ['inserir_inicio', 'inserir_final'], without: ['remover_inicio', 'remover_final', 'tamanho_lista'] },
  operations: {
    inserir_inicio: { build: buildInserirInicio, needsValue: true },
    inserir_final: { build: buildInserirFinal, needsValue: true },
    remover_inicio: { build: buildRemoverInicio, needsValue: false },
    remover_final: { build: buildRemoverFinal, needsValue: false },
    tamanho_lista: { build: buildTamanhoLista, needsValue: false },
  },
};
