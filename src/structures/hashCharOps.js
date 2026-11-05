// Tabela hash SEM tratamento de colisão, com vetor de char (a hash do repositório guarda int*; aqui o vetor guarda o
// próprio char). Código AUTORAL (tools/autoral/hash_char.c); só chaveDivisao é do repositório.
import {
  ARRAY_ADDR, HASH_SIZE, arrDescVar, createArrayRecorder, emptyHashAfterDestroy, hashPos, idxVar, plainInt,
} from '../arrayModel';

const done = (rec) => ({ steps: rec.steps, list: rec.state });
const setSlot = (m, i, v) => ({ ...m, slots: m.slots.map((x, k) => (k === i ? v : x)) });
const setFields = (m, patch) => ({ ...m, fields: { ...m.fields, ...patch } });
const setParts = (m, patch) => ({ ...m, parts: { ...m.parts, ...patch } });
export const chrVar = (name, value) => ({ name, type: 'char', kind: 'chr', value });

function callChave(rec, code, size, c) {
  const frame = [plainInt('chave', code), plainInt('TABLE_SIZE', size)];
  rec.push('pos', `int pos = chaveDivisao(c, ha->TABLE_SIZE): o char '${c}' é passado como int (código ASCII ${code}) para chaveDivisao.`);
  rec.push('sig', `Chamada chaveDivisao(${code}, ${size}): a função de hashing transforma a chave em um índice entre 0 e ${size - 1}.`, { fn: 'chaveDivisao', vars: frame });
  const pos = hashPos(code, size);
  rec.push('ret', `return (chave & 0x7FFFFFFF) % TABLE_SIZE: ${code} % ${size} = ${pos}. Esse é o índice.`, { fn: 'chaveDivisao', vars: frame });
  return pos;
}

function setup(fn, mem, c, withOut = () => []) {
  const rec = createArrayRecorder(fn, mem);
  const st = { pos: null };
  rec.makeVars = () => [arrDescVar(rec.state), chrVar('c', c), ...withOut(), ...(st.pos === null ? [] : [idxVar('pos', st.pos)])];
  return { rec, st };
}

const mostra = (v) => (v === null ? "'\\0' (vazio)" : `'${v}'`);

// ---------- insereHash_SemColisao_Rejeita ----------
export function charInsereRejeita(mem, c) {
  const { rec, st } = setup('insereHash_SemColisao_Rejeita', mem, c);
  rec.push('sig', `Chamada insereHash_SemColisao_Rejeita(ha, '${c}'): inserir '${c}'; se a posição já estiver ocupada, rejeita.`);
  const { qtd, TABLE_SIZE } = rec.state.fields;
  if (qtd === TABLE_SIZE) {
    rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Sim: a tabela está cheia (${qtd} de ${TABLE_SIZE}).`);
    rec.ret('retguard', 'return 0: tabela cheia, nada foi inserido.');
    return done(rec);
  }
  rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Não: qtd = ${qtd}, TABLE_SIZE = ${TABLE_SIZE}.`);
  st.pos = callChave(rec, c.charCodeAt(0), TABLE_SIZE, c);
  rec.push('pos', `pos = ${st.pos}: de volta a insereHash..., pos guarda o índice devolvido.`, { cell: st.pos });
  const dono = rec.state.slots[st.pos];
  if (dono !== null) {
    rec.push('ifcol', `ha->itens[pos] != VAZIO? Sim: a posição ${st.pos} já guarda '${dono}'. Colisão! Esta versão simplesmente rejeita.`, { cell: st.pos });
    rec.ret('retcol', `return 0: '${c}' NÃO foi inserido, porque '${c}' e '${dono}' caem na mesma posição (${st.pos}).`);
    return done(rec);
  }
  rec.push('ifcol', `ha->itens[pos] != VAZIO? Não: a posição ${st.pos} está vazia ('\\0').`, { cell: st.pos });
  rec.state = setSlot(rec.state, st.pos, c);
  rec.push('setitem', `ha->itens[pos] = c: o char '${c}' é gravado na posição ${st.pos}.`, { cell: st.pos });
  rec.state = setFields(rec.state, { qtd: qtd + 1 });
  rec.push('qtdinc', `ha->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: '${c}' inserido na posição ${st.pos}.`);
  return done(rec);
}

// ---------- insereHash_SemColisao_Sobrescreve ----------
export function charInsereSobrescreve(mem, c) {
  const { rec, st } = setup('insereHash_SemColisao_Sobrescreve', mem, c);
  rec.push('sig', `Chamada insereHash_SemColisao_Sobrescreve(ha, '${c}'): inserir '${c}'; se a posição estiver ocupada, o char antigo é substituído.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  st.pos = callChave(rec, c.charCodeAt(0), rec.state.fields.TABLE_SIZE, c);
  rec.push('pos', `pos = ${st.pos}: de volta a insereHash..., pos guarda o índice devolvido.`, { cell: st.pos });
  const antigo = rec.state.slots[st.pos];
  const qtd = rec.state.fields.qtd;
  if (antigo === null) {
    rec.push('ifvazio', `ha->itens[pos] == VAZIO? Sim: a posição ${st.pos} estava vazia.`, { cell: st.pos });
    rec.state = setFields(rec.state, { qtd: qtd + 1 });
    rec.push('qtdinc', `ha->qtd++: ocupamos uma posição que estava vazia, então a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
  } else {
    rec.push('ifvazio', `ha->itens[pos] == VAZIO? Não: a posição ${st.pos} guarda '${antigo}'. Vai ser substituído, e qtd não muda.`, { cell: st.pos });
  }
  rec.state = setSlot(rec.state, st.pos, c);
  rec.push('setitem', `ha->itens[pos] = c: a posição ${st.pos} passa a guardar '${c}'${antigo !== null ? ` (o '${antigo}' foi perdido)` : ''}.`, { cell: st.pos });
  rec.ret('ret1', `return 1: '${c}' está na posição ${st.pos}${antigo !== null ? ` (substituiu '${antigo}')` : ''}.`);
  return done(rec);
}

// ---------- buscaHash_SemColisao ----------
export function charBusca(mem, c) {
  let out = null;
  const { rec, st } = setup('buscaHash_SemColisao', mem, c, () => [{ name: 'out', type: 'char*', kind: 'out', value: out === null ? null : `'${out}'` }]);
  rec.push('sig', `Chamada buscaHash_SemColisao(ha, '${c}', &x): procurar '${c}'. out aponta para uma variável x do chamador.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  st.pos = callChave(rec, c.charCodeAt(0), rec.state.fields.TABLE_SIZE, c);
  rec.push('pos', `pos = ${st.pos}: só a posição ${st.pos} precisa ser examinada: não há varredura! (é isso que torna a hash rápida).`, { cell: st.pos });
  const guardado = rec.state.slots[st.pos];
  if (guardado !== c) {
    rec.push('ifdiff', `ha->itens[pos] != c? Sim: a posição ${st.pos} guarda ${mostra(guardado)}, não '${c}'.`, { cell: st.pos });
    rec.ret('retdiff', `return 0: '${c}' não está na tabela${guardado === null ? '' : ` (a posição ${st.pos} pertence ao '${guardado}')`}.`);
    return done(rec);
  }
  rec.push('ifdiff', `ha->itens[pos] != c? Não: '${guardado}' == '${c}', é o char procurado.`, { cell: st.pos });
  out = guardado;
  rec.push('setout', `*out = ha->itens[pos]: copia '${guardado}' para a variável x do chamador.`, { cell: st.pos });
  rec.ret('ret1', `return 1: '${c}' encontrado na posição ${st.pos}.`);
  return done(rec);
}

// ---------- removeHash_SemColisao ----------
export function charRemove(mem, c) {
  const { rec, st } = setup('removeHash_SemColisao', mem, c);
  rec.push('sig', `Chamada removeHash_SemColisao(ha, '${c}'): remover '${c}' da tabela.`);
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  st.pos = callChave(rec, c.charCodeAt(0), rec.state.fields.TABLE_SIZE, c);
  rec.push('pos', `pos = ${st.pos}: só a posição ${st.pos} precisa ser examinada.`, { cell: st.pos });
  const guardado = rec.state.slots[st.pos];
  if (guardado !== c) {
    rec.push('ifdiff', `ha->itens[pos] != c? Sim: a posição ${st.pos} guarda ${mostra(guardado)}, não '${c}'.`, { cell: st.pos });
    rec.ret('retdiff', `return 0: '${c}' não está na tabela${guardado === null ? '' : `; o '${guardado}' NÃO é removido`}.`);
    return done(rec);
  }
  rec.push('ifdiff', `ha->itens[pos] != c? Não: '${guardado}' == '${c}', é o char a remover.`, { cell: st.pos });
  rec.state = setSlot(rec.state, st.pos, null);
  rec.push('setvazio', `ha->itens[pos] = VAZIO: a posição ${st.pos} volta a guardar '\\0'. Como não há sondagem, não precisa de marcação REMOVIDO.`, { cell: st.pos });
  const qtd = rec.state.fields.qtd;
  rec.state = setFields(rec.state, { qtd: qtd - 1 });
  rec.push('qtddec', `ha->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
  rec.ret('ret1', `return 1: '${c}' removido.`);
  return done(rec);
}

// ---------- liberaHash ----------
export function charLibera(mem) {
  const rec = createArrayRecorder('liberaHash', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada liberaHash(ha): devolver a tabela: primeiro o vetor de char, depois a struct.');
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  rec.state = setParts(rec.state, { vec: 'freed' });
  rec.push('freeitens', `free(ha->itens): o vetor de ${mem.fields.TABLE_SIZE} chars é devolvido. ha->itens fica pendente.`);
  rec.state = { ...setParts(rec.state, { desc: 'freed' }), destroyed: true };
  rec.push('freeha', 'free(ha): por último, a struct Hash. A ordem importa: liberar ha primeiro faria perder o acesso a ha->itens.');
  rec.ret('freeha', 'Fim de liberaHash. A variável ha do chamador fica pendente.');
  return done(rec);
}

// ---------- criaHash ----------
export function charCria(mem) {
  const m0 = emptyHashAfterDestroy(mem);
  const rec = createArrayRecorder('criaHash', { ...m0, destroyed: false });
  let haDeclared = false;
  let i = null;
  rec.makeVars = () => [
    plainInt('TABLE_SIZE', HASH_SIZE),
    ...(haDeclared ? [{ ...arrDescVar(rec.state), name: 'ha', pointee: 'Hash' }] : []),
    ...(i === null ? [] : [plainInt('i', i)]),
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
  rec.push('mallocitens', `ha->itens = malloc(TABLE_SIZE * sizeof(char)): reserva um vetor de ${HASH_SIZE} chars (endereço ${ARRAY_ADDR.vec}). Contém lixo (?).`, { field: 'itens' });
  rec.push('ifitens', 'ha->itens == NULL? Não: a alocação deu certo.');
  i = 0;
  rec.push('for', `for (int i = 0; ...): i começa em 0 (i < ${HASH_SIZE}: Sim).`);
  while (i < HASH_SIZE) {
    rec.state = setSlot(rec.state, i, null);
    rec.push('setvazio', `ha->itens[i] = VAZIO: a posição ${i} recebe '\\0'.`, { cell: i });
    i += 1;
    rec.push('for', i < HASH_SIZE ? `i++: i = ${i}. i < TABLE_SIZE? Sim.` : `i++: i = ${i}. i < TABLE_SIZE? Não: o laço termina.`);
  }
  i = null;
  rec.ret('ret', 'return ha: devolve o endereço da tabela pronta (todas as posições vazias).');
  return done(rec);
}
