// Modelo de memória das estruturas com VETOR (lista sequencial, pilha estática, fila estática e tabela hash).
//
// Aqui não há nós encadeados: os dados ficam num vetor DENTRO da struct (dados[MAX]) e os "ponteiros"
// da estrutura são índices inteiros (topo, inicio, final). Na tabela hash o vetor é de ponteiros (int **itens).
//
// Snapshot (mesmo espírito do memoryModel.js; `view: 'array'` diz à tela qual desenho usar):
//   { view, fn, line, message, mem, ghosts, vars, focus: { cell, cells, field }, crash }
//   mem (lista/pilha/fila): { type, max, dados[], fields{}, destroyed }
//   mem (hash):             { type:'hash', max, slots[], heap{}, nextId, fields{qtd,TABLE_SIZE,...}, parts{desc,vec}, destroyed }
//   ghosts: { [heapId]: { valor } }  ints liberados com free(), desenhados cinza por UM passo (só hash)

export const ARRAY_DESC = 'desc';

export const AKINDS = {
  listaVet: {
    descStruct: 'struct lista', descVar: 'li', descType: 'Lista', max: 6,
    fields: [{ name: 'qtd' }], layout: 'row',
  },
  pilhaVet: {
    descStruct: 'struct pilha', descVar: 'p', descType: 'Pilha', max: 3,
    fields: [{ name: 'topo' }], layout: 'column',
  },
  filaVet: {
    descStruct: 'struct fila', descVar: 'f', descType: 'Fila', max: 5,
    fields: [{ name: 'inicio' }, { name: 'final' }, { name: 'qtd' }], layout: 'row',
  },
  hash: {
    descStruct: 'Hash', descVar: 'ha', descType: 'Hash*', max: 11,
    fields: [{ name: 'qtd' }, { name: 'TABLE_SIZE' }, { name: 'itens' }], layout: 'hash',
  },
};

// ---------- memória (imutável) ----------

export function createArray(type, values = []) {
  const { max } = AKINDS[type];
  const dados = Array(max).fill(null); // null = nunca escrito (lixo: "?")
  values.slice(0, max).forEach((v, i) => { dados[i] = v; });
  const n = Math.min(values.length, max);
  const fields =
    type === 'pilhaVet' ? { topo: n } : type === 'filaVet' ? { inicio: 0, final: n % max, qtd: n } : { qtd: n };
  return { type, max, dados, fields, destroyed: false };
}

export const setCell = (m, i, v) => ({ ...m, dados: m.dados.map((x, k) => (k === i ? v : x)) });
export const setF = (m, name, v) => ({ ...m, fields: { ...m.fields, [name]: v } });

// Quais posições do vetor fazem parte da estrutura (as demais guardam lixo / valores antigos)
export function validMask(m) {
  return m.dados.map((_, i) => {
    if (m.type === 'listaVet') return i < m.fields.qtd;
    if (m.type === 'pilhaVet') return i < m.fields.topo;
    if (m.type === 'filaVet') return (i - m.fields.inicio + m.max) % m.max < m.fields.qtd;
    return false;
  });
}

// Tabela hash ------------------------------------------------------------

export const HASH_SIZE = 11;
export const hashPos = (chave, size) => (chave & 0x7fffffff) % size; // chaveDivisao do repositório

export function createHash(values = []) {
  const slots = Array(HASH_SIZE).fill(null);
  const heap = {};
  let nextId = 1;
  let qtd = 0;
  values.forEach((v) => {
    const pos = hashPos(v, HASH_SIZE);
    if (slots[pos] !== null) return; // colisão: o valor é ignorado na montagem inicial
    const id = `h${nextId}`;
    nextId += 1;
    heap[id] = { valor: v };
    slots[pos] = id;
    qtd += 1;
  });
  return {
    type: 'hash', max: HASH_SIZE, slots, heap, nextId,
    fields: { qtd, TABLE_SIZE: HASH_SIZE },
    parts: { desc: 'live', vec: 'live' }, // 'none' | 'live' | 'freed'
    destroyed: false,
  };
}

export const emptyHashAfterDestroy = (m) => ({ ...m, slots: Array(HASH_SIZE).fill(undefined), heap: {}, fields: {}, parts: { desc: 'none', vec: 'none' } });

export const heapAddress = (id) => `0x${(0x7000 + Number(String(id).slice(1)) * 0x10).toString(16)}`;
export const ARRAY_ADDR = { desc: '0x5000', vec: '0x5100' };

// ---------- variáveis do painel ----------

export const arrDescVar = (m) => {
  const cfg = AKINDS[m.type];
  return {
    name: cfg.descVar, type: cfg.descType, kind: 'ptr', role: 'desc', target: ARRAY_DESC, pointee: cfg.descStruct,
    uninit: false, dangling: Boolean(m.destroyed),
  };
};
// int local. `markIdx`: posição do vetor que a variável "aponta" (desenhada como etiqueta sobre a célula)
export const idxVar = (name, value, markIdx = value) => ({ name, type: 'int', kind: 'int', value, markIdx });
export const plainInt = (name, value) => ({ name, type: 'int', kind: 'int', value });
export const outParam = (name, value) => ({ name, type: 'int*', kind: 'out', value });
// ponteiro para um int no heap (hash): `novo`
export const heapVar = (name, target, m, ghosts = {}) => {
  const alive = target && m.heap[target];
  const ghost = target && ghosts[target];
  return {
    name, type: 'int*', kind: 'ptr', target, pointee: alive ? m.heap[target].valor : ghost ? ghost.valor : null,
    uninit: false, dangling: Boolean(target && !alive),
  };
};

// ---------- gravador de passos ----------

export function createArrayRecorder(fn, mem) {
  const rec = {
    steps: [],
    state: mem,
    ghosts: {},
    ended: false,
    makeVars: () => [],
    // Grava um passo. `fn`/`vars` permitem mostrar uma função chamada (ex.: chaveDivisao) com as suas variáveis.
    push(line, message, { cell = null, cells = [], field = null, fn: fnOverride = null, vars = null, crash = false } = {}) {
      rec.steps.push({
        view: 'array',
        fn: fnOverride ?? fn,
        line,
        message,
        mem: rec.state,
        ghosts: rec.ghosts,
        vars: vars ?? (rec.ended ? [arrDescVar(rec.state)] : rec.makeVars()),
        focus: { cell, cells, field },
        crash,
      });
      rec.ghosts = {};
    },
    // free() de um int do heap (hash): fica cinza por um passo
    freeInt(id) {
      rec.ghosts = { ...rec.ghosts, [id]: rec.state.heap[id] };
      const heap = { ...rec.state.heap };
      delete heap[id];
      rec.state = { ...rec.state, heap };
    },
    ret(line, message) {
      rec.ended = true;
      rec.push(line, message);
    },
  };
  return rec;
}

export function arrayIdle(mem) {
  return {
    view: 'array', fn: null, line: null,
    message: mem.destroyed
      ? 'Estrutura destruída (a memória foi liberada). Use "Iniciar" para criá-la de novo.'
      : 'Estrutura pronta. Escolha uma função para ver o passo a passo do código C.',
    mem, ghosts: {}, vars: [arrDescVar(mem)], focus: { cell: null, cells: [], field: null }, crash: false,
  };
}
