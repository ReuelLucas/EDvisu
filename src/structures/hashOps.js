// Tabela hash (Tabela-hash/1_tabela_hash.c): vetor de ponteiros int **itens, SEM tratamento de colisão.
// criaHash, liberaHash, chaveDivisao, insereHash_* e buscaHash_SemColisao vêm do repositório;
// removeHash_SemColisao é AUTORAL (não existe no repositório).
import {
  ARRAY_ADDR, HASH_SIZE, arrDescVar, createArrayRecorder, emptyHashAfterDestroy, hashPos, heapAddress, heapVar,
  idxVar, outParam, plainInt,
} from '../arrayModel';

const done = (rec) => ({ steps: rec.steps, list: rec.state });
const setSlot = (m, i, v) => ({ ...m, slots: m.slots.map((x, k) => (k === i ? v : x)) });
const setFields = (m, patch) => ({ ...m, fields: { ...m.fields, ...patch } });
const setParts = (m, patch) => ({ ...m, parts: { ...m.parts, ...patch } });
const addInt = (m, valor) => {
  const id = `h${m.nextId}`;
  return { id, mem: { ...m, heap: { ...m.heap, [id]: { valor } }, nextId: m.nextId + 1 } };
};

// Chamada a chaveDivisao: três passos (linha da chamada, entrada e return da função chamada)
function callChave(rec, chave, size, line, ctx) {
  const frame = [plainInt('chave', chave), plainInt('TABLE_SIZE', size)];
  rec.push(line, `${ctx}: chama chaveDivisao(${chave}, ${size}) para descobrir em qual posição do vetor o valor deve ficar.`);
  rec.push('sig', `Chamada chaveDivisao(${chave}, ${size}): a função de hashing transforma a chave em um índice entre 0 e ${size - 1}.`, { fn: 'chaveDivisao', vars: frame });
  const masked = chave & 0x7fffffff;
  const pos = hashPos(chave, size);
  rec.push(
    'ret',
    `return (chave & 0x7FFFFFFF) % TABLE_SIZE: ${chave < 0 ? `a máscara tira o bit de sinal (${chave} vira ${masked}); ` : ''}${masked} % ${size} = ${pos}. Esse é o índice.`,
    { fn: 'chaveDivisao', vars: frame },
  );
  return pos;
}

const baseVars = (rec) => [arrDescVar(rec.state)];

// ---------- insereHash_SemColisao_Rejeita ----------
export function hashInsereRejeita(mem, valor) {
  const rec = createArrayRecorder('insereHash_SemColisao_Rejeita', mem);
  let pos = null;
  let novo = null;
  rec.makeVars = () => [
    ...baseVars(rec), plainInt('valor', valor),
    ...(pos === null ? [] : [idxVar('pos', pos)]),
    ...(novo === null ? [] : [heapVar('novo', novo, rec.state, rec.ghosts)]),
  ];
  rec.push('sig', `Chamada insereHash_SemColisao_Rejeita(ha, ${valor}): inserir ${valor}; se a posição já estiver ocupada, rejeita.`);
  const { qtd, TABLE_SIZE } = rec.state.fields;
  if (qtd === TABLE_SIZE) {
    rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Sim: a tabela está cheia (${qtd} de ${TABLE_SIZE}).`);
    rec.ret('ifguard', 'return 0: tabela cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Não: qtd = ${qtd}, TABLE_SIZE = ${TABLE_SIZE}.`);
  pos = callChave(rec, valor, TABLE_SIZE, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${pos}: de volta a insereHash..., pos guarda o índice devolvido.`, { cell: pos });

  const ocupante = rec.state.slots[pos];
  if (ocupante !== null) {
    rec.push('ifcol', `ha->itens[pos] != NULL? Sim: a posição ${pos} já guarda ${rec.state.heap[ocupante].valor}. Colisão! Esta versão simplesmente rejeita.`, { cell: pos });
    rec.ret('retcol', `return 0: ${valor} NÃO foi inserido, porque ${valor} e ${rec.state.heap[ocupante].valor} caem na mesma posição (${pos}).`);
    return done(rec);
  }
  rec.push('ifcol', `ha->itens[pos] != NULL? Não: a posição ${pos} está livre (NULL).`, { cell: pos });

  const a = addInt(rec.state, null);
  rec.state = a.mem;
  novo = a.id;
  rec.push('malloc', `novo = malloc(sizeof(int)): reserva um int no heap (endereço ${heapAddress(novo)}). Ainda contém lixo (?).`);
  rec.push('ifnovo', 'novo == NULL? Não: a alocação deu certo.');
  rec.state = { ...rec.state, heap: { ...rec.state.heap, [novo]: { valor } } };
  rec.push('setnovo', `*novo = valor: guarda ${valor} dentro do int alocado.`);
  rec.state = setSlot(rec.state, pos, novo);
  rec.push('setslot', `ha->itens[pos] = novo: a posição ${pos} do vetor passa a apontar para o int que guarda ${valor}.`, { cell: pos });
  rec.state = setFields(rec.state, { qtd: qtd + 1 });
  rec.push('qtdinc', `ha->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: ${valor} inserido na posição ${pos}.`);
  return done(rec);
}

// ---------- insereHash_SemColisao_Sobrescreve ----------
export function hashInsereSobrescreve(mem, valor) {
  const rec = createArrayRecorder('insereHash_SemColisao_Sobrescreve', mem);
  let pos = null;
  let novo = null;
  rec.makeVars = () => [
    ...baseVars(rec), plainInt('valor', valor),
    ...(pos === null ? [] : [idxVar('pos', pos)]),
    ...(novo === null ? [] : [heapVar('novo', novo, rec.state, rec.ghosts)]),
  ];
  rec.push('sig', `Chamada insereHash_SemColisao_Sobrescreve(ha, ${valor}): inserir ${valor}; se a posição estiver ocupada, o valor antigo é substituído.`);
  rec.push('ifguard', 'ha == NULL? Não: a tabela existe.');
  const size = rec.state.fields.TABLE_SIZE;
  pos = callChave(rec, valor, size, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${pos}: de volta a insereHash..., pos guarda o índice devolvido.`, { cell: pos });

  const a = addInt(rec.state, null);
  rec.state = a.mem;
  novo = a.id;
  rec.push('malloc', `novo = malloc(sizeof(int)): reserva um int no heap (endereço ${heapAddress(novo)}). Ainda contém lixo (?).`);
  rec.push('ifnovo', 'novo == NULL? Não: a alocação deu certo.');
  rec.state = { ...rec.state, heap: { ...rec.state.heap, [novo]: { valor } } };
  rec.push('setnovo', `*novo = valor: guarda ${valor} dentro do int alocado.`);

  const antigo = rec.state.slots[pos];
  if (antigo !== null) {
    const velho = rec.state.heap[antigo].valor;
    rec.push('ifocupado', `ha->itens[pos] != NULL? Sim: a posição ${pos} guarda ${velho}. Vai ser substituído (colisão resolvida "na marra").`, { cell: pos });
    rec.freeInt(antigo);
    rec.push('freeold', `free(ha->itens[pos]): o int antigo (${velho}) é devolvido ao sistema. O vetor ainda aponta para ele por um instante (ponteiro pendente).`, { cell: pos });
  } else {
    rec.push('ifocupado', `ha->itens[pos] != NULL? Não: a posição ${pos} estava vazia.`, { cell: pos });
    const qtd = rec.state.fields.qtd;
    rec.state = setFields(rec.state, { qtd: qtd + 1 });
    rec.push('qtdinc', `ha->qtd++: ocupamos um slot que estava vazio, então a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  }
  rec.state = setSlot(rec.state, pos, novo);
  rec.push('setslot', `ha->itens[pos] = novo: a posição ${pos} passa a apontar para o int que guarda ${valor}.`, { cell: pos });
  rec.ret('ret1', `return 1: ${valor} está na posição ${pos}${antigo !== null ? ' (substituiu o valor antigo)' : ''}.`);
  return done(rec);
}

// ---------- buscaHash_SemColisao (a "busca_valor" da hash) ----------
export function hashBusca(mem, chave) {
  const rec = createArrayRecorder('buscaHash_SemColisao', mem);
  let pos = null;
  let out = null;
  rec.makeVars = () => [...baseVars(rec), plainInt('chave', chave), outParam('out', out), ...(pos === null ? [] : [idxVar('pos', pos)])];
  rec.push('sig', `Chamada buscaHash_SemColisao(ha, ${chave}, &x): procurar ${chave}. out aponta para uma variável x do chamador.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  pos = callChave(rec, chave, rec.state.fields.TABLE_SIZE, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${pos}: só a posição ${pos} precisa ser examinada — não há varredura! (é isso que torna a hash rápida).`, { cell: pos });
  const id = rec.state.slots[pos];
  if (id === null) {
    rec.push('ifvazio', `ha->itens[pos] == NULL? Sim: a posição ${pos} está vazia.`, { cell: pos });
    rec.ret('retvazio', `return 0: ${chave} não está na tabela.`);
    return done(rec);
  }
  rec.push('ifvazio', `ha->itens[pos] == NULL? Não: a posição ${pos} aponta para um int.`, { cell: pos });
  const guardado = rec.state.heap[id].valor;
  if (guardado !== chave) {
    rec.push('ifdiff', `*(ha->itens[pos]) != chave? Sim: a posição ${pos} guarda ${guardado}, não ${chave}. Outro valor ocupa o lugar (colisão).`, { cell: pos });
    rec.ret('retdiff', `return 0: ${chave} não está na tabela (a posição ${pos} pertence ao ${guardado}).`);
    return done(rec);
  }
  rec.push('ifdiff', `*(ha->itens[pos]) != chave? Não: ${guardado} == ${chave}, é o valor procurado.`, { cell: pos });
  out = guardado;
  rec.push('setout', `*out = *(ha->itens[pos]): copia ${guardado} para a variável x do chamador.`, { cell: pos });
  rec.ret('ret1', `return 1: ${chave} encontrado na posição ${pos}.`);
  return done(rec);
}

// ---------- removeHash_SemColisao (AUTORAL) ----------
export function hashRemove(mem, chave) {
  const rec = createArrayRecorder('removeHash_SemColisao', mem);
  let pos = null;
  rec.makeVars = () => [...baseVars(rec), plainInt('chave', chave), ...(pos === null ? [] : [idxVar('pos', pos)])];
  rec.push('sig', `Chamada removeHash_SemColisao(ha, ${chave}): remover ${chave} da tabela.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  pos = callChave(rec, chave, rec.state.fields.TABLE_SIZE, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${pos}: só a posição ${pos} precisa ser examinada.`, { cell: pos });
  const id = rec.state.slots[pos];
  if (id === null) {
    rec.push('ifvazio', `ha->itens[pos] == NULL? Sim: a posição ${pos} está vazia.`, { cell: pos });
    rec.ret('retvazio', `return 0: ${chave} não está na tabela, nada foi removido.`);
    return done(rec);
  }
  rec.push('ifvazio', `ha->itens[pos] == NULL? Não: a posição ${pos} aponta para um int.`, { cell: pos });
  const guardado = rec.state.heap[id].valor;
  if (guardado !== chave) {
    rec.push('ifdiff', `*(ha->itens[pos]) != chave? Sim: a posição ${pos} guarda ${guardado}, não ${chave}.`, { cell: pos });
    rec.ret('retdiff', `return 0: ${chave} não está na tabela; o ${guardado} NÃO é removido.`);
    return done(rec);
  }
  rec.push('ifdiff', `*(ha->itens[pos]) != chave? Não: ${guardado} == ${chave}, é o valor a remover.`, { cell: pos });
  rec.freeInt(id);
  rec.push('free', `free(ha->itens[pos]): o int que guardava ${guardado} é devolvido. A posição ${pos} ainda aponta para ele (pendente) por um instante.`, { cell: pos });
  rec.state = setSlot(rec.state, pos, null);
  rec.push('setnull', `ha->itens[pos] = NULL: a posição ${pos} volta a ser "vazia". Sem isto ficaria um ponteiro pendente.`, { cell: pos });
  const qtd = rec.state.fields.qtd;
  rec.state = setFields(rec.state, { qtd: qtd - 1 });
  rec.push('qtddec', `ha->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: ${chave} removido.`);
  return done(rec);
}

// ---------- liberaHash (o "destruir" da hash) ----------
export function hashLibera(mem) {
  const rec = createArrayRecorder('liberaHash', mem);
  let i = null;
  rec.makeVars = () => [...baseVars(rec), ...(i === null ? [] : [idxVar('i', i, Math.min(i, mem.max - 1))])];
  rec.push('sig', 'Chamada liberaHash(ha): devolver TODA a memória da tabela — cada int, depois o vetor de ponteiros e por fim a struct.');
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  const size = rec.state.fields.TABLE_SIZE;
  i = 0;
  rec.push('for', `for (int i = 0; ...): i começa em 0. (i < TABLE_SIZE? ${0} < ${size}: Sim)`);
  while (i < size) {
    const id = rec.state.slots[i];
    if (id !== null && id !== undefined) {
      rec.push('ifslot', `ha->itens[i] != NULL? Sim: a posição ${i} aponta para um int (${rec.state.heap[id].valor}).`, { cell: i });
      const v = rec.state.heap[id].valor;
      rec.freeInt(id);
      rec.push('freeint', `free(ha->itens[i]): o int ${v} é devolvido. Se não fizéssemos isso, ele ficaria "vazando" (leak): a struct sumiria e ninguém mais saberia onde ele está.`, { cell: i });
    } else {
      rec.push('ifslot', `ha->itens[i] != NULL? Não: a posição ${i} está vazia, nada a liberar.`, { cell: i });
    }
    i += 1;
    rec.push('for', i < size ? `i++: i = ${i}. i < TABLE_SIZE? Sim.` : `i++: i = ${i}. i < TABLE_SIZE? Não: o laço termina.`);
  }
  i = null;
  rec.state = setParts(rec.state, { vec: 'freed' });
  rec.push('freeitens', `free(ha->itens): agora o vetor de ponteiros (${size} posições) é devolvido. ha->itens fica pendente.`);
  rec.state = { ...setParts(rec.state, { desc: 'freed' }), destroyed: true };
  rec.push('freeha', 'free(ha): por último, a própria struct Hash. A ordem importa: se liberássemos ha primeiro, perderíamos o acesso a ha->itens e aos ints.');
  rec.ret('freeha', 'Fim de liberaHash. A variável ha do chamador fica pendente.');
  return done(rec);
}

// ---------- criaHash (só depois de liberaHash) ----------
export function hashCria(mem) {
  const m0 = emptyHashAfterDestroy(mem);
  const rec = createArrayRecorder('criaHash', { ...m0, destroyed: false });
  let haDeclared = false;
  let i = null;
  rec.makeVars = () => [
    plainInt('TABLE_SIZE', HASH_SIZE),
    ...(haDeclared ? [{ ...arrDescVar(rec.state), name: 'ha', pointee: 'Hash' }] : []),
    ...(i === null ? [] : [idxVar('i', i, Math.min(i, HASH_SIZE - 1))]),
  ];
  rec.push('sig', `Chamada criaHash(${HASH_SIZE}): construir uma tabela nova com ${HASH_SIZE} posições, todas vazias.`);
  haDeclared = true;
  rec.state = setParts(setFields(rec.state, { qtd: undefined, TABLE_SIZE: undefined }), { desc: 'live' });
  rec.push('mallocha', `Hash *ha = malloc(sizeof(Hash)): reserva a struct (endereço ${ARRAY_ADDR.desc}). Os campos ainda têm lixo (?).`);
  rec.push('ifha', 'ha != NULL? Sim: a alocação deu certo.');
  rec.state = setFields(rec.state, { TABLE_SIZE: HASH_SIZE });
  rec.push('settable', `ha->TABLE_SIZE = TABLE_SIZE: guarda ${HASH_SIZE}.`, { field: 'TABLE_SIZE' });
  rec.state = setFields(rec.state, { qtd: 0 });
  rec.push('setqtd', 'ha->qtd = 0: a tabela começa sem elementos.', { field: 'qtd' });
  rec.state = setParts(rec.state, { vec: 'live' });
  rec.push('mallocitens', `ha->itens = malloc(TABLE_SIZE * sizeof(int*)): reserva um vetor de ${HASH_SIZE} ponteiros (endereço ${ARRAY_ADDR.vec}). As posições têm lixo (?).`, { field: 'itens' });
  rec.push('ifitens', 'ha->itens == NULL? Não: a alocação deu certo.');
  i = 0;
  rec.push('for', `for (int i = 0; ...): i começa em 0 (i < ${HASH_SIZE}: Sim).`);
  while (i < HASH_SIZE) {
    rec.state = setSlot(rec.state, i, null);
    rec.push('setnull', `ha->itens[i] = NULL: a posição ${i} fica vazia.`, { cell: i });
    i += 1;
    rec.push('for', i < HASH_SIZE ? `i++: i = ${i}. i < TABLE_SIZE? Sim.` : `i++: i = ${i}. i < TABLE_SIZE? Não: o laço termina.`);
  }
  i = null;
  rec.ret('ret', 'return ha: devolve o endereço da tabela pronta (todas as posições NULL).');
  return done(rec);
}

