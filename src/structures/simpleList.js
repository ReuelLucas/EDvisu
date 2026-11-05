// Lista unicamente encadeada (Lista/Lista-Unicamente-Encadeada/lista_int.c): um gerador de passos por função C.
import {
  DESC_ID, addNode, createRecorder, descVar, eid, elemVar, getField, intVar, newNode,
  addressOf, setField, setPtr, setValor,
} from '../memoryModel';
import { buildTamanhoLista } from './listCommon';
import { buildBuscaValor, buildRemoveValorSimples, buildDestruirLista } from './valueOps';
import * as listing from './listings/simpleList';

const descEdge = (target) => eid(DESC_ID, 'inicio', target);

// ---------- inserir_inicio(Lista li, int valor) ----------

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

  // Elem* no = malloc(sizeof(Elem));   (o nó novo abre espaço na posição 0, mas ainda não está ligado)
  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [newId, ...rec.order];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem na memória (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no != NULL? Sim: a alocação deu certo, então podemos preencher o nó.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  const primeiro = getField(rec.state, 'inicio');
  rec.state = setPtr(rec.state, newId, 'prox', primeiro);
  rec.push(
    'setprox',
    `no->prox = li->inicio: o nó novo passa a apontar para ${primeiro === null ? 'NULL (a lista estava vazia)' : `o que hoje é o primeiro nó (${rec.state.nodes[primeiro].valor})`}.`,
    { edge: eid(newId, 'prox', primeiro) },
  );

  rec.state = setField(rec.state, 'inicio', newId);
  rec.floating = {};
  rec.push('setinicio', 'li->inicio = no: o descritor passa a apontar para o nó novo, que agora é o primeiro da lista.', {
    edge: descEdge(newId),
    field: 'inicio',
  });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: inserção concluída com sucesso. As variáveis locais (no, valor) deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- inserir_final(Lista li, int valor) ----------

export function buildInserirFinal(list, valor) {
  const rec = createRecorder('inserir_final', list);
  const newId = `n${list.nextId}`;
  const valorDe = (id) => rec.state.nodes[id].valor;
  let noDeclared = false;
  let auxDeclared = false;
  let aux = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada inserir_final(li, ${valor}): vamos colocar ${valor} no final da lista.`);
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  rec.state = addNode(rec.state, newNode(rec.state, newId));
  rec.order = [...rec.order, newId];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem na memória (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no == NULL? Não: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  rec.state = setPtr(rec.state, newId, 'prox', null);
  rec.push('setprox', 'no->prox = NULL: o nó novo será o último, então seu prox é NULL.', { edge: eid(newId, 'prox', null) });

  // lista vazia
  if (getField(rec.state, 'inicio') === null) {
    rec.push('ifvazia', 'li->inicio == NULL? Sim: a lista está vazia, o nó novo será o primeiro.');
    rec.state = setField(rec.state, 'inicio', newId);
    rec.floating = {};
    rec.push('vinicio', 'li->inicio = no: o descritor passa a apontar para o nó novo.', { edge: descEdge(newId), field: 'inicio' });
    rec.state = setField(rec.state, 'qtd', 1);
    rec.push('vqtd', 'li->qtd++: a quantidade sobe de 0 para 1.', { field: 'qtd' });
    rec.ret('vret', 'return 0: inserção concluída com sucesso.');
    return { steps: rec.steps, list: rec.state };
  }

  rec.push('ifvazia', 'li->inicio == NULL? Não: a lista já tem nós, então é preciso achar o último.');

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', `aux = li->inicio: a busca começa no primeiro nó (${valorDe(aux)}).`);

  while (rec.state.nodes[aux].prox !== null) {
    rec.push('while', `aux->prox != NULL? Sim: o nó ${valorDe(aux)} não é o último, então avança.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', `aux->prox != NULL? Não: o nó ${valorDe(aux)} é o último. O laço termina.`);

  rec.state = setPtr(rec.state, aux, 'prox', newId);
  rec.floating = {};
  rec.push('link', `aux->prox = no: o último nó agora aponta para o nó novo (${valor}), que passa a fazer parte da lista.`, {
    edge: eid(aux, 'prox', newId),
  });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: inserção concluída com sucesso. As variáveis locais (no, aux, valor) deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- remover_inicio(Lista li) ----------

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
  rec.push(
    'setinicio',
    `li->inicio = no->prox: o descritor passa a apontar para ${proximo === null ? 'NULL' : `o nó ${valorDe(proximo)}`}. O nó ${removido} fica solto (fora da lista).`,
    { edge: descEdge(proximo), field: 'inicio' },
  );

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });

  rec.free(no);
  rec.push('free', `free(no): a memória do nó ${removido} é devolvida ao sistema. Ele aparece cinza ("liberado") só neste passo; a variável no continua guardando o endereço antigo (ponteiro pendente).`);

  rec.ret('ret0', 'return 0: remoção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- remover_final(Lista li) ----------

export function buildRemoverFinal(list) {
  const rec = createRecorder('remover_final', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let antDeclared = false;
  let aux = null;
  let ant = null;
  let antInit = false;

  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    if (antDeclared) vars.push(elemVar('ant', ant, rec.state, !antInit));
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

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', `aux = li->inicio: aux aponta para o primeiro nó (${valorDe(aux)}).`);

  antDeclared = true;
  rec.push('antdecl', 'Elem* ant: ant é declarado mas não recebe valor ainda, então guarda lixo (?) até ser atribuído.');

  // lista com um único nó
  if (rec.state.nodes[aux].prox === null) {
    const unico = valorDe(aux);
    rec.push('ifunico', `aux->prox == NULL? Sim: só existe um nó (${unico}), ele é o primeiro e o último.`);

    rec.free(aux);
    rec.push('ufree', `free(aux): a memória do nó ${unico} é devolvida. Atenção: li->inicio ainda guarda o endereço antigo (seta tracejada = ponteiro pendente).`);

    rec.state = setField(rec.state, 'inicio', null);
    rec.push('uinicio', 'li->inicio = NULL: o descritor deixa de apontar para a memória liberada. A lista agora está vazia.', {
      edge: descEdge(null),
      field: 'inicio',
    });

    rec.state = setField(rec.state, 'qtd', qtd - 1);
    rec.push('uqtd', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
    rec.ret('uret', 'return 0: remoção concluída com sucesso.');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifunico', `aux->prox == NULL? Não: o nó ${valorDe(aux)} tem sucessor, então é preciso andar até o último.`);

  while (rec.state.nodes[aux].prox !== null) {
    rec.push('while', `aux->prox != NULL? Sim: o nó ${valorDe(aux)} não é o último, então continua.`);
    ant = aux;
    antInit = true;
    rec.push('setant', `ant = aux: ant passa a apontar para o nó ${valorDe(ant)} (o que aux acabou de visitar).`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', `aux->prox != NULL? Não: o nó ${valorDe(aux)} é o último. O laço termina.`);

  const removido = valorDe(aux);
  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Atenção: ant->prox ainda guarda o endereço antigo (seta tracejada = ponteiro pendente).`);

  rec.state = setPtr(rec.state, ant, 'prox', null);
  rec.push('antnull', `ant->prox = NULL: o nó ${valorDe(ant)} passa a ser o último da lista.`, { edge: eid(ant, 'prox', null) });

  rec.state = setField(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });

  rec.ret('ret0', 'return 0: remoção concluída com sucesso. As variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- catálogo ----------

export const simpleList = {
  id: 'lista',
  label: 'Lista simples',
  kind: 'lista',
  initialValues: [10, 20, 30, 40, 50],
  listing,
  structs: [
    { key: 'elemento', color: '#374151', cells: [{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }] },
    { key: 'desc', color: '#1d4ed8', cells: [{ type: 'Elem*', name: 'inicio' }, { type: 'int', name: 'qtd' }] },
  ],
  structNote: 'Lista é um ponteiro para a struct lista (o descritor). Ela guarda onde a cadeia de Elem começa e quantos nós existem.',
  buttons: { withValue: ['inserir_inicio', 'inserir_final', 'busca_valor', 'remove_valor'], without: ['remover_inicio', 'remover_final', 'tamanho_lista', 'destruir'] },
  operations: {
    inserir_inicio: { build: buildInserirInicio, needsValue: true },
    inserir_final: { build: buildInserirFinal, needsValue: true },
    remover_inicio: { build: buildRemoverInicio, needsValue: false },
    remover_final: { build: buildRemoverFinal, needsValue: false },
    tamanho_lista: { build: buildTamanhoLista, needsValue: false },
    busca_valor: { build: buildBuscaValor, needsValue: true },
    remove_valor: { build: buildRemoveValorSimples, needsValue: true },
    destruir: { build: buildDestruirLista, needsValue: false },
  },
};
