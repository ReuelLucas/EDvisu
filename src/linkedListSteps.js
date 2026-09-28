// Modelo da lista unicamente encadeada da disciplina (lista_int.c) + geradores de passos.
//
// Na memória há DOIS tipos de objeto, como no código C:
//   - o descritor `struct lista` { inicio, qtd }, apontado pela variável `li` (tipo Lista);
//   - os nós `Elem` { valor, prox }, encadeados a partir de `li->inicio`.
//
// CONTRATO: cada passo (snapshot) descreve TUDO que a tela desenha naquele instante:
//   {
//     fn:         nome da função C em execução (chave de FUNCTIONS em cListings.js)
//     line:       id da linha C em execução (idem)
//     message:    explicação do que acabou de acontecer
//     list:       { desc, nodes, nextId, freed }  estado da memória neste passo
//     order:      ids dos nós na ordem em que são desenhados (esquerda -> direita)
//     floating:   { [id]: 'novo' | 'removendo' }  nós desenhados fora da fileira
//     vars:       variáveis locais visíveis neste passo
//     focusEdge:  id da aresta que acabou de ser (re)ligada, ou null
//     focusField: campo do descritor que acabou de mudar ('inicio' | 'qtd'), ou null
//   }
//
// Hoje os passos são escritos à mão aqui. Quando existir o interpretador de C, ele deve produzir
// snapshots neste MESMO formato: a interface não muda.

export const NULL_ID = 'null';
export const DESC_ID = 'desc';

// ---------- memória (imutável) ----------

// Nó Elem: { id, valor, prox }. `prox` é o ID do próximo nó (o "ponteiro"):
// null = NULL, undefined = ainda não inicializado (lixo logo após o malloc).
export function createList(values = []) {
  const nodes = {};
  values.forEach((valor, i) => {
    const id = `n${i + 1}`;
    nodes[id] = { id, valor, prox: i < values.length - 1 ? `n${i + 2}` : null };
  });
  return {
    desc: {
      fields: [
        { name: 'inicio', kind: 'ptr', value: values.length ? 'n1' : null },
        { name: 'qtd', kind: 'int', value: values.length },
      ],
    },
    nodes,
    nextId: values.length + 1,
    freed: [], // ids já liberados com free(): ponteiros que ainda apontam para eles estão "pendentes"
  };
}

export const getField = (list, name) => list.desc.fields.find((f) => f.name === name).value;

const setField = (list, name, value) => ({
  ...list,
  desc: { fields: list.desc.fields.map((f) => (f.name === name ? { ...f, value } : f)) },
});

const setProx = (list, id, prox) => ({ ...list, nodes: { ...list.nodes, [id]: { ...list.nodes[id], prox } } });
const setValor = (list, id, valor) => ({ ...list, nodes: { ...list.nodes, [id]: { ...list.nodes[id], valor } } });

const addNode = (list, node) => ({ ...list, nodes: { ...list.nodes, [node.id]: node }, nextId: list.nextId + 1 });

const freeNode = (list, id) => ({
  ...list,
  nodes: Object.fromEntries(Object.entries(list.nodes).filter(([key]) => key !== id)),
  freed: [...list.freed, id],
});

// ids dos nós na ordem inicio -> ... -> último
export function traverse(list) {
  const out = [];
  let cur = getField(list, 'inicio');
  const limit = Object.keys(list.nodes).length;
  while (cur !== null && list.nodes[cur] && out.length <= limit) {
    out.push(cur);
    cur = list.nodes[cur].prox;
  }
  return out;
}

// Endereço ILUSTRATIVO (derivado do id) só para mostrar que ponteiro = endereço.
export function addressOf(id) {
  if (id === null || id === undefined || id === NULL_ID) return 'NULL';
  if (id === DESC_ID) return '0x5000';
  return `0x${(0x6000 + Number(String(id).slice(1)) * 0x20).toString(16)}`;
}

// ---------- variáveis do painel ----------

const intVar = (name, value) => ({ name, type: 'int', kind: 'int', value });

// Ponteiro para Elem. `uninit`: declarado mas ainda sem valor (ex.: `Elem* ant;`).
// `dangling`: aponta para memória já liberada com free().
function elemVar(name, target, list, uninit = false) {
  if (uninit) return { name, type: 'Elem*', kind: 'ptr', target: null, pointee: null, uninit: true, dangling: false };
  const dangling = target !== null && list.freed.includes(target);
  return {
    name,
    type: 'Elem*',
    kind: 'ptr',
    target,
    pointee: target !== null && list.nodes[target] ? list.nodes[target].valor : null,
    uninit: false,
    dangling,
  };
}

// li: ponteiro para o descritor
const liVar = () => ({
  name: 'li',
  type: 'Lista',
  kind: 'ptr',
  target: DESC_ID,
  pointee: 'struct lista',
  uninit: false,
  dangling: false,
});

// ---------- gravador de passos ----------

function createRecorder(fn, list) {
  const rec = {
    steps: [],
    state: list,
    order: traverse(list),
    floating: {},
    makeVars: () => [],
    push(line, message, { edge = null, field = null } = {}) {
      rec.steps.push({
        fn,
        line,
        message,
        list: rec.state,
        order: rec.order,
        floating: rec.floating,
        vars: rec.makeVars(),
        focusEdge: edge,
        focusField: field,
      });
    },
  };
  return rec;
}

export function idleSnapshot(list) {
  return {
    fn: null,
    line: null,
    message: 'Lista pronta. Escolha uma função para ver o passo a passo do código C.',
    list,
    order: traverse(list),
    floating: {},
    vars: [liVar()],
    focusEdge: null,
    focusField: null,
  };
}

const edgeId = (source, target) => `${source}->${target ?? NULL_ID}`;
const descEdge = (target) => `${DESC_ID}.inicio->${target ?? NULL_ID}`;

// ---------- inserir_inicio(Lista li, int valor) ----------

export function buildInserirInicio(list, valor) {
  const rec = createRecorder('inserir_inicio', list);
  const newId = `n${list.nextId}`;
  let noDeclared = false;

  rec.makeVars = () => {
    const vars = [liVar(), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada inserir_inicio(li, ${valor}): vamos colocar ${valor} no início da lista.`);

  // Elem* no = malloc(sizeof(Elem));   (o nó novo abre espaço na posição 0, mas ainda não está ligado)
  rec.state = addNode(rec.state, { id: newId, valor: null, prox: undefined });
  rec.order = [newId, ...rec.order];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem na memória (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no != NULL? Sim: a alocação deu certo, então podemos preencher o nó.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  const primeiro = getField(rec.state, 'inicio');
  rec.state = setProx(rec.state, newId, primeiro);
  rec.push(
    'setprox',
    `no->prox = li->inicio: o nó novo passa a apontar para ${primeiro === null ? 'NULL (a lista estava vazia)' : `o que hoje é o primeiro nó (${rec.state.nodes[primeiro].valor})`}.`,
    { edge: edgeId(newId, primeiro) },
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

  rec.push('ret0', 'return 0: inserção concluída com sucesso.');
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
    const vars = [liVar(), intVar('valor', valor)];
    if (noDeclared) vars.push(elemVar('no', newId, rec.state));
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada inserir_final(li, ${valor}): vamos colocar ${valor} no final da lista.`);
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  rec.state = addNode(rec.state, { id: newId, valor: null, prox: undefined });
  rec.order = [...rec.order, newId];
  rec.floating = { [newId]: 'novo' };
  noDeclared = true;
  rec.push('malloc', `no = malloc(sizeof(Elem)): reserva um novo Elem na memória (endereço ${addressOf(newId)}). Os campos ainda contêm lixo (?).`);
  rec.push('ifno', 'no == NULL? Não: a alocação deu certo.');

  rec.state = setValor(rec.state, newId, valor);
  rec.push('setvalor', `no->valor = valor: guarda ${valor} no nó novo.`);

  rec.state = setProx(rec.state, newId, null);
  rec.push('setprox', 'no->prox = NULL: o nó novo será o último, então seu prox é NULL.', { edge: edgeId(newId, null) });

  // lista vazia
  if (getField(rec.state, 'inicio') === null) {
    rec.push('ifvazia', 'li->inicio == NULL? Sim: a lista está vazia, o nó novo será o primeiro.');
    rec.state = setField(rec.state, 'inicio', newId);
    rec.floating = {};
    rec.push('vinicio', 'li->inicio = no: o descritor passa a apontar para o nó novo.', { edge: descEdge(newId), field: 'inicio' });
    rec.state = setField(rec.state, 'qtd', 1);
    rec.push('vqtd', 'li->qtd++: a quantidade sobe de 0 para 1.', { field: 'qtd' });
    rec.push('vret', 'return 0: inserção concluída com sucesso.');
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

  rec.state = setProx(rec.state, aux, newId);
  rec.floating = {};
  rec.push('link', `aux->prox = no: o último nó agora aponta para o nó novo (${valor}), que passa a fazer parte da lista.`, {
    edge: edgeId(aux, newId),
  });

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${antes} para ${antes + 1}.`, { field: 'qtd' });

  rec.push('ret0', 'return 0: inserção concluída com sucesso.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- remover_inicio(Lista li) ----------

export function buildRemoverInicio(list) {
  const rec = createRecorder('remover_inicio', list);
  const valorDe = (id) => rec.state.nodes[id].valor;
  let noDeclared = false;
  let no = null;

  rec.makeVars = () => {
    const vars = [liVar()];
    if (noDeclared) vars.push(elemVar('no', no, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada remover_inicio(li): vamos retirar o primeiro nó da lista.');

  if (getField(rec.state, 'inicio') === null) {
    rec.push('ifvazio', 'li->inicio == NULL? Sim: a lista está vazia.');
    rec.push('ret1', 'return 1: não há o que remover, a função devolve erro (1).');
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

  rec.state = freeNode(rec.state, no);
  rec.order = rec.order.filter((id) => id !== no);
  rec.floating = {};
  rec.push('free', `free(no): a memória do nó ${removido} é devolvida ao sistema. A variável no continua guardando o endereço antigo (ponteiro pendente).`);

  rec.push('ret0', 'return 0: remoção concluída com sucesso.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- remover_final(Lista li) ----------

export function buildRemoverFinal(list) {
  const rec = createRecorder('remover_final', list);
  const valorDe = (id) => rec.state.nodes[id].valor;
  let auxDeclared = false;
  let antDeclared = false;
  let aux = null;
  let ant = null;
  let antInit = false;

  rec.makeVars = () => {
    const vars = [liVar()];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    if (antDeclared) vars.push(elemVar('ant', ant, rec.state, !antInit));
    return vars;
  };

  rec.push('sig', 'Chamada remover_final(li): vamos retirar o último nó da lista.');

  const qtd = getField(rec.state, 'qtd');
  if (getField(rec.state, 'inicio') === null || qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->inicio == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.push('retguard', 'return 1: não há o que remover, a função devolve erro (1).');
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

    rec.state = freeNode(rec.state, aux);
    rec.order = rec.order.filter((id) => id !== aux);
    rec.push('ufree', `free(aux): a memória do nó ${unico} é devolvida. Atenção: li->inicio ainda guarda o endereço antigo (ponteiro pendente).`);

    rec.state = setField(rec.state, 'inicio', null);
    rec.push('uinicio', 'li->inicio = NULL: o descritor deixa de apontar para a memória liberada. A lista agora está vazia.', {
      edge: descEdge(null),
      field: 'inicio',
    });

    rec.state = setField(rec.state, 'qtd', qtd - 1);
    rec.push('uqtd', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
    rec.push('uret', 'return 0: remoção concluída com sucesso.');
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
  rec.state = freeNode(rec.state, aux);
  rec.order = rec.order.filter((id) => id !== aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Atenção: ant->prox ainda guarda o endereço antigo (ponteiro pendente).`);

  rec.state = setProx(rec.state, ant, null);
  rec.push('antnull', `ant->prox = NULL: o nó ${valorDe(ant)} passa a ser o último da lista.`, { edge: edgeId(ant, null) });

  rec.state = setField(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });

  rec.push('ret0', 'return 0: remoção concluída com sucesso.');
  return { steps: rec.steps, list: rec.state };
}

// ---------- tamanho_lista(Lista li) ----------

export function buildTamanhoLista(list) {
  const rec = createRecorder('tamanho_lista', list);
  const valorDe = (id) => rec.state.nodes[id].valor;
  let countDeclared = false;
  let auxDeclared = false;
  let count = 0;
  let aux = null;

  rec.makeVars = () => {
    const vars = [liVar()];
    if (countDeclared) vars.push(intVar('count', count));
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada tamanho_lista(li): vamos contar os nós percorrendo a lista.');
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  countDeclared = true;
  rec.push('count', 'count = 0: o contador começa em zero.');

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', aux === null ? 'aux = li->inicio: a lista está vazia, então aux vale NULL.' : `aux = li->inicio: aux aponta para o primeiro nó (${valorDe(aux)}).`);

  while (aux !== null) {
    rec.push('while', `aux != NULL? Sim: ainda há nós para contar (nó ${valorDe(aux)}).`);
    count += 1;
    rec.push('inc', `count++: o nó ${valorDe(aux)} foi contado, count vale ${count}.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', aux === null ? 'aux = aux->prox: chegou ao fim da lista, aux vale NULL.' : `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', 'aux != NULL? Não: chegamos ao fim da lista. O laço termina.');
  rec.push('ret', `return count: a lista tem ${count} ${count === 1 ? 'nó' : 'nós'}.`);
  return { steps: rec.steps, list: rec.state };
}

// ---------- catálogo de operações (nome da função C -> gerador) ----------

export const OPERATIONS = {
  inserir_inicio: { build: buildInserirInicio, needsValue: true },
  inserir_final: { build: buildInserirFinal, needsValue: true },
  remover_inicio: { build: buildRemoverInicio, needsValue: false },
  remover_final: { build: buildRemoverFinal, needsValue: false },
  tamanho_lista: { build: buildTamanhoLista, needsValue: false },
};

export function runOperation(name, list, valor) {
  return OPERATIONS[name].build(list, valor);
}
