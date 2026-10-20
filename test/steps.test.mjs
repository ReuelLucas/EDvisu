import assert from 'node:assert/strict';
import { STRUCTURES } from '../src/structures/index.js';
import { KINDS, createList, getField, traverse } from '../src/memoryModel.js';

let checked = 0;
const fail = (msg) => { throw new Error(msg); };

// valores na ordem de percurso
const values = (list) => traverse(list).map((id) => list.nodes[id].valor);

function checkInvariants(s, list) {
  const cfg = KINDS[s.kind];
  const order = traverse(list);
  assert.equal(getField(list, 'qtd'), order.length, `${s.id}: qtd != nós`);
  // todo nó vivo está na cadeia
  assert.equal(Object.keys(list.nodes).length, order.length, `${s.id}: nó vazando (fora da cadeia)`);
  if (cfg.nodeFields.includes('ant')) {
    order.forEach((id, i) => {
      assert.equal(list.nodes[id].ant, i === 0 ? null : order[i - 1], `${s.id}: ant incorreto em ${id}`);
      assert.equal(list.nodes[id].prox, i === order.length - 1 ? null : order[i + 1], `${s.id}: prox incorreto em ${id}`);
    });
    assert.equal(getField(list, 'final'), order.length ? order.at(-1) : null, `${s.id}: final incorreto`);
    assert.equal(getField(list, 'inicio'), order.length ? order[0] : null, `${s.id}: inicio incorreto`);
  } else if (cfg.head === 'circular') {
    assert.equal(getField(list, 'final'), order.length ? order.at(-1) : null, `${s.id}: final incorreto`);
    order.forEach((id, i) => assert.equal(list.nodes[id].prox, order[(i + 1) % order.length], `${s.id}: anel quebrado em ${id}`));
  } else {
    order.forEach((id, i) => assert.equal(list.nodes[id].prox, i === order.length - 1 ? null : order[i + 1]));
    if (s.kind === 'fila') assert.equal(getField(list, 'final'), order.length ? order.at(-1) : null, 'fila: final incorreto');
  }
}

function checkSteps(s, op, result) {
  const fns = s.listing.FUNCTIONS;
  const { steps } = result;
  assert.ok(steps.length >= 2, `${s.id}.${op}: poucos passos`);
  steps.forEach((st, i) => {
    const lines = fns[st.fn];
    assert.ok(lines, `${s.id}.${op}: função ${st.fn} não existe no listing`);
    assert.ok(lines.some((l) => l.id === st.line), `${s.id}.${op} passo ${i}: linha "${st.line}" não existe em ${st.fn}`);
    assert.ok(st.message && st.vars.length, `${s.id}.${op} passo ${i}: sem mensagem/variáveis`);
    // ghost vive exatamente um passo
    Object.keys(st.ghosts).forEach((id) => {
      assert.ok(st.list.freed.includes(id), 'ghost precisa estar em freed');
      assert.ok(!st.list.nodes[id], 'ghost não pode estar na memória viva');
      const next = steps[i + 1];
      if (next) {
        assert.ok(!next.ghosts[id], 'ghost durou mais de um passo');
        assert.ok(!next.order.includes(id), 'ghost continua no desenho no passo seguinte');
      }
    });
    // todo id em order existe (vivo ou ghost)
    st.order.forEach((id) => assert.ok(st.list.nodes[id] || st.ghosts[id], `${s.id}.${op} passo ${i}: id ${id} em order sem nó`));
    checked += 1;
  });
  // ao fim, as variáveis locais morreram: só sobra o descritor
  const last = steps.at(-1);
  if (!last.crash) assert.equal(last.vars.length, 1, `${s.id}.${op}: variáveis locais não encerradas no return`);
}

// ---- modelos de referência ----
const REF = {
  lista: {
    inserir_inicio: (a, v) => [v, ...a],
    inserir_final: (a, v) => [...a, v],
    remover_inicio: (a) => a.slice(1),
    remover_final: (a) => a.slice(0, -1),
    tamanho_lista: (a) => a,
  },
  dupla: {
    inserir_inicio: (a, v) => [v, ...a],
    inserir_final: (a, v) => [...a, v],
    remover_inicio: (a) => (a.length === 1 ? a : a.slice(1)),
    remover_final: (a) => a.slice(0, -1),
    tamanho_lista: (a) => a,
  },
  circular: { inserir_inicio: (a, v) => [v, ...a], inserir_final: (a, v) => [...a, v] },
  pilha: { push: (a, v) => [v, ...a], pop: (a) => a.slice(1), peek: (a) => a, size: (a) => a },
  fila: { enqueue: (a, v) => [...a, v], dequeue: (a) => a.slice(1) },
};

let seed = 12345;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };

for (const s of STRUCTURES) {
  const ops = Object.keys(s.operations);
  // 1) cada operação, de lista vazia, com 1 nó e com vários
  for (const start of [[], [7], [1, 2, 3, 4]]) {
    for (const op of ops) {
      const list = createList(s.kind, start);
      checkInvariants(s, list);
      const r = s.operations[op].build(list, 99);
      checkSteps(s, op, r);
      checkInvariants(s, r.list);
      assert.deepEqual(values(r.list), REF[s.kind][op](start, 99), `${s.id}.${op} de ${JSON.stringify(start)}`);
    }
  }
  // 2) sequências aleatórias encadeadas
  for (let run = 0; run < 40; run += 1) {
    let list = createList(s.kind, s.initialValues);
    let ref = [...s.initialValues];
    for (let k = 0; k < 25; k += 1) {
      const op = ops[rnd(ops.length)];
      const v = rnd(100);
      const r = s.operations[op].build(list, v);
      checkSteps(s, op, r);
      ref = REF[s.kind][op](ref, v);
      list = r.list;
      checkInvariants(s, list);
      assert.deepEqual(values(list), ref, `${s.id}: divergiu após ${op}`);
    }
  }
}
// bug do original: remover_inicio com 1 nó na lista dupla trava
{
  const s = STRUCTURES.find((x) => x.id === 'dupla');
  const r = s.operations.remover_inicio.build(createList('dupla', [5]));
  assert.ok(r.steps.at(-1).crash, 'deveria registrar o segfault');
  assert.deepEqual(values(r.list), [5]);
}
console.log(`ok: ${checked} snapshots verificados em ${STRUCTURES.length} estruturas`);
