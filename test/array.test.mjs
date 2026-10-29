// Testes das estruturas com vetor e da tabela hash: contrato de ids do listing, modelos de referência
// e sequências aleatórias de operações.
import assert from 'node:assert/strict';
import { STRUCTURES } from '../src/structures/index.js';
import { hashPos, validMask } from '../src/arrayModel.js';

const ARR = STRUCTURES.filter((s) => s.view === 'array');
let checked = 0;

const logical = (m) => {
  if (m.type === 'listaVet') return m.dados.slice(0, m.fields.qtd);
  if (m.type === 'pilhaVet') return m.dados.slice(0, m.fields.topo);
  if (m.type === 'filaVet') return Array.from({ length: m.fields.qtd }, (_, k) => m.dados[(m.fields.inicio + k) % m.max]);
  throw new Error('tipo');
};
const removeAt = (a, i) => (i < 0 ? a : [...a.slice(0, i), ...a.slice(i + 1)]);

const REF = {
  listaVet: {
    inserir_inicio: (a, v) => (a.length < 6 ? [v, ...a] : a),
    inserir_final: (a, v) => (a.length < 6 ? [...a, v] : a),
    remover_inicio: (a) => a.slice(1),
    remover_final: (a) => a.slice(0, -1),
    tamanho_lista: (a) => a,
    busca_valor: (a) => a,
    remove_valor: (a, v) => removeAt(a, a.indexOf(v)),
    destruir: (a) => a,
    find: (a, v) => a.indexOf(v),
  },
  pilhaVet: {
    push: (a, v) => (a.length < 3 ? [...a, v] : a),
    pop: (a) => a.slice(0, -1),
    peek: (a) => a,
    tamanho_pilha: (a) => a,
    busca_valor: (a) => a,
    remove_valor: (a, v) => removeAt(a, a.lastIndexOf(v)),
    destruir_pilha: (a) => a,
    find: (a, v) => a.lastIndexOf(v),
  },
  filaVet: {
    inserir: (a, v) => (a.length < 5 ? [...a, v] : a),
    remover: (a) => a.slice(1),
    acessar: (a) => a,
    tamanho: (a) => a,
    busca_valor: (a) => a,
    remove_valor: (a, v) => removeAt(a, a.indexOf(v)),
    destruir: (a) => a,
    find: (a, v) => a.indexOf(v),
  },
};
const DESTROY = new Set(['destruir', 'destruir_pilha']);

function checkSteps(s, op, r) {
  const { steps } = r;
  assert.ok(steps.length >= 2, `${s.id}.${op}: poucos passos`);
  steps.forEach((st, i) => {
    const lines = s.listing.FUNCTIONS[st.fn];
    assert.ok(lines, `${s.id}.${op}: função ${st.fn} não existe no listing`);
    assert.ok(lines.some((l) => l.id === st.line), `${s.id}.${op} passo ${i}: linha "${st.line}" não existe em ${st.fn}`);
    assert.ok(st.message && st.vars.length, `${s.id}.${op} passo ${i}: sem mensagem/variáveis`);
    if (st.mem.type !== 'hash') {
      assert.equal(st.mem.dados.length, st.mem.max, 'vetor mudou de tamanho');
      if (!st.mem.destroyed) {
        st.vars.filter((v) => v.markIdx !== undefined).forEach((v) => assert.ok(v.markIdx >= 0 && v.markIdx <= st.mem.max, `${s.id}.${op}: marcador ${v.name}=${v.markIdx} fora do vetor`));
      }
    }
    const next = steps[i + 1];
    Object.keys(st.ghosts ?? {}).forEach((id) => { if (next) assert.ok(!next.ghosts[id], 'ghost durou mais de um passo'); });
    checked += 1;
  });
  const last = steps.at(-1);
  assert.equal(last.vars.length, 1, `${s.id}.${op}: variáveis locais não encerradas no return`);
}

function checkValueOps(s, op, before, v, r) {
  const ref = REF[s.type];
  if (op === 'busca_valor') {
    const idx = ref.find(before, v);
    const st = r.steps.find((x) => x.line === 'setpos');
    if (idx >= 0) {
      assert.ok(st, `${s.id}.busca_valor(${v}) devia achar em ${JSON.stringify(before)}`);
      assert.equal(st.vars.find((x) => x.name === 'pos').value, idx, `${s.id}.busca_valor: posição errada`);
    } else {
      assert.ok(!st, `${s.id}.busca_valor(${v}) não devia achar em ${JSON.stringify(before)}`);
      assert.ok(r.steps.some((x) => x.line === 'retnao' || x.line === 'retguard'));
    }
  }
  if (DESTROY.has(op)) assert.ok(r.list.destroyed && r.steps.at(-1).vars[0].dangling, `${s.id}.${op}: não marcou destruída`);
}

let seed = 4242;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };

for (const s of ARR.filter((x) => x.type !== 'hash')) {
  const ops = Object.keys(s.operations);
  const ref = REF[s.type];
  const starts = [[], [7], [1, 2], [1, 2, 3], [5, 9, 5]].map((a) => a.slice(0, s.create(false).max));
  starts.push(Array.from({ length: s.create(false).max }, (_, i) => i + 1)); // cheia
  const mk = (vals) => s.create(false) && (() => {
    // monta a partir de valores: usa create(false) como base e reconstrói por inserções diretas
    const m = s.create(true);
    const n = vals.length;
    const dados = m.dados.map((_, i) => (i < n ? vals[i] : null));
    const fields = s.type === 'pilhaVet' ? { topo: n } : s.type === 'filaVet' ? { inicio: 0, final: n % m.max, qtd: n } : { qtd: n };
    return { ...m, dados, fields };
  })();

  for (const start of starts) {
    for (const op of ops) {
      for (const v of [99, start[0] ?? 99, start.at(-1) ?? 99, start[1] ?? 99]) {
        const mem = mk(start);
        assert.deepEqual(logical(mem), start);
        const r = s.operations[op].build(mem, v);
        checkSteps(s, op, r);
        checkValueOps(s, op, start, v, r);
        if (!DESTROY.has(op)) assert.deepEqual(logical(r.list), ref[op](start, v), `${s.id}.${op}(${v}) de ${JSON.stringify(start)}`);
      }
    }
  }
  for (let run = 0; run < 60; run += 1) {
    let mem = s.create(false);
    let a = logical(mem);
    for (let k = 0; k < 30; k += 1) {
      const op = ops[rnd(ops.length)];
      const v = rnd(6);
      const r = s.operations[op].build(mem, v);
      checkSteps(s, op, r);
      checkValueOps(s, op, a, v, r);
      if (DESTROY.has(op)) break;
      a = ref[op](a, v);
      mem = r.list;
      assert.deepEqual(logical(mem), a, `${s.id}: divergiu após ${op}(${v})`);
      if (s.type === 'filaVet') assert.equal(mem.fields.final, (mem.fields.inicio + mem.fields.qtd) % mem.max, 'fila: final inconsistente');
      assert.equal(validMask(mem).filter(Boolean).length, a.length);
    }
  }
}

// ---------------- tabela hash ----------------
{
  const s = ARR.find((x) => x.type === 'hash');
  const ops = Object.keys(s.operations).filter((o) => o !== 'criaHash');
  const content = (m) => Object.fromEntries(m.slots.map((id, i) => [i, id ? m.heap[id]?.valor : undefined]).filter(([, v]) => v !== undefined));
  const invariants = (m) => {
    const used = m.slots.filter(Boolean);
    assert.equal(m.fields.qtd, used.length, 'hash: qtd != slots ocupados');
    assert.equal(Object.keys(m.heap).length, used.length, 'hash: int vazando no heap');
    used.forEach((id) => assert.ok(m.heap[id], 'slot aponta para int inexistente'));
    Object.entries(content(m)).forEach(([i, v]) => assert.equal(hashPos(v, m.max), Number(i), 'valor na posição errada'));
  };
  const refOp = (c, op, v) => {
    const pos = hashPos(v, 11);
    const n = { ...c };
    if (op === 'insereHash_SemColisao_Rejeita') { if (Object.keys(c).length < 11 && c[pos] === undefined) n[pos] = v; }
    if (op === 'insereHash_SemColisao_Sobrescreve') n[pos] = v;
    if (op === 'removeHash_SemColisao') { if (c[pos] === v) delete n[pos]; }
    return n;
  };
  for (const start of [[], [15], [15, 20, 5], [-10, 3, 14, 22]]) {
    for (const op of ops) {
      for (const v of [15, 26, 99, -10, 3, 4, 0]) {
        let m = s.create(true);
        let c = {};
        start.forEach((x) => { const r = s.operations.insereHash_SemColisao_Sobrescreve.build(m, x); m = r.list; c = refOp(c, 'insereHash_SemColisao_Sobrescreve', x); });
        const r = s.operations[op].build(m, v);
        checkSteps(s, op, r);
        if (op !== 'liberaHash') {
          invariants(r.list);
          assert.deepEqual(content(r.list), refOp(c, op, v), `hash.${op}(${v}) de ${JSON.stringify(start)}`);
        }
        if (op === 'buscaHash_SemColisao') {
          const achou = c[hashPos(v, 11)] === v;
          assert.equal(r.steps.some((x) => x.line === 'setout'), achou, `hash.busca(${v}) resultado errado`);
          if (achou) assert.equal(r.steps.find((x) => x.line === 'setout').vars.find((x) => x.name === 'out').value, v);
        }
        if (op === 'liberaHash') {
          assert.ok(r.list.destroyed && r.list.parts.desc === 'freed' && r.list.parts.vec === 'freed');
          assert.equal(Object.keys(r.list.heap).length, 0, 'liberaHash deixou int vazando');
          // cria de novo
          const c2 = s.operations.criaHash.build(r.list);
          checkSteps(s, 'criaHash', c2);
          invariants(c2.list);
          assert.equal(c2.list.destroyed, false);
          assert.deepEqual(content(c2.list), {});
          assert.ok(c2.list.slots.every((x) => x === null), 'criaHash: slots não ficaram NULL');
        }
      }
    }
  }
  for (let run = 0; run < 60; run += 1) {
    let m = s.create(false);
    let c = content(m);
    for (let k = 0; k < 30; k += 1) {
      const op = ops[rnd(ops.length)];
      if (op === 'liberaHash') break;
      const v = rnd(30) - 3;
      const r = s.operations[op].build(m, v);
      checkSteps(s, op, r);
      c = refOp(c, op, v);
      m = r.list;
      invariants(m);
      assert.deepEqual(content(m), c, `hash: divergiu após ${op}(${v})`);
    }
  }
}
console.log(`ok (vetores/hash): ${checked} snapshots verificados em ${ARR.length} estruturas`);
