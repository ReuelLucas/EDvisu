// Tabela hash com LISTA ENCADEADA (encadeamento separado). Código AUTORAL (tools/autoral/hash_encadeada.c);
// só chaveDivisao vem do repositório do professor.
import {
  ARRAY_ADDR, HASH_SIZE, arrDescVar, createArrayRecorder, emptyHashAfterDestroy, hashPos, heapAddress,
  idxVar, nodeVar, outParam, plainInt,
} from '../arrayModel';

const done = (rec) => ({ steps: rec.steps, list: rec.state });
const setSlot = (m, i, v) => ({ ...m, slots: m.slots.map((x, k) => (k === i ? v : x)) });
const setFields = (m, patch) => ({ ...m, fields: { ...m.fields, ...patch } });
const setParts = (m, patch) => ({ ...m, parts: { ...m.parts, ...patch } });
const setNode = (m, id, patch) => ({ ...m, heap: { ...m.heap, [id]: { ...m.heap[id], ...patch } } });

function callChave(rec, chave, size, line, ctx) {
  const frame = [plainInt('chave', chave), plainInt('TABLE_SIZE', size)];
  rec.push(line, `${ctx}: chama chaveDivisao(${chave}, ${size}) para descobrir em qual posição do vetor (qual cadeia) o valor pertence.`);
  rec.push('sig', `Chamada chaveDivisao(${chave}, ${size}): transforma a chave em um índice entre 0 e ${size - 1}.`, { fn: 'chaveDivisao', vars: frame });
  const pos = hashPos(chave, size);
  rec.push('ret', `return (chave & 0x7FFFFFFF) % TABLE_SIZE: ${chave & 0x7fffffff} % ${size} = ${pos}.`, { fn: 'chaveDivisao', vars: frame });
  return pos;
}

// contexto comum: ponteiros locais aux/ant/novo/prox e o índice pos
function setup(fn, mem, valor, extra = () => []) {
  const rec = createArrayRecorder(fn, mem);
  const st = { pos: null, aux: undefined, ant: undefined, novo: undefined, prox: undefined, i: null };
  const ptr = (name) => (st[name] === undefined ? [] : [nodeVar(name, st[name], rec.state, rec.ghosts)]);
  rec.makeVars = () => [
    arrDescVar(rec.state),
    ...(valor === undefined ? [] : [plainInt('valor', valor)]),
    ...extra(st),
    ...(st.i === null ? [] : [idxVar('i', st.i, Math.min(st.i, rec.state.max - 1))]),
    ...(st.pos === null ? [] : [idxVar('pos', st.pos)]),
    ...ptr('aux'), ...ptr('ant'), ...ptr('prox'), ...ptr('novo'),
  ];
  return { rec, st };
}

const val = (m, id) => m.heap[id].valor;

function prologue(rec, st, valor, fnName) {
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  st.pos = callChave(rec, valor, rec.state.fields.TABLE_SIZE, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${st.pos}: todos os valores com este índice ficam na MESMA cadeia (a lista ligada de ha->itens[${st.pos}]).`, { cell: st.pos });
  st.aux = rec.state.slots[st.pos];
  rec.push('auxinit', st.aux === null
    ? `No *aux = ha->itens[pos]: a posição ${st.pos} é NULL, ou seja, a cadeia está vazia.`
    : `No *aux = ha->itens[pos]: aux aponta para o primeiro nó da cadeia (${val(rec.state, st.aux)}).`, { cell: st.pos });
  return fnName;
}

// ---------- insereHash_Encadeada ----------
export function chainInsere(mem, valor) {
  const { rec, st } = setup('insereHash_Encadeada', mem, valor);
  rec.push('sig', `Chamada insereHash_Encadeada(ha, ${valor}): inserir ${valor}. Valores que colidem não se perdem: entram na cadeia da posição.`);
  prologue(rec, st, valor);
  let first = true;
  while (true) {
    const alive = st.aux !== null;
    rec.push('while', alive ? `aux != NULL? Sim: examina o nó com ${val(rec.state, st.aux)} (procura repetidos).` : 'aux != NULL? Não: chegou ao fim da cadeia, o valor ainda não existe.', { cell: st.pos });
    if (!alive) break;
    first = false;
    const v = val(rec.state, st.aux);
    if (v === valor) {
      rec.push('ifdup', `aux->valor == valor? Sim: ${v} == ${valor}, o valor já está na tabela.`, { cell: st.pos });
      rec.ret('retdup', `return 0: ${valor} já existe, nada foi inserido.`);
      return done(rec);
    }
    rec.push('ifdup', `aux->valor == valor? Não: ${v} != ${valor}.`, { cell: st.pos });
    st.aux = rec.state.heap[st.aux].prox;
    rec.push('avanca', st.aux === null ? 'aux = aux->prox: o próximo é NULL.' : `aux = aux->prox: avança para o nó ${val(rec.state, st.aux)}.`, { cell: st.pos });
  }
  const id = `h${rec.state.nextId}`;
  rec.state = { ...rec.state, heap: { ...rec.state.heap, [id]: { valor: null, prox: undefined } }, nextId: rec.state.nextId + 1 };
  st.novo = id;
  rec.push('malloc', `No *novo = malloc(sizeof(No)): reserva um nó no heap (endereço ${heapAddress(id)}). valor e prox ainda têm lixo (?).`);
  rec.push('ifnovo', 'novo == NULL? Não: a alocação deu certo.');
  rec.state = setNode(rec.state, id, { valor });
  rec.push('setvalor', `novo->valor = valor: o nó passa a guardar ${valor}.`);
  const head = rec.state.slots[st.pos];
  rec.state = setNode(rec.state, id, { prox: head });
  rec.push('setprox', head === null
    ? 'novo->prox = ha->itens[pos]: a cadeia estava vazia, então o prox do novo nó é NULL.'
    : `novo->prox = ha->itens[pos]: o novo nó aponta para o antigo primeiro (${val(rec.state, head)}).`, { cell: st.pos });
  rec.state = setSlot(rec.state, st.pos, id);
  rec.push('setslot', `ha->itens[pos] = novo: o novo nó vira o PRIMEIRO da cadeia ${st.pos}. (Inserir no início é O(1): não precisa percorrer até o fim.)`, { cell: st.pos });
  const qtd = rec.state.fields.qtd;
  rec.state = setFields(rec.state, { qtd: qtd + 1 });
  rec.push('qtdinc', `ha->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: ${valor} inserido na cadeia da posição ${st.pos}${head === null ? '' : ' (houve colisão, resolvida pela lista)'}.`);
  return done(rec);
}

// ---------- buscaHash_Encadeada ----------
export function chainBusca(mem, valor) {
  let out = null;
  const { rec, st } = setup('buscaHash_Encadeada', mem, valor, () => [outParam('out', out)]);
  rec.push('sig', `Chamada buscaHash_Encadeada(ha, ${valor}, &x): procurar ${valor}. out aponta para uma variável x do chamador.`);
  prologue(rec, st, valor);
  while (true) {
    const alive = st.aux !== null;
    rec.push('while', alive ? `aux != NULL? Sim: examina o nó com ${val(rec.state, st.aux)}.` : 'aux != NULL? Não: a cadeia acabou.', { cell: st.pos });
    if (!alive) break;
    const v = val(rec.state, st.aux);
    if (v === valor) {
      rec.push('ifach', `aux->valor == valor? Sim: ${v} == ${valor}, achou!`, { cell: st.pos });
      out = v;
      rec.push('setout', `*out = aux->valor: copia ${v} para a variável x do chamador.`, { cell: st.pos });
      rec.ret('ret1', `return 1: ${valor} encontrado na cadeia da posição ${st.pos}.`);
      return done(rec);
    }
    rec.push('ifach', `aux->valor == valor? Não: ${v} != ${valor}.`, { cell: st.pos });
    st.aux = rec.state.heap[st.aux].prox;
    rec.push('avanca', st.aux === null ? 'aux = aux->prox: o próximo é NULL.' : `aux = aux->prox: avança para o nó ${val(rec.state, st.aux)}.`, { cell: st.pos });
  }
  rec.ret('retfim', `return 0: ${valor} não está na tabela (só foi preciso olhar a cadeia ${st.pos}, não a tabela inteira).`);
  return done(rec);
}

// ---------- removeHash_Encadeada ----------
export function chainRemove(mem, valor) {
  const { rec, st } = setup('removeHash_Encadeada', mem, valor);
  rec.push('sig', `Chamada removeHash_Encadeada(ha, ${valor}): remover ${valor} da tabela.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  st.pos = callChave(rec, valor, rec.state.fields.TABLE_SIZE, 'posinit', 'int pos = chaveDivisao(...)');
  rec.push('posinit', `pos = ${st.pos}: o valor só pode estar na cadeia ${st.pos}.`, { cell: st.pos });
  st.ant = null;
  rec.push('antinit', 'No *ant = NULL: ant vai guardar o nó ANTERIOR ao que será removido (ainda não há anterior).', { cell: st.pos });
  st.aux = rec.state.slots[st.pos];
  rec.push('auxinit', st.aux === null ? 'No *aux = ha->itens[pos]: a cadeia está vazia (NULL).' : `No *aux = ha->itens[pos]: aux aponta para o primeiro nó (${val(rec.state, st.aux)}).`, { cell: st.pos });
  while (true) {
    const vivo = st.aux !== null;
    const diferente = vivo && val(rec.state, st.aux) !== valor;
    rec.push('while', !vivo ? 'aux != NULL && aux->valor != valor? Não: aux é NULL, a cadeia acabou.'
      : diferente ? `aux != NULL && aux->valor != valor? Sim: ${val(rec.state, st.aux)} != ${valor}, continua procurando.`
        : `aux != NULL && aux->valor != valor? Não: ${val(rec.state, st.aux)} == ${valor}, achou o nó.`, { cell: st.pos });
    if (!diferente) break;
    st.ant = st.aux;
    rec.push('setant', `ant = aux: guarda o nó atual (${val(rec.state, st.ant)}) como anterior.`, { cell: st.pos });
    st.aux = rec.state.heap[st.aux].prox;
    rec.push('avanca', st.aux === null ? 'aux = aux->prox: o próximo é NULL.' : `aux = aux->prox: avança para o nó ${val(rec.state, st.aux)}.`, { cell: st.pos });
  }
  if (st.aux === null) {
    rec.push('ifachou', 'aux == NULL? Sim: percorreu a cadeia inteira e não achou.', { cell: st.pos });
    rec.ret('retfim', `return 0: ${valor} não está na tabela, nada foi removido.`);
    return done(rec);
  }
  rec.push('ifachou', 'aux == NULL? Não: aux aponta para o nó a remover.', { cell: st.pos });
  if (st.ant === null) {
    rec.push('ifant', 'ant == NULL? Sim: o nó a remover é o PRIMEIRO da cadeia.', { cell: st.pos });
    rec.state = setSlot(rec.state, st.pos, rec.state.heap[st.aux].prox);
    rec.push('unlinkhead', `ha->itens[pos] = aux->prox: o vetor passa a apontar para o segundo nó (ou NULL). O nó ${valor} já saiu da cadeia.`, { cell: st.pos });
  } else {
    rec.push('ifant', `ant == NULL? Não: existe um anterior (${val(rec.state, st.ant)}).`, { cell: st.pos });
    rec.state = setNode(rec.state, st.ant, { prox: rec.state.heap[st.aux].prox });
    rec.push('unlinkmid', `ant->prox = aux->prox: o anterior (${val(rec.state, st.ant)}) "pula" o nó ${valor}. O nó já saiu da cadeia.`, { cell: st.pos });
  }
  rec.freeInt(st.aux);
  rec.push('free', `free(aux): o nó que guardava ${valor} é devolvido ao sistema. aux fica pendente.`, { cell: st.pos });
  const qtd = rec.state.fields.qtd;
  rec.state = setFields(rec.state, { qtd: qtd - 1 });
  rec.push('qtddec', `ha->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: ${valor} removido.`);
  return done(rec);
}

// ---------- liberaHash ----------
export function chainLibera(mem) {
  const { rec, st } = setup('liberaHash', mem, undefined);
  rec.push('sig', 'Chamada liberaHash(ha): devolver TODA a memória — cada nó de cada cadeia, depois o vetor e por fim a struct.');
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  const size = rec.state.fields.TABLE_SIZE;
  st.i = 0;
  rec.push('for', `for (int i = 0; ...): i começa em 0 (i < ${size}: Sim).`);
  while (st.i < size) {
    st.aux = rec.state.slots[st.i];
    rec.push('auxinit', st.aux === null ? `No *aux = ha->itens[i]: a cadeia ${st.i} está vazia.` : `No *aux = ha->itens[i]: aux aponta para o primeiro nó da cadeia ${st.i}.`, { cell: st.i });
    while (true) {
      const vivo = st.aux !== null;
      rec.push('while', vivo ? `aux != NULL? Sim: ainda há nó (${rec.state.heap[st.aux]?.valor}) para liberar.` : 'aux != NULL? Não: a cadeia acabou.', { cell: st.i });
      if (!vivo) break;
      st.prox = rec.state.heap[st.aux].prox;
      rec.push('proxinit', 'No *prox = aux->prox: guarda o próximo ANTES de liberar — depois do free não dá mais para ler aux->prox.', { cell: st.i });
      const v = val(rec.state, st.aux);
      rec.freeInt(st.aux);
      rec.push('freeno', `free(aux): o nó ${v} é devolvido.`, { cell: st.i });
      st.aux = st.prox;
      rec.push('avanca', st.aux === null ? 'aux = prox: NULL, fim da cadeia.' : `aux = prox: avança para o próximo nó (${rec.state.heap[st.aux]?.valor}).`, { cell: st.i });
    }
    st.aux = undefined;
    st.prox = undefined;
    st.i += 1;
    rec.push('for', st.i < size ? `i++: i = ${st.i}. i < TABLE_SIZE? Sim.` : `i++: i = ${st.i}. i < TABLE_SIZE? Não: o laço termina.`);
  }
  st.i = null;
  rec.state = setParts(rec.state, { vec: 'freed' });
  rec.push('freeitens', `free(ha->itens): agora o vetor de ponteiros (${size} posições) é devolvido.`);
  rec.state = { ...setParts(rec.state, { desc: 'freed' }), destroyed: true };
  rec.push('freeha', 'free(ha): por último, a struct Hash. A ordem importa: liberar ha primeiro faria perder o acesso a itens e aos nós.');
  rec.ret('freeha', 'Fim de liberaHash. A variável ha do chamador fica pendente.');
  return done(rec);
}

// ---------- criaHash ----------
export function chainCria(mem) {
  const m0 = emptyHashAfterDestroy(mem);
  const rec = createArrayRecorder('criaHash', { ...m0, destroyed: false });
  let haDeclared = false;
  let i = null;
  rec.makeVars = () => [
    plainInt('TABLE_SIZE', HASH_SIZE),
    ...(haDeclared ? [{ ...arrDescVar(rec.state), name: 'ha', pointee: 'Hash' }] : []),
    ...(i === null ? [] : [idxVar('i', i, Math.min(i, HASH_SIZE - 1))]),
  ];
  rec.push('sig', `Chamada criaHash(${HASH_SIZE}): construir uma tabela nova com ${HASH_SIZE} cadeias, todas vazias.`);
  haDeclared = true;
  rec.state = setParts(setFields(rec.state, { qtd: undefined, TABLE_SIZE: undefined }), { desc: 'live' });
  rec.push('mallocha', `Hash *ha = malloc(sizeof(Hash)): reserva a struct (endereço ${ARRAY_ADDR.desc}). Os campos ainda têm lixo (?).`);
  rec.push('ifha', 'ha != NULL? Sim: a alocação deu certo.');
  rec.state = setFields(rec.state, { TABLE_SIZE: HASH_SIZE });
  rec.push('settable', `ha->TABLE_SIZE = TABLE_SIZE: guarda ${HASH_SIZE}.`, { field: 'TABLE_SIZE' });
  rec.state = setFields(rec.state, { qtd: 0 });
  rec.push('setqtd', 'ha->qtd = 0: a tabela começa sem elementos.', { field: 'qtd' });
  rec.state = setParts(rec.state, { vec: 'live' });
  rec.push('mallocitens', `ha->itens = malloc(TABLE_SIZE * sizeof(No*)): reserva um vetor de ${HASH_SIZE} ponteiros para nó (endereço ${ARRAY_ADDR.vec}). As posições têm lixo (?).`, { field: 'itens' });
  rec.push('ifitens', 'ha->itens == NULL? Não: a alocação deu certo.');
  i = 0;
  rec.push('for', `for (int i = 0; ...): i começa em 0 (i < ${HASH_SIZE}: Sim).`);
  while (i < HASH_SIZE) {
    rec.state = setSlot(rec.state, i, null);
    rec.push('setnull', `ha->itens[i] = NULL: a cadeia ${i} começa vazia.`, { cell: i });
    i += 1;
    rec.push('for', i < HASH_SIZE ? `i++: i = ${i}. i < TABLE_SIZE? Sim.` : `i++: i = ${i}. i < TABLE_SIZE? Não: o laço termina.`);
  }
  i = null;
  rec.ret('ret', 'return ha: devolve o endereço da tabela pronta (todas as cadeias vazias).');
  return done(rec);
}
