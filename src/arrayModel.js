// Modelo de memória das estruturas com VETOR (lista sequencial, pilha estática, fila estática e tabela hash).
//
// Aqui não há nós encadeados: os dados ficam num vetor DENTRO da struct (dados[MAX]) e os "ponteiros"
// da estrutura são índices inteiros (topo, inicio, final). Na tabela hash o vetor é de ponteiros (int **itens).
//
// Snapshot (mesmo espírito do memoryModel.js; `view: 'array'` diz à tela qual desenho usar):
//   { view, fn, line, message, mem, ghosts, vars, focus: { cell, cells, field }, crash }
//   mem (lista/pilha/fila): { type, max, dados[], fields{}, destroyed }
//   mem (hash):             { type:'hashChar'|'hashOpen'|'hashChain', max, slots[], heap{}, nextId, fields{qtd,TABLE_SIZE,...}, parts{desc,vec}, destroyed }
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
  // hash sem colisão com vetor de char; hash com endereçamento aberto com vetor de int (VAZIO -1, REMOVIDO -2)
  hashChar: {
    descStruct: 'Hash', descVar: 'ha', descType: 'Hash*', max: 11,
    fields: [{ name: 'qtd' }, { name: 'TABLE_SIZE' }, { name: 'itens' }], layout: 'hash',
  },
  hashOpen: {
    descStruct: 'Hash', descVar: 'ha', descType: 'Hash*', max: 11,
    fields: [{ name: 'qtd' }, { name: 'TABLE_SIZE' }, { name: 'itens' }], layout: 'hash',
  },
  // hash com lista encadeada (encadeamento separado): vetor de ponteiros para cadeias de nós
  hashChain: {
    descStruct: 'Hash', descVar: 'ha', descType: 'Hash*', max: 11,
    fields: [{ name: 'qtd' }, { name: 'itens' }], layout: 'hashChain',
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

// ---- tabelas de vetor: slots[i] = null (VAZIO) ou o valor guardado (char na hash sem colisão, int nas de sondagem) ----
export const REM = -2; // marcação REMOVIDO das hashes de int com sondagem
export const sondagemPos = (strategy, pos, valor, i, size) => {
  if (strategy === 'linear') return (pos + i) % size;
  if (strategy === 'quad') return (pos + 2 * i + 5 * i * i) % size; // slides: pos + 2*i + 5*i*i
  return (pos + i * (hashPos(valor, size - 1) + 1)) % size; // duplo hash: H2 = chaveDivisao(chave, TABLE_SIZE-1) + 1
};

const baseVetor = (type, extra = {}) => ({
  type, ...extra, max: HASH_SIZE, slots: Array(HASH_SIZE).fill(null), heap: {}, nextId: 1,
  fields: { qtd: 0, TABLE_SIZE: HASH_SIZE }, parts: { desc: 'live', vec: 'live' }, destroyed: false,
});

// hash SEM colisão, vetor de char (colisão na montagem inicial: o char é ignorado, como em "Rejeita")
export function createHashChar(chars = []) {
  const m = baseVetor('hashChar');
  chars.forEach((c) => {
    const pos = hashPos(c.charCodeAt(0), HASH_SIZE);
    if (m.slots[pos] === null) { m.slots[pos] = c; m.fields.qtd += 1; }
  });
  return m;
}

// hash com endereçamento aberto, vetor de int
export function createHashOpen(strategy, values = []) {
  const m = baseVetor('hashOpen', { strategy });
  values.forEach((v) => {
    const pos = hashPos(v, HASH_SIZE);
    for (let i = 0; i < HASH_SIZE; i += 1) {
      const n = sondagemPos(strategy, pos, v, i, HASH_SIZE);
      if (m.slots[n] === null || m.slots[n] === REM) { m.slots[n] = v; m.fields.qtd += 1; return; }
      if (m.slots[n] === v) return;
    }
  });
  return m;
}

// ---- hash encadeada: slots[i] = id do 1º nó da cadeia (ou null); heap[id] = { valor, prox } ----
export function createHashChain(values = []) {
  const slots = Array(HASH_SIZE).fill(null);
  const heap = {};
  let nextId = 1;
  let qtd = 0;
  values.forEach((v) => {
    const pos = hashPos(v, HASH_SIZE);
    for (let id = slots[pos]; id; id = heap[id].prox) if (heap[id].valor === v) return; // sem repetidos
    const id = `h${nextId}`;
    nextId += 1;
    heap[id] = { valor: v, prox: slots[pos] }; // inserção no início da cadeia
    slots[pos] = id;
    qtd += 1;
  });
  return {
    type: 'hashChain', max: HASH_SIZE, slots, heap, nextId,
    fields: { qtd, TABLE_SIZE: HASH_SIZE },
    parts: { desc: 'live', vec: 'live' },
    destroyed: false,
  };
}

// ponteiro No* para um nó do heap (hash encadeada)
export const nodeVar = (name, target, m, ghosts = {}) => {
  const node = target ? m.heap[target] ?? ghosts[target] : null;
  return {
    name, type: 'No*', kind: 'ptr', target, pointee: node ? node.valor : null,
    uninit: false, dangling: Boolean(target && !m.heap[target]), isNull: target === null,
  };
};

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
export const chrVar = (name, value) => ({ name, type: 'char', kind: 'chr', value });
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
    makeNote: () => null, // texto fixo ao lado do desenho (ex.: fórmula da sondagem)
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
        note: rec.makeNote(),
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
