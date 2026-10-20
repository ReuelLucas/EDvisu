// Modelo de memória compartilhado por todas as estruturas (lista, lista dupla, circular, pilha, fila).
//
// Na memória há DOIS tipos de objeto, como no código C:
//   - o descritor (struct lista / pilha / fila), apontado por uma variável (li, p, f);
//   - os nós Elem { valor, prox [, ant] }, encadeados a partir do descritor.
//
// CONTRATO: cada passo (snapshot) descreve TUDO que a tela desenha naquele instante:
//   {
//     fn:         nome da função C em execução (chave de FUNCTIONS no listing da estrutura)
//     line:       id da linha C em execução (idem)
//     message:    explicação do que acabou de acontecer
//     list:       { kind, desc, nodes, nextId, freed }  estado da memória neste passo
//     order:      ids dos nós na ordem em que são desenhados (esquerda -> direita)
//     floating:   { [id]: 'novo' | 'removendo' }  nós desenhados fora da fileira
//     ghosts:     { [id]: nó }  nós que acabaram de sofrer free(): ficam na tela UM passo, como "liberado"
//     vars:       variáveis locais visíveis neste passo
//     focusEdge:  id da aresta que acabou de ser (re)ligada, ou null
//     focusField: campo do descritor que acabou de mudar, ou null
//     crash:      true quando o código C original falharia (ex.: NULL->campo) neste passo
//   }
//
// Hoje os passos são escritos à mão. Quando existir o interpretador de C, ele deve produzir
// snapshots neste MESMO formato: a interface não muda.

export const NULL_ID = 'null';
export const DESC_ID = 'desc';

// Cada "kind" descreve a forma da estrutura: campos do descritor, campos dos nós e layout na tela.
export const KINDS = {
  lista: {
    descStruct: 'struct lista',
    descVar: 'li',
    descType: 'Lista',
    fields: [
      { name: 'inicio', kind: 'ptr' },
      { name: 'qtd', kind: 'int' },
    ],
    nodeFields: ['prox'],
    layout: 'inline', // descritor à esquerda, na mesma linha dos nós
    rowX0: 215,
    spacing: 185,
    head: 'inicio',
  },
  dupla: {
    descStruct: 'struct lista',
    descVar: 'li',
    descType: 'Lista',
    fields: [
      { name: 'inicio', kind: 'ptr' },
      { name: 'final', kind: 'ptr' },
      { name: 'qtd', kind: 'int' },
    ],
    nodeFields: ['ant', 'prox'], // ordem em que as células são desenhadas
    layout: 'above',
    rowX0: 150,
    spacing: 270,
    leftNull: true,
    head: 'inicio',
  },
  circular: {
    descStruct: 'struct lista',
    descVar: 'li',
    descType: 'Lista',
    fields: [
      { name: 'final', kind: 'ptr' },
      { name: 'qtd', kind: 'int' },
    ],
    nodeFields: ['prox'],
    layout: 'above',
    rowX0: 0,
    spacing: 185,
    head: 'circular', // primeiro nó = final->prox
  },
  pilha: {
    descStruct: 'struct pilha',
    descVar: 'p',
    descType: 'Pilha',
    fields: [
      { name: 'topo', kind: 'ptr' },
      { name: 'qtd', kind: 'int' },
    ],
    nodeFields: ['prox'],
    layout: 'stack', // nós empilhados na vertical, topo em cima
    rowX0: 215,
    spacing: 185,
    head: 'topo',
  },
  fila: {
    descStruct: 'struct fila',
    descVar: 'f',
    descType: 'Fila',
    fields: [
      { name: 'inicio', kind: 'ptr' },
      { name: 'final', kind: 'ptr' },
      { name: 'qtd', kind: 'int' },
    ],
    nodeFields: ['prox'],
    layout: 'above',
    rowX0: 215,
    spacing: 185,
    head: 'inicio',
  },
};

// ---------- memória (imutável) ----------

// Nó Elem: { id, valor, prox [, ant] }. Cada campo ponteiro guarda o ID do nó apontado:
// null = NULL, undefined = ainda não inicializado (lixo logo após o malloc).
export function createList(kind, values = []) {
  const cfg = KINDS[kind];
  const doubly = cfg.nodeFields.includes('ant');
  const circular = cfg.head === 'circular';
  const n = values.length;
  const nodes = {};
  values.forEach((valor, i) => {
    const id = `n${i + 1}`;
    const next = i < n - 1 ? `n${i + 2}` : circular ? 'n1' : null;
    nodes[id] = { id, valor, prox: next, ...(doubly ? { ant: i > 0 ? `n${i}` : null } : {}) };
  });
  const first = n ? 'n1' : null;
  const last = n ? `n${n}` : null;
  const initial = { inicio: first, topo: first, final: last, qtd: n };
  return {
    kind,
    desc: { fields: cfg.fields.map((f) => ({ name: f.name, kind: f.kind, value: initial[f.name] })) },
    nodes,
    nextId: n + 1,
    freed: [], // ids já liberados com free(): ponteiros que ainda apontam para eles estão "pendentes"
  };
}

export const newNode = (list, id) => ({
  id,
  valor: null,
  prox: undefined,
  ...(KINDS[list.kind].nodeFields.includes('ant') ? { ant: undefined } : {}),
});

export const getField = (list, name) => list.desc.fields.find((f) => f.name === name).value;

export const setField = (list, name, value) => ({
  ...list,
  desc: { fields: list.desc.fields.map((f) => (f.name === name ? { ...f, value } : f)) },
});

// campo ponteiro de um nó: 'prox' ou 'ant'
export const setPtr = (list, id, field, value) => ({ ...list, nodes: { ...list.nodes, [id]: { ...list.nodes[id], [field]: value } } });
export const setValor = (list, id, valor) => ({ ...list, nodes: { ...list.nodes, [id]: { ...list.nodes[id], valor } } });
export const addNode = (list, node) => ({ ...list, nodes: { ...list.nodes, [node.id]: node }, nextId: list.nextId + 1 });

export const freeNode = (list, id) => ({
  ...list,
  nodes: Object.fromEntries(Object.entries(list.nodes).filter(([key]) => key !== id)),
  freed: [...list.freed, id],
});

// ids dos nós na ordem em que a estrutura os percorre (primeiro -> último)
export function traverse(list) {
  const cfg = KINDS[list.kind];
  let cur;
  if (cfg.head === 'circular') {
    const last = getField(list, 'final');
    cur = last === null ? null : (list.nodes[last]?.prox ?? null);
  } else {
    cur = getField(list, cfg.head);
  }
  const out = [];
  while (cur !== null && cur !== undefined && list.nodes[cur] && !out.includes(cur)) {
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

// id de aresta: "<origem>.<campo>-><destino>"
export const eid = (source, field, target) => `${source}.${field}->${target ?? NULL_ID}`;

// Texto de um valor de ponteiro: NULL, ? (lixo) ou endereço; `dangling` = aponta para memória liberada.
export function pointerText(list, target) {
  if (target === undefined) return { text: '?', dangling: false };
  if (target === null) return { text: 'NULL', dangling: false };
  return { text: addressOf(target), dangling: list.freed.includes(target) };
}

// Descrição completa de um objeto da memória (usada pelos painéis "Memória" e "Variáveis").
export function describeObject(list, id, ghosts = {}) {
  if (id === DESC_ID) {
    const cfg = KINDS[list.kind];
    return {
      id,
      address: addressOf(id),
      type: cfg.descStruct,
      freed: false,
      fields: list.desc.fields.map((f) => {
        if (f.kind === 'int') return { name: f.name, type: 'int', text: String(f.value), dangling: false, ptr: false };
        const p = pointerText(list, f.value);
        return { name: f.name, type: 'Elem*', text: p.text, dangling: p.dangling, ptr: true };
      }),
    };
  }
  const freed = Boolean(ghosts[id]);
  const node = list.nodes[id] ?? ghosts[id];
  if (!node) return null;
  const cfg = KINDS[list.kind];
  const fields = [{ name: 'valor', type: 'int', text: node.valor === null ? '?' : String(node.valor), dangling: false, ptr: false }];
  // ordem de declaração na struct do C: valor, prox, ant
  ['prox', 'ant'].filter((f) => cfg.nodeFields.includes(f)).forEach((f) => {
    const p = pointerText(list, node[f]);
    fields.push({ name: f, type: 'struct elemento*', text: p.text, dangling: p.dangling, ptr: true });
  });
  return { id, address: addressOf(id), type: 'Elem', freed, fields };
}

// ---------- variáveis do painel ----------

export const intVar = (name, value) => ({ name, type: 'int', kind: 'int', value });

// Parâmetro de saída (int* valor): aponta para uma variável do chamador.
export const outVar = (name, value) => ({ name, type: 'int*', kind: 'out', value });

// Ponteiro para Elem. `uninit`: declarado mas ainda sem valor (ex.: `Elem* ant;`).
// `dangling`: aponta para memória já liberada com free().
export function elemVar(name, target, list, uninit = false) {
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

// variável que aponta para o descritor (li, p ou f)
export function descVar(list) {
  const cfg = KINDS[list.kind];
  return {
    name: cfg.descVar,
    type: cfg.descType,
    kind: 'ptr',
    role: 'desc',
    target: DESC_ID,
    pointee: cfg.descStruct,
    uninit: false,
    dangling: false,
  };
}

// ---------- gravador de passos ----------

export function createRecorder(fn, list) {
  const rec = {
    steps: [],
    state: list,
    order: traverse(list),
    floating: {},
    ghosts: {},
    ended: false,
    makeVars: () => [],
    // Grava um passo. Nós liberados com rec.free() aparecem como "liberado" neste passo
    // e somem do desenho no passo seguinte.
    push(line, message, { edge = null, field = null, crash = false } = {}) {
      rec.steps.push({
        fn,
        line,
        message,
        list: rec.state,
        order: rec.order,
        floating: rec.floating,
        ghosts: rec.ghosts,
        vars: rec.ended ? [descVar(rec.state)] : rec.makeVars(),
        focusEdge: edge,
        focusField: field,
        crash,
      });
      const dead = Object.keys(rec.ghosts);
      if (dead.length) {
        rec.order = rec.order.filter((id) => !dead.includes(id));
        rec.floating = Object.fromEntries(Object.entries(rec.floating).filter(([id]) => !dead.includes(id)));
        rec.ghosts = {};
      }
    },
    // free(ponteiro): o nó sai da memória viva, mas fica desenhado (cinza) durante este passo.
    free(id) {
      rec.ghosts = { ...rec.ghosts, [id]: rec.state.nodes[id] };
      rec.state = freeNode(rec.state, id);
    },
    // return: as variáveis locais deixam de existir (só o descritor, que é do chamador, permanece).
    ret(line, message) {
      rec.ended = true;
      rec.push(line, message);
    },
  };
  return rec;
}

export function idleSnapshot(list) {
  return {
    fn: null,
    line: null,
    message: 'Estrutura pronta. Escolha uma função para ver o passo a passo do código C.',
    list,
    order: traverse(list),
    floating: {},
    ghosts: {},
    vars: [descVar(list)],
    focusEdge: null,
    focusField: null,
    crash: false,
  };
}
