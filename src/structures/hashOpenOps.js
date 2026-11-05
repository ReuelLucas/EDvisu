// Tabela hash com endereçamento aberto (sondagem linear, quadrática e duplo hash), conforme os slides da aula.
// Vetor de int: posição vazia = VAZIO (-1) e REMOVIDO = -2. Código AUTORAL (tools/autoral/hash_*.c); só chaveDivisao é do repositório.
import {
  ARRAY_ADDR, HASH_SIZE, REM, arrDescVar, createArrayRecorder, emptyHashAfterDestroy, hashPos, idxVar, outParam,
  plainInt, sondagemPos,
} from '../arrayModel';

const done = (rec) => ({ steps: rec.steps, list: rec.state });
export const SUFIXO = { linear: 'SondagemLinear', quad: 'SondagemQuadratica', duplo: 'DuploHash' };
const FN_SOND = { linear: 'sondagemLinear', quad: 'sondagemQuadratica', duplo: 'duploHash' };
const NOME = { linear: 'sondagem linear', quad: 'sondagem quadrática', duplo: 'duplo hash' };
const FORMULA = {
  linear: '(pos + i) % TABLE_SIZE',
  quad: '(pos + 2*i + 5*i*i) % TABLE_SIZE',
  duplo: '(pos + i*H2) % TABLE_SIZE, com H2 = chaveDivisao(chave, TABLE_SIZE-1) + 1',
};
const setSlot = (m, i, v) => ({ ...m, slots: m.slots.map((x, k) => (k === i ? v : x)) });
const setFields = (m, patch) => ({ ...m, fields: { ...m.fields, ...patch } });
const setParts = (m, patch) => ({ ...m, parts: { ...m.parts, ...patch } });
const show = (v) => (v === null ? 'VAZIO' : v === REM ? 'REMOVIDO' : String(v));

function callChaveDivisao(rec, chave, size, line, ctx, explain) {
  const frame = [plainInt('chave', chave), plainInt('TABLE_SIZE', size)];
  rec.push(line, `${ctx}: chama chaveDivisao(${chave}, ${size}).`);
  rec.push('sig', `Chamada chaveDivisao(${chave}, ${size}): ${explain} (índice entre 0 e ${size - 1}).`, { fn: 'chaveDivisao', vars: frame });
  const r = hashPos(chave, size);
  rec.push('ret', `return (chave & 0x7FFFFFFF) % TABLE_SIZE: ${chave & 0x7fffffff} % ${size} = ${r}.`, { fn: 'chaveDivisao', vars: frame });
  return r;
}

function setup(fn, mem, valor, strategy, withOut = () => []) {
  const rec = createArrayRecorder(fn, mem);
  const st = { valor, pos: null, livre: null, i: null, novaPos: null, tried: [] };
  rec.makeVars = () => [
    arrDescVar(rec.state),
    plainInt('valor', valor),
    ...withOut(),
    ...(st.pos === null ? [] : [idxVar('pos', st.pos)]),
    ...(st.livre === null ? [] : [st.livre < 0 ? plainInt('livre', st.livre) : idxVar('livre', st.livre)]),
    ...(st.i === null ? [] : [plainInt('i', st.i)]),
    ...(st.novaPos === null ? [] : [idxVar('novaPos', st.novaPos)]),
  ];
  rec.makeNote = () => `${NOME[strategy]}: novaPos = ${FORMULA[strategy]}${st.tried.length ? ` · posições tentadas: ${st.tried.join(' → ')}` : ''}`;
  return { rec, st };
}

function prologue(rec, st, valor) {
  st.pos = callChaveDivisao(rec, valor, rec.state.fields.TABLE_SIZE, 'pos', 'int pos = chaveDivisao(valor, ha->TABLE_SIZE)', 'transforma a chave em uma posição');
  rec.push('pos', `pos = ${st.pos}: é a posição "de origem" de ${valor}. Se estiver ocupada, a sondagem procura outra.`, { cell: st.pos });
}

// for (i...) + chamada da função de sondagem (mostrada como função chamada, como nos slides)
function tentativa(rec, st, strategy) {
  const TS = rec.state.fields.TABLE_SIZE;
  const visited = st.tried.slice();
  rec.push('for', `i < TABLE_SIZE? Sim: tentativa ${st.i}.`, { cells: visited });
  rec.push('novapos', `int novaPos = ${FN_SOND[strategy]}(...): chama a função de sondagem com a tentativa i = ${st.i}.`, { cells: visited });
  let result;
  if (strategy === 'linear') {
    const f = [plainInt('pos', st.pos), plainInt('i', st.i), plainInt('TABLE_SIZE', TS)];
    rec.push('sig', `Chamada sondagemLinear(${st.pos}, ${st.i}, ${TS}): anda de 1 em 1 posição a partir de pos.`, { fn: 'sondagemLinear', vars: f });
    result = sondagemPos('linear', st.pos, st.valor, st.i, TS);
    rec.push('ret', `return (pos + i) % TABLE_SIZE: (${st.pos} + ${st.i}) % ${TS} = ${result}.`, { fn: 'sondagemLinear', vars: f });
  } else if (strategy === 'quad') {
    const f = [plainInt('pos', st.pos), plainInt('i', st.i), plainInt('TABLE_SIZE', TS)];
    rec.push('sig', `Chamada sondagemQuadratica(${st.pos}, ${st.i}, ${TS}): o salto cresce com o quadrado de i.`, { fn: 'sondagemQuadratica', vars: f });
    const novo = st.pos + 2 * st.i + 5 * st.i * st.i;
    rec.push('calc', `pos = pos + 2*i + 5*i*i: ${st.pos} + ${2 * st.i} + ${5 * st.i * st.i} = ${novo}.`, { fn: 'sondagemQuadratica', vars: [plainInt('pos', novo), f[1], f[2]] });
    result = novo % TS;
    rec.push('ret', `return pos % TABLE_SIZE: ${novo} % ${TS} = ${result}.`, { fn: 'sondagemQuadratica', vars: [plainInt('pos', novo), f[1], f[2]] });
  } else {
    const f = [plainInt('H1', st.pos), plainInt('chave', st.valor), plainInt('i', st.i), plainInt('TABLE_SIZE', TS)];
    rec.push('sig', `Chamada duploHash(${st.pos}, ${st.valor}, ${st.i}, ${TS}): H1 é a posição inicial; H2 (segundo hash) será o tamanho do passo.`, { fn: 'duploHash', vars: f });
    rec.push('h2', `int H2 = chaveDivisao(chave, TABLE_SIZE-1) + 1: calcula o passo (nunca 0, senão a sondagem não andaria).`, { fn: 'duploHash', vars: f });
    const g = [plainInt('chave', st.valor), plainInt('TABLE_SIZE', TS - 1)];
    rec.push('sig', `Chamada chaveDivisao(${st.valor}, ${TS - 1}): o segundo hash usa TABLE_SIZE-1.`, { fn: 'chaveDivisao', vars: g });
    const h = hashPos(st.valor, TS - 1);
    rec.push('ret', `return (chave & 0x7FFFFFFF) % TABLE_SIZE: ${st.valor} % ${TS - 1} = ${h}.`, { fn: 'chaveDivisao', vars: g });
    const f2 = [...f, plainInt('H2', h + 1)];
    rec.push('h2', `H2 = ${h} + 1 = ${h + 1}: a cada tentativa o duplo hash anda ${h + 1} posições.`, { fn: 'duploHash', vars: f2 });
    result = (st.pos + st.i * (h + 1)) % TS;
    rec.push('ret', `return (H1 + i*H2) % TABLE_SIZE: (${st.pos} + ${st.i}*${h + 1}) % ${TS} = ${result}.`, { fn: 'duploHash', vars: f2 });
  }
  st.novaPos = result;
  st.tried = [...st.tried, result];
  rec.push('novapos', `novaPos = ${result}: de volta à função, esta é a posição examinada agora.`, { cell: result, cells: visited });
}

const visitedOf = (st) => st.tried.slice(0, -1);

// ---------- insereHash_X ----------
export function makeInsere(strategy) {
  const fn = `insereHash_${SUFIXO[strategy]}`;
  return function insere(mem, valor) {
    const { rec, st } = setup(fn, mem, valor, strategy);
    const TS = mem.fields.TABLE_SIZE;
    rec.push('sig', `Chamada ${fn}(ha, ${valor}): inserir o valor ${valor} usando ${NOME[strategy]}.`);
    const qtd = rec.state.fields.qtd;
    if (qtd === TS) {
      rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Sim: a tabela está cheia (${qtd} de ${TS}).`);
      rec.ret('retguard', 'return 0: tabela cheia, nada foi inserido.');
      return done(rec);
    }
    rec.push('ifguard', `ha == NULL || ha->qtd == ha->TABLE_SIZE? Não: qtd = ${qtd}, ainda há espaço.`);
    prologue(rec, st, valor);
    st.livre = -1;
    rec.push('livreinit', 'int livre = -1: vai guardar a primeira posição que puder receber o valor (-1 = ainda nenhuma).');
    st.i = 0;
    while (st.i < TS) {
      tentativa(rec, st, strategy);
      const slot = rec.state.slots[st.novaPos];
      const cells = visitedOf(st);
      const livreSlot = slot === null || slot === REM;
      if (livreSlot) {
        rec.push('ifslot', `itens[novaPos] == VAZIO || == REMOVIDO? Sim: a posição ${st.novaPos} está ${slot === null ? 'vazia' : 'REMOVIDA (já teve um valor, pode ser reutilizada)'}.`, { cell: st.novaPos, cells });
        if (st.livre === -1) {
          rec.push('iflivre', 'livre == -1? Sim: ainda não havia posição candidata.', { cell: st.novaPos, cells });
          st.livre = st.novaPos;
          rec.push('setlivre', `livre = novaPos: a posição ${st.novaPos} é a candidata a receber ${valor}.`, { cell: st.novaPos, cells });
        } else {
          rec.push('iflivre', `livre == -1? Não: já existe candidata (${st.livre}).`, { cell: st.novaPos, cells });
        }
        if (slot === null) {
          rec.push('ifbreak', 'itens[novaPos] == VAZIO? Sim: posição NUNCA usada. Se o valor estivesse na tabela, a sondagem já o teria achado: pode parar.', { cell: st.novaPos, cells });
          rec.push('brk', 'break: sai do laço.', { cell: st.novaPos, cells });
          break;
        }
        rec.push('ifbreak', 'itens[novaPos] == VAZIO? Não: está REMOVIDA, então a sondagem continua (o valor pode estar mais adiante).', { cell: st.novaPos, cells });
      } else {
        rec.push('ifslot', `itens[novaPos] == VAZIO || == REMOVIDO? Não: a posição ${st.novaPos} guarda ${slot}. ${st.i === 0 ? 'COLISÃO!' : 'Outra colisão.'}`, { cell: st.novaPos, cells });
        if (slot === valor) {
          rec.push('ifdup', `else if (itens[novaPos] == valor)? Sim: ${valor} já está na tabela.`, { cell: st.novaPos, cells });
          rec.ret('retdup', 'return 0: valor repetido, nada foi inserido.');
          return done(rec);
        }
        rec.push('ifdup', `else if (itens[novaPos] == valor)? Não: ${slot} é outro valor. Vamos sondar outra posição.`, { cell: st.novaPos, cells });
      }
      st.i += 1;
    }
    if (st.i >= TS) rec.push('for', `i < TABLE_SIZE? Não: ${TS} tentativas feitas.`, { cells: st.tried });
    if (st.livre === -1) {
      rec.push('ifsem', 'livre == -1? Sim: nenhuma posição livre foi encontrada.', { cells: st.tried });
      rec.ret('retsem', `return 0: a sondagem não achou posição livre${strategy === 'quad' ? ' (a sondagem quadrática dos slides só visita algumas posições: a tabela pode ter espaço sobrando e ainda assim falhar)' : ''}.`);
      return done(rec);
    }
    rec.push('ifsem', `livre == -1? Não: livre = ${st.livre}.`, { cell: st.livre });
    rec.state = setSlot(rec.state, st.livre, valor);
    rec.push('setitem', `ha->itens[livre] = valor: grava ${valor} na posição ${st.livre}.`, { cell: st.livre });
    rec.state = setFields(rec.state, { qtd: qtd + 1 });
    rec.push('qtdinc', `ha->qtd++: a quantidade sobe de ${qtd} para ${qtd + 1}.`, { field: 'qtd' });
    const col = st.tried.indexOf(st.livre);
    rec.ret('ret1', `return 1: ${valor} inserido na posição ${st.livre}${col > 0 ? ` (após ${col} colisão(ões))` : ' (direto na posição de origem)'}.`);
    return done(rec);
  };
}

// ---------- busca / remove (mesmo percurso) ----------
function makeProcura(strategy, remove) {
  const fn = `${remove ? 'remove' : 'busca'}Hash_${SUFIXO[strategy]}`;
  return function procura(mem, valor) {
    let out = null;
    const { rec, st } = setup(fn, mem, valor, strategy, () => (remove ? [] : [outParam('out', out)]));
    const TS = mem.fields.TABLE_SIZE;
    rec.push('sig', `Chamada ${fn}(ha, ${valor}${remove ? '' : ', &x'}): ${remove ? 'remover' : 'procurar'} o valor ${valor}.`);
    rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
    prologue(rec, st, valor);
    st.i = 0;
    while (st.i < TS) {
      tentativa(rec, st, strategy);
      const slot = rec.state.slots[st.novaPos];
      const cells = visitedOf(st);
      if (slot === null) {
        rec.push('ifvazio', `itens[novaPos] == VAZIO? Sim: a posição ${st.novaPos} nunca foi usada. Se ${valor} estivesse na tabela, a sondagem já o teria achado: pode parar.`, { cell: st.novaPos, cells });
        rec.ret('retvazio', `return 0: ${valor} não está na tabela${remove ? ', nada foi removido' : ''}.`);
        return done(rec);
      }
      rec.push('ifvazio', `itens[novaPos] == VAZIO? Não: a posição ${st.novaPos} guarda ${show(slot)}${slot === REM ? ' — REMOVIDO não encerra a busca: o valor pode estar mais adiante' : ''}.`, { cell: st.novaPos, cells });
      if (slot === valor) {
        rec.push('ifach', `itens[novaPos] == valor? Sim: ${slot} == ${valor}.`, { cell: st.novaPos, cells });
        if (remove) {
          rec.state = setSlot(rec.state, st.novaPos, REM);
          rec.push('setrem', `itens[novaPos] = REMOVIDO: a posição ${st.novaPos} recebe a marcação especial. Colocar VAZIO quebraria a busca de outros valores que passam por aqui.`, { cell: st.novaPos });
          const qtd = rec.state.fields.qtd;
          rec.state = setFields(rec.state, { qtd: qtd - 1 });
          rec.push('qtddec', `ha->qtd--: a quantidade cai de ${qtd} para ${qtd - 1}.`, { field: 'qtd' });
          rec.ret('ret1', `return 1: ${valor} removido da posição ${st.novaPos}.`);
        } else {
          out = st.novaPos;
          rec.push('setout', `*out = novaPos: grava ${st.novaPos} na variável x do chamador.`, { cell: st.novaPos });
          rec.ret('ret1', `return 1: ${valor} encontrado na posição ${st.novaPos}.`);
        }
        return done(rec);
      }
      rec.push('ifach', `itens[novaPos] == valor? Não: ${show(slot)} != ${valor}.`, { cell: st.novaPos, cells });
      st.i += 1;
    }
    rec.push('for', `i < TABLE_SIZE? Não: ${TS} tentativas sem sucesso.`, { cells: st.tried });
    rec.ret('retfim', `return 0: ${valor} não foi encontrado${remove ? ', nada foi removido' : ''}.`);
    return done(rec);
  };
}
export const makeBusca = (strategy) => makeProcura(strategy, false);
export const makeRemove = (strategy) => makeProcura(strategy, true);

// ---------- liberaHash / criaHash ----------
export function openLibera(mem) {
  const rec = createArrayRecorder('liberaHash', mem);
  rec.makeVars = () => [arrDescVar(rec.state)];
  rec.push('sig', 'Chamada liberaHash(ha): devolver a tabela — primeiro o vetor de int, depois a struct.');
  rec.push('ifnull', 'ha == NULL? Não: a tabela existe.');
  rec.state = setParts(rec.state, { vec: 'freed' });
  rec.push('freeitens', `free(ha->itens): o vetor de ${mem.fields.TABLE_SIZE} ints é devolvido. ha->itens fica pendente.`);
  rec.state = { ...setParts(rec.state, { desc: 'freed' }), destroyed: true };
  rec.push('freeha', 'free(ha): por último, a struct Hash. A ordem importa: liberar ha primeiro faria perder o acesso a ha->itens.');
  rec.ret('freeha', 'Fim de liberaHash. A variável ha do chamador fica pendente.');
  return done(rec);
}

export function makeCria() {
  return function cria(mem) {
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
    rec.push('mallocitens', `ha->itens = malloc(TABLE_SIZE * sizeof(int)): reserva um vetor de ${HASH_SIZE} ints (endereço ${ARRAY_ADDR.vec}). Contém lixo (?).`, { field: 'itens' });
    rec.push('ifitens', 'ha->itens == NULL? Não: a alocação deu certo.');
    i = 0;
    rec.push('for', `for (int i = 0; ...): i começa em 0 (i < ${HASH_SIZE}: Sim).`);
    while (i < HASH_SIZE) {
      rec.state = setSlot(rec.state, i, null);
      rec.push('setvazio', `ha->itens[i] = VAZIO: a posição ${i} recebe VAZIO (-1).`, { cell: i });
      i += 1;
      rec.push('for', i < HASH_SIZE ? `i++: i = ${i}. i < TABLE_SIZE? Sim.` : `i++: i = ${i}. i < TABLE_SIZE? Não: o laço termina.`);
    }
    i = null;
    rec.ret('ret', 'return ha: devolve o endereço da tabela pronta (todas as posições vazias).');
    return done(rec);
  };
}
