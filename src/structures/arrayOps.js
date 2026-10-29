// Passos (um gerador por função C) das estruturas com vetor: pilha estática, fila estática e lista sequencial.
// Pilha e fila estáticas: funções do repositório. Lista sequencial, busca_valor e remove_valor: AUTORAIS.
import {
  arrDescVar, createArrayRecorder, idxVar, outParam, plainInt, setCell, setF,
} from '../arrayModel';

const done = (rec) => ({ steps: rec.steps, list: rec.state });
const destroyedMem = (mem) => ({ ...mem, destroyed: true });

// ---------------------------------------------------------------- PILHA (topo = quantidade; dados[0] é a base)

export function pilhaPush(mem, valor) {
  const rec = createArrayRecorder('push', mem);
  const { max } = mem;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('matricula', valor)];
  rec.push('sig', `Chamada push(p, ${valor}): vamos empilhar ${valor}.`);
  const topo = rec.state.fields.topo;
  if (topo >= max) {
    rec.push('ifok', `p->topo < MAX && p != NULL? Não: topo (${topo}) já é igual a MAX (${max}), o vetor está cheio.`);
    rec.ret('ret1', 'return 1: pilha cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifok', `p->topo < MAX && p != NULL? Sim: topo = ${topo} < MAX = ${max}, ainda há espaço.`);
  rec.state = setCell(rec.state, topo, valor);
  rec.push('setdado', `p->dados[p->topo] = matricula: grava ${valor} na posição ${topo} do vetor.`, { cell: topo });
  rec.state = setF(rec.state, 'topo', topo + 1);
  rec.push('topoinc', `p->topo++: topo vai de ${topo} para ${topo + 1} (a próxima posição livre).`, { field: 'topo' });
  rec.ret('ret0', 'return 0: empilhado com sucesso.');
  return done(rec);
}

export function pilhaPop(mem) {
  const rec = createArrayRecorder('pop', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada pop(p): vamos desempilhar.');
  const topo = rec.state.fields.topo;
  if (topo === 0) {
    rec.push('ifvazia', 'p->topo == 0 || p == NULL? Sim: a pilha está vazia.');
    rec.ret('ret1', 'return 1: não há o que desempilhar.');
    return done(rec);
  }
  rec.push('ifvazia', `p->topo == 0 || p == NULL? Não: topo = ${topo}.`);
  rec.state = setF(rec.state, 'topo', topo - 1);
  rec.push('topodec', `p->topo--: topo vai de ${topo} para ${topo - 1}. Nada é apagado: o valor ${rec.state.dados[topo - 1]} continua na posição ${topo - 1}, mas agora está FORA da pilha (será sobrescrito no próximo push).`, { field: 'topo', cell: topo - 1 });
  rec.ret('ret0', 'return 0: desempilhado com sucesso.');
  return done(rec);
}

export function pilhaPeek(mem) {
  const rec = createArrayRecorder('peek', mem);
  let out = null;
  rec.makeVars = () => [arrDescVar(rec.state), outParam('matricula', out)];
  rec.push('sig', 'Chamada peek(p, &x): vamos ler o topo sem remover. matricula aponta para uma variável x do chamador.');
  const topo = rec.state.fields.topo;
  if (topo === 0) {
    rec.push('ifvazia', 'p->topo == 0 || p == NULL? Sim: a pilha está vazia.');
    rec.ret('ret1', 'return 1: não há topo para ler.');
    return done(rec);
  }
  rec.push('ifvazia', `p->topo == 0 || p == NULL? Não: topo = ${topo}.`);
  out = rec.state.dados[topo - 1];
  rec.push('setout', `*matricula = p->dados[p->topo - 1]: lê a posição ${topo - 1} (o último empilhado) e grava ${out} em x. Nada muda na pilha.`, { cell: topo - 1 });
  rec.ret('ret0', `return 0: x do chamador vale ${out}.`);
  return done(rec);
}

export function pilhaTamanho(mem) {
  const rec = createArrayRecorder('tamanho_pilha', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada tamanho_pilha(p): quantos elementos há na pilha?');
  rec.push('ifp', 'p == NULL? Não: a pilha existe.');
  rec.ret('ret', `return p->topo: devolve ${rec.state.fields.topo} (topo é, ao mesmo tempo, a quantidade de elementos).`);
  return done(rec);
}

export function pilhaDestruir(mem) {
  const rec = createArrayRecorder('destruir_pilha', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada destruir_pilha(p): vamos liberar a pilha.');
  rec.push('ifp', 'p != NULL? Sim: a pilha existe.');
  rec.state = destroyedMem(rec.state);
  rec.push('freedesc', 'free(p): a struct inteira — inclusive o vetor dados, que mora dentro dela — é devolvida de uma só vez. Só há um bloco para liberar. A variável p do chamador fica pendente.');
  rec.ret('freedesc', 'Fim de destruir_pilha.');
  return done(rec);
}

// busca_valor / remove_valor (AUTORAIS) — a pilha é procurada do topo para a base
export function pilhaBusca(mem, valor) {
  const rec = createArrayRecorder('busca_valor', mem);
  let i = null;
  let pos = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), outParam('pos', pos), ...(i === null ? [] : [idxVar('i', i, Math.max(i, 0))])];
  rec.push('sig', `Chamada busca_valor(p, ${valor}, &pos): procurar ${valor} do topo para a base. pos aponta para uma variável do chamador.`);
  const topo = rec.state.fields.topo;
  if (topo === 0) {
    rec.push('ifguard', 'p == NULL || p->topo == 0? Sim: a pilha está vazia.');
    rec.ret('retguard', 'return 1: valor não encontrado (pilha vazia).');
    return done(rec);
  }
  rec.push('ifguard', 'p == NULL || p->topo == 0? Não: há elementos.');
  i = topo - 1;
  rec.push('icount', `i = p->topo - 1: começa no topo (posição ${i}).`);
  while (i >= 0) {
    rec.push('while', `i >= 0? Sim: i = ${i}.`, { cell: i });
    const v = rec.state.dados[i];
    if (v === valor) {
      rec.push('ifigual', `p->dados[i] == valor? Sim: dados[${i}] = ${v} == ${valor}. Achou!`, { cell: i });
      pos = i;
      rec.push('setpos', `*pos = i: grava ${i} na variável do chamador.`, { cell: i });
      rec.ret('ret0', `return 0: ${valor} está na posição ${i} do vetor.`);
      return done(rec);
    }
    rec.push('ifigual', `p->dados[i] == valor? Não: dados[${i}] = ${v} != ${valor}.`, { cell: i });
    i -= 1;
    rec.push('inc', `i--: desce para a posição ${i}${i < 0 ? ' (saiu da base da pilha)' : ''}.`);
  }
  rec.push('while', 'i >= 0? Não: a base foi ultrapassada.');
  rec.ret('retnao', `return 1: ${valor} não está na pilha.`);
  return done(rec);
}

export function pilhaRemove(mem, valor) {
  const rec = createArrayRecorder('remove_valor', mem);
  let i = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), ...(i === null ? [] : [idxVar('i', i, Math.max(i, 0))])];
  rec.push('sig', `Chamada remove_valor(p, ${valor}): remover o ${valor} mais próximo do topo e fechar o buraco.`);
  const topo0 = rec.state.fields.topo;
  if (topo0 === 0) {
    rec.push('ifguard', 'p == NULL || p->topo == 0? Sim: a pilha está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifguard', 'p == NULL || p->topo == 0? Não: há elementos.');
  i = topo0 - 1;
  rec.push('icount', `i = p->topo - 1: começa no topo (posição ${i}).`);
  while (i >= 0 && rec.state.dados[i] !== valor) {
    rec.push('while', `i >= 0 && p->dados[i] != valor? Sim: dados[${i}] = ${rec.state.dados[i]} != ${valor}.`, { cell: i });
    i -= 1;
    rec.push('dec', `i--: ${i < 0 ? 'saiu da base' : `agora i = ${i}`}.`);
  }
  rec.push('while', i < 0 ? 'i >= 0 && ...? Não: a base foi ultrapassada.' : `i >= 0 && p->dados[i] != valor? Não: dados[${i}] == ${valor}. Achou!`, i >= 0 ? { cell: i } : {});
  if (i < 0) {
    rec.push('ifnao', 'i < 0? Sim: não achou.');
    rec.ret('retnao', `return 1: ${valor} não está na pilha, nada foi removido.`);
    return done(rec);
  }
  rec.push('ifnao', 'i < 0? Não: o valor foi encontrado.');
  while (i < rec.state.fields.topo - 1) {
    rec.push('while2', `i < p->topo - 1? Sim (${i} < ${rec.state.fields.topo - 1}): ainda há elementos acima para descer.`);
    rec.state = setCell(rec.state, i, rec.state.dados[i + 1]);
    rec.push('shift', `p->dados[i] = p->dados[i + 1]: o valor ${rec.state.dados[i]} desce da posição ${i + 1} para a ${i}.`, { cell: i });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while2', `i < p->topo - 1? Não: todos os de cima já desceram.`);
  const topo = rec.state.fields.topo;
  rec.state = setF(rec.state, 'topo', topo - 1);
  rec.push('topodec', `p->topo--: topo vai de ${topo} para ${topo - 1}.`, { field: 'topo' });
  rec.ret('ret0', `return 0: ${valor} removido.`);
  return done(rec);
}

// ---------------------------------------------------------------- FILA (vetor circular)

const idxFila = (m, k) => (m.fields.inicio + k) % m.max;

export function filaInserir(mem, valor) {
  const rec = createArrayRecorder('inserir', mem);
  const { max } = mem;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor)];
  rec.push('sig', `Chamada inserir(f, ${valor}): vamos colocar ${valor} no final da fila.`);
  const { qtd, final } = rec.state.fields;
  if (qtd >= max) {
    rec.push('ifok', `f->qtd < MAX && f != NULL? Não: qtd (${qtd}) == MAX (${max}), a fila está cheia.`);
    rec.ret('ret1', 'return 1: fila cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifok', `f->qtd < MAX && f != NULL? Sim: qtd = ${qtd} < MAX = ${max}.`);
  rec.state = setCell(rec.state, final, valor);
  rec.push('setdado', `f->dados[f->final] = valor: grava ${valor} na posição ${final}.`, { cell: final });
  const novo = (final + 1) % max;
  rec.state = setF(rec.state, 'final', novo);
  rec.push('setfinal', `f->final = (f->final + 1) % MAX: final vai de ${final} para ${novo}${final + 1 === max ? ' — deu a volta no vetor (circular)!' : ''}.`, { field: 'final' });
  rec.state = setF(rec.state, 'qtd', qtd + 1);
  rec.push('qtdinc', `f->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret0', 'return 0: inserido com sucesso.');
  return done(rec);
}

export function filaRemover(mem) {
  const rec = createArrayRecorder('remover', mem);
  const { max } = mem;
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada remover(f): vamos retirar o primeiro da fila.');
  const { qtd, inicio } = rec.state.fields;
  if (qtd === 0) {
    rec.push('ifvazia', 'f->qtd == 0 || f == NULL? Sim: a fila está vazia.');
    rec.ret('ret1', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifvazia', `f->qtd == 0 || f == NULL? Não: qtd = ${qtd}.`);
  const novo = (inicio + 1) % max;
  rec.state = setF(rec.state, 'inicio', novo);
  rec.push('setinicio', `f->inicio = (f->inicio + 1) % MAX: inicio vai de ${inicio} para ${novo}${inicio + 1 === max ? ' — deu a volta no vetor!' : ''}. O valor ${rec.state.dados[inicio]} não é apagado, só fica fora da fila.`, { field: 'inicio', cell: inicio });
  rec.state = setF(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `f->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret0', 'return 0: removido com sucesso.');
  return done(rec);
}

export function filaAcessar(mem) {
  const rec = createArrayRecorder('acessar', mem);
  let out = null;
  rec.makeVars = () => [arrDescVar(rec.state), outParam('valor', out)];
  rec.push('sig', 'Chamada acessar(f, &x): vamos ler o primeiro da fila sem remover.');
  const { qtd, inicio } = rec.state.fields;
  if (qtd === 0) {
    rec.push('ifvazia', 'f->qtd == 0 || f == NULL? Sim: a fila está vazia.');
    rec.ret('ret1', 'return 1: não há o que ler.');
    return done(rec);
  }
  rec.push('ifvazia', `f->qtd == 0 || f == NULL? Não: qtd = ${qtd}.`);
  out = rec.state.dados[inicio];
  rec.push('setout', `*valor = f->dados[f->inicio]: lê a posição ${inicio} e grava ${out} em x.`, { cell: inicio });
  rec.ret('ret0', `return 0: x do chamador vale ${out}.`);
  return done(rec);
}

export function filaTamanho(mem) {
  const rec = createArrayRecorder('tamanho', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada tamanho(f): quantos elementos há na fila?');
  rec.push('ifp', 'f == NULL? Não: a fila existe.');
  rec.ret('ret', `return f->qtd: devolve ${rec.state.fields.qtd}.`);
  return done(rec);
}

export function filaDestruir(mem) {
  const rec = createArrayRecorder('destruir', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada destruir(f): vamos liberar a fila.');
  rec.push('ifp', 'f != NULL? Sim: a fila existe.');
  rec.state = destroyedMem(rec.state);
  rec.push('freedesc', 'free(f): a struct inteira (vetor dados incluído) é devolvida de uma só vez. A variável f do chamador fica pendente.');
  rec.ret('freedesc', 'Fim de destruir.');
  return done(rec);
}

// busca_valor / remove_valor (AUTORAIS): i é a posição LÓGICA (0 = frente); a célula real é (inicio + i) % MAX
export function filaBusca(mem, valor) {
  const rec = createArrayRecorder('busca_valor', mem);
  let i = null;
  let pos = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), outParam('pos', pos), ...(i === null ? [] : [idxVar('i', i, idxFila(rec.state, i))])];
  rec.push('sig', `Chamada busca_valor(f, ${valor}, &pos): procurar ${valor} da frente para o fim. pos aponta para uma variável do chamador.`);
  const qtd = rec.state.fields.qtd;
  if (qtd === 0) {
    rec.push('ifguard', 'f == NULL || f->qtd == 0? Sim: a fila está vazia.');
    rec.ret('retguard', 'return 1: valor não encontrado (fila vazia).');
    return done(rec);
  }
  rec.push('ifguard', 'f == NULL || f->qtd == 0? Não: há elementos.');
  i = 0;
  rec.push('icount', 'i = 0: i é a posição lógica (0 = frente da fila).');
  while (i < qtd) {
    const cell = idxFila(rec.state, i);
    rec.push('while', `i < f->qtd? Sim (${i} < ${qtd}).`, { cell });
    const v = rec.state.dados[cell];
    if (v === valor) {
      rec.push('ifigual', `f->dados[(f->inicio + i) % MAX] == valor? Sim: dados[${cell}] = ${v}. Achou!`, { cell });
      pos = i;
      rec.push('setpos', `*pos = i: grava ${i} (posição na fila) na variável do chamador.`, { cell });
      rec.ret('ret0', `return 0: ${valor} está na posição ${i} da fila (célula ${cell} do vetor).`);
      return done(rec);
    }
    rec.push('ifigual', `f->dados[(f->inicio + i) % MAX] == valor? Não: dados[${cell}] = ${v} != ${valor}.`, { cell });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while', `i < f->qtd? Não (${i} == ${qtd}).`);
  rec.ret('retnao', `return 1: ${valor} não está na fila.`);
  return done(rec);
}

export function filaRemove(mem, valor) {
  const rec = createArrayRecorder('remove_valor', mem);
  const { max } = mem;
  let i = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), ...(i === null ? [] : [idxVar('i', i, idxFila(rec.state, i))])];
  rec.push('sig', `Chamada remove_valor(f, ${valor}): remover o primeiro ${valor} da fila e fechar o buraco.`);
  const qtd0 = rec.state.fields.qtd;
  if (qtd0 === 0) {
    rec.push('ifguard', 'f == NULL || f->qtd == 0? Sim: a fila está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifguard', 'f == NULL || f->qtd == 0? Não: há elementos.');
  i = 0;
  rec.push('icount', 'i = 0: posição lógica (0 = frente).');
  while (i < qtd0 && rec.state.dados[idxFila(rec.state, i)] !== valor) {
    rec.push('while', `i < f->qtd && ... != valor? Sim: dados[${idxFila(rec.state, i)}] = ${rec.state.dados[idxFila(rec.state, i)]} != ${valor}.`, { cell: idxFila(rec.state, i) });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while', i === qtd0 ? `i < f->qtd && ...? Não (${i} == ${qtd0}): percorreu tudo.` : `i < f->qtd && ... != valor? Não: achou o ${valor}.`, i < qtd0 ? { cell: idxFila(rec.state, i) } : {});
  if (i === qtd0) {
    rec.push('ifnao', 'i == f->qtd? Sim: não achou.');
    rec.ret('retnao', `return 1: ${valor} não está na fila, nada foi removido.`);
    return done(rec);
  }
  rec.push('ifnao', 'i == f->qtd? Não: foi encontrado.');
  while (i < qtd0 - 1) {
    rec.push('while2', `i < f->qtd - 1? Sim (${i} < ${qtd0 - 1}): ainda há elementos depois para puxar.`);
    const to = idxFila(rec.state, i);
    const from = idxFila(rec.state, i + 1);
    rec.state = setCell(rec.state, to, rec.state.dados[from]);
    rec.push('shift', `dados[(inicio + i) % MAX] = dados[(inicio + i + 1) % MAX]: copia a célula ${from} para a ${to}.`, { cell: to });
    i += 1;
    rec.push('inc2', `i++: i = ${i}.`);
  }
  rec.push('while2', 'i < f->qtd - 1? Não: todos já foram puxados.');
  const final = rec.state.fields.final;
  const novo = (final - 1 + max) % max;
  rec.state = setF(rec.state, 'final', novo);
  rec.push('setfinal', `f->final = (f->final - 1 + MAX) % MAX: final recua de ${final} para ${novo}. (O "+ MAX" evita resultado negativo.)`, { field: 'final' });
  rec.state = setF(rec.state, 'qtd', qtd0 - 1);
  rec.push('qtddec', `f->qtd--: a quantidade cai de ${qtd0} para ${qtd0 - 1}.`, { field: 'qtd' });
  rec.ret('ret0', `return 0: ${valor} removido.`);
  return done(rec);
}

// ---------------------------------------------------------------- LISTA SEQUENCIAL (AUTORAL)

export function listaInserirInicio(mem, valor) {
  const rec = createArrayRecorder('inserir_inicio', mem);
  let i = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), ...(i === null ? [] : [idxVar('i', i, Math.min(i, mem.max - 1))])];
  rec.push('sig', `Chamada inserir_inicio(li, ${valor}): colocar ${valor} na posição 0, empurrando os outros para a direita.`);
  const qtd = rec.state.fields.qtd;
  if (qtd >= mem.max) {
    rec.push('ifguard', `li == NULL || li->qtd == MAX? Sim: qtd = ${qtd} == MAX, o vetor está cheio.`);
    rec.ret('retguard', 'return 1: lista cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifguard', `li == NULL || li->qtd == MAX? Não: qtd = ${qtd} < MAX = ${mem.max}.`);
  i = qtd;
  rec.push('icount', `i = li->qtd: começa na primeira posição livre (${i}).`);
  while (i > 0) {
    rec.push('while', `i > 0? Sim: i = ${i}.`);
    rec.state = setCell(rec.state, i, rec.state.dados[i - 1]);
    rec.push('shift', `li->dados[i] = li->dados[i - 1]: copia ${rec.state.dados[i]} da posição ${i - 1} para a ${i} (abre espaço).`, { cell: i });
    i -= 1;
    rec.push('dec', `i--: i = ${i}.`);
  }
  rec.push('while', 'i > 0? Não: chegamos à posição 0.');
  rec.state = setCell(rec.state, 0, valor);
  rec.push('setdado', `li->dados[0] = valor: grava ${valor} na posição 0.`, { cell: 0 });
  rec.state = setF(rec.state, 'qtd', qtd + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret0', 'return 0: inserido com sucesso.');
  return done(rec);
}

export function listaInserirFinal(mem, valor) {
  const rec = createArrayRecorder('inserir_final', mem);
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor)];
  rec.push('sig', `Chamada inserir_final(li, ${valor}): colocar ${valor} depois do último elemento.`);
  const qtd = rec.state.fields.qtd;
  if (qtd >= mem.max) {
    rec.push('ifguard', `li == NULL || li->qtd == MAX? Sim: qtd = ${qtd} == MAX, o vetor está cheio.`);
    rec.ret('retguard', 'return 1: lista cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifguard', `li == NULL || li->qtd == MAX? Não: qtd = ${qtd} < MAX = ${mem.max}.`);
  rec.state = setCell(rec.state, qtd, valor);
  rec.push('setdado', `li->dados[li->qtd] = valor: grava ${valor} na posição ${qtd} (qtd já é a próxima posição livre).`, { cell: qtd });
  rec.state = setF(rec.state, 'qtd', qtd + 1);
  rec.push('qtdinc', `li->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret0', 'return 0: inserido com sucesso.');
  return done(rec);
}

export function listaRemoverInicio(mem) {
  const rec = createArrayRecorder('remover_inicio', mem);
  let i = null;
  rec.makeVars = () => [arrDescVar(rec.state), ...(i === null ? [] : [idxVar('i', i)])];
  rec.push('sig', 'Chamada remover_inicio(li): retirar a posição 0, puxando os outros para a esquerda.');
  const qtd = rec.state.fields.qtd;
  if (qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifguard', `li == NULL || li->qtd == 0? Não: qtd = ${qtd}.`);
  i = 0;
  rec.push('icount', 'i = 0: começa na posição 0.');
  while (i < qtd - 1) {
    rec.push('while', `i < li->qtd - 1? Sim (${i} < ${qtd - 1}).`);
    rec.state = setCell(rec.state, i, rec.state.dados[i + 1]);
    rec.push('shift', `li->dados[i] = li->dados[i + 1]: copia ${rec.state.dados[i]} da posição ${i + 1} para a ${i}.`, { cell: i });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while', `i < li->qtd - 1? Não (${i} == ${qtd - 1}): todos já foram puxados.`);
  rec.state = setF(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}. A última posição (${qtd - 1}) ainda guarda uma cópia antiga, mas já está fora da lista.`, { field: 'qtd' });
  rec.ret('ret0', 'return 0: removido com sucesso.');
  return done(rec);
}

export function listaRemoverFinal(mem) {
  const rec = createArrayRecorder('remover_final', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada remover_final(li): retirar o último elemento.');
  const qtd = rec.state.fields.qtd;
  if (qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifguard', `li == NULL || li->qtd == 0? Não: qtd = ${qtd}.`);
  rec.state = setF(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}. Basta isso: o valor ${rec.state.dados[qtd - 1]} continua na posição ${qtd - 1}, mas fica fora da lista.`, { field: 'qtd', cell: qtd - 1 });
  rec.ret('ret0', 'return 0: removido com sucesso.');
  return done(rec);
}

export function listaTamanho(mem) {
  const rec = createArrayRecorder('tamanho_lista', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada tamanho_lista(li): quantos elementos há?');
  rec.push('ifp', 'li == NULL? Não: a lista existe.');
  rec.ret('ret', `return li->qtd: devolve ${rec.state.fields.qtd} (no vetor não precisa percorrer: qtd já guarda a resposta).`);
  return done(rec);
}

export function listaBusca(mem, valor) {
  const rec = createArrayRecorder('busca_valor', mem);
  let i = null;
  let pos = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), outParam('pos', pos), ...(i === null ? [] : [idxVar('i', i, Math.min(i, mem.max - 1))])];
  rec.push('sig', `Chamada busca_valor(li, ${valor}, &pos): procurar ${valor}. pos aponta para uma variável do chamador.`);
  const qtd = rec.state.fields.qtd;
  if (qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: valor não encontrado (lista vazia).');
    return done(rec);
  }
  rec.push('ifguard', 'li == NULL || li->qtd == 0? Não: há elementos.');
  i = 0;
  rec.push('icount', 'i = 0: começa na posição 0.');
  while (i < qtd) {
    rec.push('while', `i < li->qtd? Sim (${i} < ${qtd}).`, { cell: i });
    const v = rec.state.dados[i];
    if (v === valor) {
      rec.push('ifigual', `li->dados[i] == valor? Sim: dados[${i}] = ${v}. Achou!`, { cell: i });
      pos = i;
      rec.push('setpos', `*pos = i: grava ${i} na variável do chamador.`, { cell: i });
      rec.ret('ret0', `return 0: ${valor} está na posição ${i}.`);
      return done(rec);
    }
    rec.push('ifigual', `li->dados[i] == valor? Não: dados[${i}] = ${v} != ${valor}.`, { cell: i });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while', `i < li->qtd? Não (${i} == ${qtd}).`);
  rec.ret('retnao', `return 1: ${valor} não está na lista.`);
  return done(rec);
}

export function listaRemove(mem, valor) {
  const rec = createArrayRecorder('remove_valor', mem);
  let i = null;
  rec.makeVars = () => [arrDescVar(rec.state), plainInt('valor', valor), ...(i === null ? [] : [idxVar('i', i, Math.min(i, mem.max - 1))])];
  rec.push('sig', `Chamada remove_valor(li, ${valor}): remover o primeiro ${valor} e fechar o buraco.`);
  const qtd = rec.state.fields.qtd;
  if (qtd === 0) {
    rec.push('ifguard', 'li == NULL || li->qtd == 0? Sim: a lista está vazia.');
    rec.ret('retguard', 'return 1: não há o que remover.');
    return done(rec);
  }
  rec.push('ifguard', 'li == NULL || li->qtd == 0? Não: há elementos.');
  i = 0;
  rec.push('icount', 'i = 0: começa na posição 0.');
  while (i < qtd && rec.state.dados[i] !== valor) {
    rec.push('while', `i < li->qtd && li->dados[i] != valor? Sim: dados[${i}] = ${rec.state.dados[i]} != ${valor}.`, { cell: i });
    i += 1;
    rec.push('inc', `i++: i = ${i}.`);
  }
  rec.push('while', i === qtd ? `i < li->qtd && ...? Não (${i} == ${qtd}): percorreu tudo.` : `i < li->qtd && ...? Não: dados[${i}] == ${valor}. Achou!`, i < qtd ? { cell: i } : {});
  if (i === qtd) {
    rec.push('ifnao', 'i == li->qtd? Sim: não achou.');
    rec.ret('retnao', `return 1: ${valor} não está na lista, nada foi removido.`);
    return done(rec);
  }
  rec.push('ifnao', 'i == li->qtd? Não: foi encontrado.');
  while (i < qtd - 1) {
    rec.push('while2', `i < li->qtd - 1? Sim (${i} < ${qtd - 1}): ainda há elementos à direita.`);
    rec.state = setCell(rec.state, i, rec.state.dados[i + 1]);
    rec.push('shift', `li->dados[i] = li->dados[i + 1]: copia ${rec.state.dados[i]} da posição ${i + 1} para a ${i}.`, { cell: i });
    i += 1;
    rec.push('inc2', `i++: i = ${i}.`);
  }
  rec.push('while2', 'i < li->qtd - 1? Não: todos já foram puxados.');
  rec.state = setF(rec.state, 'qtd', qtd - 1);
  rec.push('qtddec', `li->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret0', `return 0: ${valor} removido.`);
  return done(rec);
}

export function listaDestruir(mem) {
  const rec = createArrayRecorder('destruir', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada destruir(li): vamos liberar a lista.');
  rec.push('ifp', 'li != NULL? Sim: a lista existe.');
  rec.state = destroyedMem(rec.state);
  rec.push('freedesc', 'free(li): a struct inteira (vetor dados incluído) é devolvida de uma só vez. A variável li do chamador fica pendente.');
  rec.ret('freedesc', 'Fim de destruir.');
  return done(rec);
}
