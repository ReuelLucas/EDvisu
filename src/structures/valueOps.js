// busca_valor, remove_valor e destruir para as estruturas encadeadas.
// Atenção: busca_valor/remove_valor (e destruir da fila e da lista circular) são AUTORAIS — não estão no
// repositório do professor (ver tools/autoral/*.c). O destruir da lista simples, dupla e da pilha é do repositório.
import {
  DESC_ID, KINDS, createRecorder, descVar, eid, elemVar, getField, intVar, outVar, setField, setPtr,
} from '../memoryModel';

const cfgOf = (list) => KINDS[list.kind];
const descEdge = (field, target) => eid(DESC_ID, field, target);

// ---------- busca_valor(Lista li, int valor, int* pos) ----------

export function buildBuscaValor(list, valor) {
  const cfg = cfgOf(list);
  const V = cfg.descVar;
  const circular = cfg.head === 'circular';
  const head = circular ? 'final' : cfg.head;
  const rec = createRecorder('busca_valor', list);
  const valorDe = (id) => rec.state.nodes[id].valor;
  let auxDeclared = false;
  let iDeclared = false;
  let aux = null;
  let i = 0;
  let pos = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor), outVar('pos', pos)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    if (iDeclared) vars.push(intVar('i', i));
    return vars;
  };

  rec.push('sig', `Chamada busca_valor(${V}, ${valor}, &pos): vamos procurar o valor ${valor}. pos aponta para uma variável do chamador.`);

  const first = getField(rec.state, head);
  if (first === null) {
    rec.push('ifguard', `${V} == NULL || ${V}->${head} == NULL? Sim: a estrutura está vazia, não há o que procurar.`);
    rec.ret('retguard', 'return 1: valor não encontrado (a estrutura está vazia).');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', `${V} == NULL || ${V}->${head} == NULL? Não: existe pelo menos um nó.`);

  auxDeclared = true;
  aux = circular ? rec.state.nodes[first].prox : first;
  rec.push('auxinit', circular
    ? `aux = li->final->prox: aux aponta para o primeiro nó (${valorDe(aux)}), pois na lista circular o primeiro é o seguinte ao final.`
    : `aux = ${V}->${head}: aux aponta para o primeiro nó (${valorDe(aux)}).`);

  iDeclared = true;
  rec.push('icount', 'i = 0: i conta a posição do nó que aux está visitando.');

  const qtd = getField(rec.state, 'qtd');
  while (circular ? i < qtd : aux !== null) {
    rec.push('while', circular
      ? `i < li->qtd? Sim (${i} < ${qtd}): ainda há nós a visitar.`
      : `aux != NULL? Sim: vamos olhar o nó ${valorDe(aux)} (posição ${i}).`);
    if (valorDe(aux) === valor) {
      rec.push('ifigual', `aux->valor == valor? Sim: ${valorDe(aux)} == ${valor}, achamos!`);
      pos = i;
      rec.push('setpos', `*pos = i: grava ${i} na variável do chamador (posição do valor).`);
      rec.ret('ret0', `return 0: valor ${valor} encontrado na posição ${i}.`);
      return { steps: rec.steps, list: rec.state };
    }
    rec.push('ifigual', `aux->valor == valor? Não: ${valorDe(aux)} != ${valor}.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', aux === null ? 'aux = aux->prox: chegou ao fim, aux vale NULL.' : `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
    i += 1;
    rec.push('inc', `i++: i vale ${i}.`);
  }
  rec.push('while', circular ? `i < li->qtd? Não (${i} == ${qtd}): demos a volta completa.` : 'aux != NULL? Não: chegamos ao fim da lista.');
  rec.ret('retnao', `return 1: o valor ${valor} não existe na estrutura.`);
  return { steps: rec.steps, list: rec.state };
}

// ---------- remove_valor: lista simples, pilha e fila (mesmo algoritmo com ant/aux) ----------

export function buildRemoveValorSimples(list, valor) {
  const cfg = cfgOf(list);
  const V = cfg.descVar;
  const head = cfg.head;
  const tail = list.kind === 'fila' ? 'final' : null;
  const rec = createRecorder('remove_valor', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let antDeclared = false;
  let aux = null;
  let ant = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    if (antDeclared) vars.push(elemVar('ant', ant, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada remove_valor(${V}, ${valor}): vamos remover o primeiro nó cujo valor é ${valor}.`);

  const first = getField(rec.state, head);
  if (first === null) {
    rec.push('ifguard', `${V} == NULL || ${V}->${head} == NULL? Sim: a estrutura está vazia.`);
    rec.ret('retguard', 'return 1: não há o que remover.');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', `${V} == NULL || ${V}->${head} == NULL? Não: existe pelo menos um nó.`);

  auxDeclared = true;
  aux = first;
  rec.push('auxinit', `aux = ${V}->${head}: aux aponta para o primeiro nó (${valorDe(aux)}).`);
  antDeclared = true;
  ant = null;
  rec.push('antinit', 'ant = NULL: ant vai guardar o nó ANTERIOR ao aux; no começo não há anterior.');

  while (aux !== null && valorDe(aux) !== valor) {
    rec.push('while', `aux != NULL && aux->valor != valor? Sim: ${valorDe(aux)} != ${valor}, continua procurando.`);
    ant = aux;
    rec.push('setant', `ant = aux: ant passa a apontar para o nó ${valorDe(ant)}.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', aux === null ? 'aux = aux->prox: chegou ao fim, aux vale NULL.' : `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', aux === null ? 'aux != NULL && aux->valor != valor? Não: aux é NULL, a lista acabou.' : `aux != NULL && aux->valor != valor? Não: ${valorDe(aux)} == ${valor}, achamos o nó.`);

  if (aux === null) {
    rec.push('ifnao', 'aux == NULL? Sim: o valor não existe.');
    rec.ret('retnao', `return 1: o valor ${valor} não foi encontrado, nada foi removido.`);
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifnao', 'aux == NULL? Não: o nó foi encontrado.');

  const prox = rec.state.nodes[aux].prox;
  const removido = valorDe(aux);
  if (ant === null) {
    rec.push('ifprim', 'ant == NULL? Sim: o nó a remover é o primeiro.');
    rec.state = setField(rec.state, head, prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('sethead', `${V}->${head} = aux->prox: o descritor passa a apontar para ${prox === null ? 'NULL' : `o nó ${valorDe(prox)}`}. O nó ${removido} fica solto.`, {
      edge: descEdge(head, prox), field: head,
    });
  } else {
    rec.push('ifprim', 'ant == NULL? Não: existe um nó anterior.');
    rec.state = setPtr(rec.state, ant, 'prox', prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('link', `ant->prox = aux->prox: o nó ${valorDe(ant)} "pula" o ${removido} e aponta para ${prox === null ? 'NULL' : `o nó ${valorDe(prox)}`}. O nó ${removido} fica solto.`, {
      edge: eid(ant, 'prox', prox),
    });
  }

  if (tail) {
    const eraUltimo = getField(rec.state, tail) === aux;
    rec.push('iftail', `aux == ${V}->${tail}? ${eraUltimo ? 'Sim: o nó removido era o último da fila.' : 'Não: o final da fila não muda.'}`);
    if (eraUltimo) {
      rec.state = setField(rec.state, tail, ant);
      rec.push('settail', `${V}->${tail} = ant: o final passa a ser ${ant === null ? 'NULL (a fila ficou vazia)' : `o nó ${valorDe(ant)}`}.`, {
        edge: descEdge(tail, ant), field: tail,
      });
    }
  }

  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; aux guarda o endereço antigo (ponteiro pendente).`);

  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `${V}->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });

  rec.ret('ret0', `return 0: o valor ${valor} foi removido. As variáveis locais deixam de existir.`);
  return { steps: rec.steps, list: rec.state };
}

// ---------- remove_valor: lista dupla ----------

export function buildRemoveValorDupla(list, valor) {
  const rec = createRecorder('remove_valor', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let aux = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada remove_valor(li, ${valor}): vamos remover o primeiro nó cujo valor é ${valor}.`);
  if (getField(rec.state, 'inicio') === null) {
    rec.push('ifguard', 'li == NULL || li->inicio == NULL? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', 'li == NULL || li->inicio == NULL? Não: existe pelo menos um nó.');

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', `aux = li->inicio: aux aponta para o primeiro nó (${valorDe(aux)}).`);

  while (aux !== null && valorDe(aux) !== valor) {
    rec.push('while', `aux != NULL && aux->valor != valor? Sim: ${valorDe(aux)} != ${valor}, continua procurando.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', aux === null ? 'aux = aux->prox: chegou ao fim, aux vale NULL.' : `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', aux === null ? 'aux != NULL && aux->valor != valor? Não: aux é NULL, a lista acabou.' : `aux != NULL && aux->valor != valor? Não: ${valorDe(aux)} == ${valor}, achamos o nó.`);

  if (aux === null) {
    rec.push('ifnao', 'aux == NULL? Sim: o valor não existe.');
    rec.ret('retnao', `return 1: o valor ${valor} não foi encontrado, nada foi removido.`);
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifnao', 'aux == NULL? Não: o nó foi encontrado.');

  const { ant, prox } = rec.state.nodes[aux];
  const removido = valorDe(aux);
  if (ant === null) {
    rec.push('ifprim', 'aux->ant == NULL? Sim: o nó a remover é o primeiro.');
    rec.state = setField(rec.state, 'inicio', prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('sethead', `li->inicio = aux->prox: o descritor passa a apontar para ${prox === null ? 'NULL' : `o nó ${valorDe(prox)}`}.`, {
      edge: descEdge('inicio', prox), field: 'inicio',
    });
  } else {
    rec.push('ifprim', 'aux->ant == NULL? Não: existe um nó anterior.');
    rec.state = setPtr(rec.state, ant, 'prox', prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('linkant', `aux->ant->prox = aux->prox: o nó ${valorDe(ant)} passa a apontar para ${prox === null ? 'NULL' : `o nó ${valorDe(prox)}`}.`, {
      edge: eid(ant, 'prox', prox),
    });
  }

  if (prox === null) {
    rec.push('ifult', 'aux->prox == NULL? Sim: o nó removido era o último.');
    rec.state = setField(rec.state, 'final', ant);
    rec.push('settail', `li->final = aux->ant: o final passa a ser ${ant === null ? 'NULL (a lista ficou vazia)' : `o nó ${valorDe(ant)}`}.`, {
      edge: descEdge('final', ant), field: 'final',
    });
  } else {
    rec.push('ifult', 'aux->prox == NULL? Não: existe um nó seguinte.');
    rec.state = setPtr(rec.state, prox, 'ant', ant);
    rec.push('linkprox', `aux->prox->ant = aux->ant: o nó ${valorDe(prox)} passa a apontar de volta para ${ant === null ? 'NULL' : `o nó ${valorDe(ant)}`}.`, {
      edge: eid(prox, 'ant', ant),
    });
  }

  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; aux guarda o endereço antigo (ponteiro pendente).`);
  const antes = getField(rec.state, 'qtd');
  rec.state = setField(rec.state, 'qtd', antes - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${antes} para ${antes - 1}.`, { field: 'qtd' });
  rec.ret('ret0', `return 0: o valor ${valor} foi removido. As variáveis locais deixam de existir.`);
  return { steps: rec.steps, list: rec.state };
}

// ---------- remove_valor: lista circular (descritor guarda só o final) ----------

export function buildRemoveValorCircular(list, valor) {
  const rec = createRecorder('remove_valor', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let antDeclared = false;
  let iDeclared = false;
  let aux = null;
  let ant = null;
  let i = 0;

  rec.makeVars = () => {
    const vars = [descVar(rec.state), intVar('valor', valor)];
    if (antDeclared) vars.push(elemVar('ant', ant, rec.state));
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    if (iDeclared) vars.push(intVar('i', i));
    return vars;
  };

  rec.push('sig', `Chamada remove_valor(li, ${valor}): vamos remover o primeiro nó cujo valor é ${valor}.`);
  const final = getField(rec.state, 'final');
  if (final === null) {
    rec.push('ifguard', 'li == NULL || li->final == NULL? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifguard', 'li == NULL || li->final == NULL? Não: existe pelo menos um nó.');

  antDeclared = true;
  ant = final;
  rec.push('antinit', `ant = li->final: ant começa no último nó (${valorDe(ant)}), que é o anterior ao primeiro.`);
  auxDeclared = true;
  aux = rec.state.nodes[ant].prox;
  rec.push('auxinit', `aux = ant->prox: aux aponta para o primeiro nó (${valorDe(aux)}).`);
  iDeclared = true;
  rec.push('icount', 'i = 0: i conta quantos nós já foram visitados (a lista é um anel: sem NULL para parar).');

  const qtd = getField(rec.state, 'qtd');
  while (i < qtd && valorDe(aux) !== valor) {
    rec.push('while', `i < li->qtd && aux->valor != valor? Sim: ${valorDe(aux)} != ${valor}, continua procurando.`);
    ant = aux;
    rec.push('setant', `ant = aux: ant passa a apontar para o nó ${valorDe(ant)}.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
    i += 1;
    rec.push('inc', `i++: i vale ${i}.`);
  }
  rec.push('while', i === qtd ? `i < li->qtd && ...? Não (${i} == ${qtd}): demos a volta inteira.` : `i < li->qtd && aux->valor != valor? Não: ${valorDe(aux)} == ${valor}, achamos o nó.`);

  if (i === qtd) {
    rec.push('ifnao', 'i == li->qtd? Sim: percorremos tudo e não achamos.');
    rec.ret('retnao', `return 1: o valor ${valor} não foi encontrado, nada foi removido.`);
    return { steps: rec.steps, list: rec.state };
  }
  rec.push('ifnao', 'i == li->qtd? Não: o nó foi encontrado.');

  const removido = valorDe(aux);
  if (qtd === 1) {
    rec.push('ifunico', 'li->qtd == 1? Sim: é o único nó da lista.');
    rec.state = setField(rec.state, 'final', null);
    rec.floating = { [aux]: 'removendo' };
    rec.push('setfinalnull', 'li->final = NULL: a lista ficará vazia.', { edge: descEdge('final', null), field: 'final' });
  } else {
    rec.push('ifunico', 'li->qtd == 1? Não: há outros nós.');
    const prox = rec.state.nodes[aux].prox;
    rec.state = setPtr(rec.state, ant, 'prox', prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('link', `ant->prox = aux->prox: o nó ${valorDe(ant)} "pula" o ${removido} e aponta para ${valorDe(prox)}.`, { edge: eid(ant, 'prox', prox) });
    const eraFinal = aux === getField(rec.state, 'final');
    rec.push('iftail', `aux == li->final? ${eraFinal ? 'Sim: o removido era o último, o final precisa mudar.' : 'Não: o final não muda.'}`);
    if (eraFinal) {
      rec.state = setField(rec.state, 'final', ant);
      rec.push('settail', `li->final = ant: o final passa a ser o nó ${valorDe(ant)}.`, { edge: descEdge('final', ant), field: 'final' });
    }
  }

  rec.free(aux);
  rec.push('free', `free(aux): a memória do nó ${removido} é devolvida. Ele aparece cinza ("liberado") só neste passo; aux guarda o endereço antigo (ponteiro pendente).`);
  rec.state = setField(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret0', `return 0: o valor ${valor} foi removido. As variáveis locais deixam de existir.`);
  return { steps: rec.steps, list: rec.state };
}

// ---------- destruir ----------

// Lista simples, dupla (repositório) e fila (autoral): percorre liberando cada nó e, no fim, libera o descritor.
// `nodeVar`: nome da variável que percorre ('no' nas listas, 'aux' na fila).
export function buildDestruirLista(list) {
  const cfg = cfgOf(list);
  const V = cfg.descVar;
  const head = cfg.head;
  const nodeVar = list.kind === 'fila' ? 'aux' : 'no';
  const rec = createRecorder('destruir', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let noDeclared = false;
  let proxDeclared = false;
  let no = null;
  let prox = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (noDeclared) vars.push(elemVar(nodeVar, no, rec.state));
    if (proxDeclared) vars.push(elemVar('prox', prox, rec.state));
    return vars;
  };

  rec.push('sig', `Chamada destruir(${V}): vamos liberar todos os nós e, por fim, o próprio descritor.`);
  rec.push('ifli', `${V} != NULL? Sim: o descritor existe.`);
  noDeclared = true;
  no = getField(rec.state, head);
  rec.push('noinit', no === null ? `${nodeVar} = ${V}->${head}: a estrutura está vazia, ${nodeVar} vale NULL.` : `${nodeVar} = ${V}->${head}: ${nodeVar} aponta para o primeiro nó (${valorDe(no)}).`);

  while (no !== null) {
    proxDeclared = false;
    rec.push('while', `${nodeVar} != NULL? Sim: ainda há nós a liberar (nó ${valorDe(no)}).`);
    proxDeclared = true;
    prox = rec.state.nodes[no].prox;
    rec.push('proxinit', `prox = ${nodeVar}->prox: guarda o próximo nó (${prox === null ? 'NULL' : valorDe(prox)}) ANTES de liberar, senão perderíamos o encadeamento.`);
    const liberado = valorDe(no);
    rec.free(no);
    rec.push('free', `free(${nodeVar}): a memória do nó ${liberado} é devolvida. Ele aparece cinza só neste passo; os ponteiros que ainda apontam para ele ficam pendentes.`);
    no = prox;
    rec.push('avanca', `${nodeVar} = prox: ${nodeVar} avança para ${no === null ? 'NULL' : `o nó ${valorDe(no)}`}.`);
  }
  proxDeclared = false;
  rec.push('while', `${nodeVar} != NULL? Não: todos os nós foram liberados.`);

  rec.freeDesc();
  rec.push('freedesc', `free(${V}): agora o descritor também é devolvido. A variável ${V} do chamador fica pendente — a estrutura não pode mais ser usada.`);
  rec.ret('freedesc', 'Fim de destruir: as variáveis locais deixam de existir. Para usar a estrutura de novo é preciso criá-la outra vez.');
  return { steps: rec.steps, list: rec.state };
}

// Pilha (repositório): desempilha liberando cada nó (p->topo é atualizado a cada volta).
export function buildDestruirPilha(list) {
  const rec = createRecorder('destruir', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let auxDeclared = false;
  let auxInit = false;
  let aux = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state, !auxInit));
    return vars;
  };

  rec.push('sig', 'Chamada destruir(p): vamos liberar todos os nós e, por fim, o próprio descritor.');
  rec.push('ifli', 'p != NULL? Sim: o descritor existe.');
  auxDeclared = true;
  rec.push('auxdecl', 'Elem * aux: aux é declarado mas ainda sem valor (?).');

  while (getField(rec.state, 'topo') !== null) {
    rec.push('while', `p->topo != NULL? Sim: ainda há nós (topo = ${valorDe(getField(rec.state, 'topo'))}).`);
    aux = getField(rec.state, 'topo');
    auxInit = true;
    rec.push('setaux', `aux = p->topo: aux aponta para o topo (${valorDe(aux)}).`);
    const prox = rec.state.nodes[aux].prox;
    rec.state = setField(rec.state, 'topo', prox);
    rec.floating = { [aux]: 'removendo' };
    rec.push('settopo', `p->topo = aux->prox: o topo passa a ser ${prox === null ? 'NULL' : `o nó ${valorDe(prox)}`}.`, { edge: descEdge('topo', prox), field: 'topo' });
    const liberado = valorDe(aux);
    rec.free(aux);
    rec.push('free', `free(aux): a memória do nó ${liberado} é devolvida (cinza só neste passo).`);
  }
  rec.push('while', 'p->topo != NULL? Não: a pilha está vazia.');

  rec.freeDesc();
  rec.push('freedesc', 'free(p): agora o descritor também é devolvido. A variável p do chamador fica pendente.');
  rec.ret('freedesc', 'Fim de destruir: as variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

// Lista circular (autoral): primeiro quebra o anel (final->prox = NULL) e depois libera como numa lista simples.
export function buildDestruirCircular(list) {
  const rec = createRecorder('destruir', list);
  const valorDe = (id) => rec.state.nodes[id]?.valor ?? rec.ghosts[id]?.valor;
  let noDeclared = false;
  let proxDeclared = false;
  let no = null;
  let prox = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (noDeclared) vars.push(elemVar('no', no, rec.state));
    if (proxDeclared) vars.push(elemVar('prox', prox, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada destruir(li): vamos liberar todos os nós e, por fim, o próprio descritor.');
  rec.push('ifli', 'li != NULL? Sim: o descritor existe.');
  const final = getField(rec.state, 'final');
  if (final !== null) {
    rec.push('iffinal', 'li->final != NULL? Sim: existem nós.');
    noDeclared = true;
    no = rec.state.nodes[final].prox;
    rec.push('noinit', `no = li->final->prox: no aponta para o primeiro nó (${valorDe(no)}).`);
    rec.state = setPtr(rec.state, final, 'prox', null);
    rec.push('quebra', 'li->final->prox = NULL: o anel é "aberto". Sem isso o laço nunca encontraria NULL e daria voltas infinitas.', { edge: eid(final, 'prox', null) });

    while (no !== null) {
      proxDeclared = false;
      rec.push('while', `no != NULL? Sim: ainda há nós a liberar (nó ${valorDe(no)}).`);
      proxDeclared = true;
      prox = rec.state.nodes[no].prox;
      rec.push('proxinit', `prox = no->prox: guarda o próximo nó (${prox === null ? 'NULL' : valorDe(prox)}) antes de liberar.`);
      const liberado = valorDe(no);
      rec.free(no);
      rec.push('free', `free(no): a memória do nó ${liberado} é devolvida (cinza só neste passo).`);
      no = prox;
      rec.push('avanca', `no = prox: no avança para ${no === null ? 'NULL' : `o nó ${valorDe(no)}`}.`);
    }
    proxDeclared = false;
    rec.push('while', 'no != NULL? Não: todos os nós foram liberados.');
  } else {
    rec.push('iffinal', 'li->final != NULL? Não: a lista está vazia, só falta liberar o descritor.');
  }

  rec.freeDesc();
  rec.push('freedesc', 'free(li): agora o descritor também é devolvido. A variável li do chamador fica pendente.');
  rec.ret('freedesc', 'Fim de destruir: as variáveis locais deixam de existir.');
  return { steps: rec.steps, list: rec.state };
}

