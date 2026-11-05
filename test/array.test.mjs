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
    enqueue: (a, v) => (a.length < 5 ? [...a, v] : a),
    dequeue: (a) => a.slice(1),
    peek: (a) => a,
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
    if (['listaVet', 'pilhaVet', 'filaVet'].includes(st.mem.type)) {
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

for (const s of ARR.filter((x) => ['listaVet', 'pilhaVet', 'filaVet'].includes(x.type))) {
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

// ---------------- hash sem colisão, vetor de char ----------------
{
  const s = ARR.find((x) => x.type === 'hashChar');
  const ops = Object.keys(s.operations).filter((o) => o !== 'criaHash');
  const W = ['a', 'b', 'c', 'l', 'm', 'w', 'x', 'n', 'o', 'z', '0', 'g', '5', 'Q'];
  const pos = (c) => c.charCodeAt(0) % 11;
  const ref = (slots, qtd, op, c) => {
    const t = [...slots];
    const p = pos(c);
    if (op === 'insereHash_SemColisao_Rejeita') {
      if (qtd === 11 || t[p] !== null) return { slots: t, qtd, ret: 0 };
      t[p] = c;
      return { slots: t, qtd: qtd + 1, ret: 1 };
    }
    if (op === 'insereHash_SemColisao_Sobrescreve') { const q = t[p] === null ? qtd + 1 : qtd; t[p] = c; return { slots: t, qtd: q, ret: 1 }; }
    if (t[p] !== c) return { slots: t, qtd, ret: 0 };
    if (op === 'removeHash_SemColisao') { t[p] = null; return { slots: t, qtd: qtd - 1, ret: 1 }; }
    return { slots: t, qtd, ret: 1, pos: p };
  };
  for (let run = 0; run < 120; run += 1) {
    let m = s.create(run % 2 === 0);
    for (let k = 0; k < 40; k += 1) {
      const op = ops[rnd(ops.length)];
      if (op === 'liberaHash') {
        const r = s.operations.liberaHash.build(m);
        checkSteps(s, op, r);
        assert.ok(r.list.destroyed);
        const c = s.operations.criaHash.build(r.list);
        checkSteps(s, 'criaHash', c);
        assert.ok(!c.list.destroyed && c.list.slots.every((x) => x === null) && c.list.fields.qtd === 0);
        m = c.list;
        continue;
      }
      const ch = W[rnd(W.length)];
      const exp = ref(m.slots, m.fields.qtd, op, ch);
      const r = s.operations[op].build(m, ch);
      checkSteps(s, op, r);
      assert.match(r.steps.at(-1).message, new RegExp(`^return ${exp.ret}`), `${op}('${ch}') devia retornar ${exp.ret}`);
      assert.deepEqual(r.list.slots, exp.slots, `${op}('${ch}')`);
      assert.equal(r.list.fields.qtd, exp.qtd);
      m = r.list;
      assert.equal(m.fields.qtd, m.slots.filter((x) => x !== null).length, 'qtd != chars na tabela');
    }
  }
}

// ---------------- hash com endereçamento aberto (vetor de int) ----------------
for (const s of ARR.filter((x) => x.type === 'hashOpen')) {
  const ops = Object.keys(s.operations).filter((o) => o !== 'criaHash');
  const W = [15, 26, 37, 48, 5, 16, 20, 31, 0, 11, 22, 4, 9, 42];
  const strat = s.id.replace('hash-', '');
  const probe = (v, i) => {
    const p = v % 11;
    if (strat === 'linear') return (p + i) % 11;
    if (strat === 'quad') return (p + 2 * i + 5 * i * i) % 11;
    return (p + i * ((v % 10) + 1)) % 11;
  };
  const ref = (slots, qtd, op, v) => {
    const t = [...slots];
    if (op.startsWith('insere')) {
      if (qtd === 11) return { slots: t, qtd, ret: 0 };
      let livre = -1;
      for (let i = 0; i < 11; i += 1) {
        const n = probe(v, i);
        if (t[n] === null || t[n] === -2) { if (livre === -1) livre = n; if (t[n] === null) break; } else if (t[n] === v) return { slots: t, qtd, ret: 0 };
      }
      if (livre === -1) return { slots: t, qtd, ret: 0 };
      t[livre] = v;
      return { slots: t, qtd: qtd + 1, ret: 1 };
    }
    for (let i = 0; i < 11; i += 1) {
      const n = probe(v, i);
      if (t[n] === null) return { slots: t, qtd, ret: 0 };
      if (t[n] === v) {
        if (op.startsWith('remove')) { t[n] = -2; return { slots: t, qtd: qtd - 1, ret: 1 }; }
        return { slots: t, qtd, ret: 1, pos: n };
      }
    }
    return { slots: t, qtd, ret: 0 };
  };
  const inv = (m) => {
    const vals = m.slots.filter((x) => x !== null && x !== -2);
    assert.equal(m.fields.qtd, vals.length, `${s.id}: qtd != nº de valores`);
    assert.equal(new Set(vals).size, vals.length, `${s.id}: valor duplicado`);
  };
  for (let run = 0; run < 120; run += 1) {
    let m = s.create(run % 2 === 0);
    for (let k = 0; k < 40; k += 1) {
      const op = ops[rnd(ops.length)];
      if (op === 'liberaHash') {
        const r = s.operations.liberaHash.build(m);
        checkSteps(s, op, r);
        assert.ok(r.list.destroyed);
        const c = s.operations.criaHash.build(r.list);
        checkSteps(s, 'criaHash', c);
        assert.ok(!c.list.destroyed && c.list.slots.every((x) => x === null) && c.list.fields.qtd === 0);
        m = c.list;
        continue;
      }
      const v = W[rnd(W.length)];
      const exp = ref(m.slots, m.fields.qtd, op, v);
      const r = s.operations[op].build(m, v);
      checkSteps(s, op, r);
      assert.match(r.steps.at(-1).message, new RegExp(`^return ${exp.ret}`), `${s.id}.${op}(${v}) devia retornar ${exp.ret}`);
      assert.deepEqual(r.list.slots, exp.slots, `${s.id}.${op}(${v})`);
      assert.equal(r.list.fields.qtd, exp.qtd);
      if (op.startsWith('busca') && exp.ret === 1) assert.equal(r.steps.find((x) => x.line === 'setout').vars.find((v2) => v2.name === 'out').value, exp.pos);
      m = r.list;
      inv(m);
    }
  }
}

// ---------------- hash com lista encadeada ----------------
for (const s of ARR.filter((x) => x.type === 'hashChain')) {
  const ops = Object.keys(s.operations).filter((o) => o !== 'criaHash');
  const chains = (m) => m.slots.map((id) => { const r = []; for (let x = id; x; x = m.heap[x].prox) r.push(m.heap[x].valor); return r; });
  const inv = (m) => {
    const c = chains(m);
    assert.equal(m.fields.qtd, c.flat().length, 'encadeada: qtd != nós nas cadeias');
    assert.equal(Object.keys(m.heap).length, c.flat().length, 'encadeada: nó vazando no heap');
    c.forEach((ch, i) => ch.forEach((v) => assert.equal(hashPos(v, 11), i, 'valor na cadeia errada')));
    c.forEach((ch) => assert.equal(new Set(ch).size, ch.length, 'repetido na cadeia'));
  };
  const refOp = (c, op, v) => {
    const pos = hashPos(v, 11);
    const n = c.map((x) => [...x]);
    const has = n[pos].includes(v);
    if (op === 'insereHash_Encadeada') { if (!has) n[pos].unshift(v); return { c: n, ret: has ? 0 : 1 }; }
    if (op === 'buscaHash_Encadeada') return { c: n, ret: has ? 1 : 0 };
    if (has) n[pos].splice(n[pos].indexOf(v), 1);
    return { c: n, ret: has ? 1 : 0 };
  };
  const pool = [15, 26, 37, 48, 5, 16, 20, 31, 0, 11, 22];
  for (let run = 0; run < 80; run += 1) {
    let m = s.create(run % 2 === 0);
    inv(m);
    for (let k = 0; k < 40; k += 1) {
      const op = ops[rnd(ops.length)];
      const v = pool[rnd(pool.length)];
      const exp = refOp(chains(m), op, v);
      const r = s.operations[op].build(m, v);
      checkSteps(s, op, r);
      const last = r.steps.at(-1);
      assert.match(last.message, new RegExp(`^return ${exp.ret}`), `${op}(${v}) devia retornar ${exp.ret}`);
      assert.deepEqual(chains(r.list), exp.c, `${op}(${v})`);
      m = r.list;
      inv(m);
    }
    const l = s.operations.liberaHash.build(m);
    checkSteps(s, 'liberaHash', l);
    assert.ok(l.list.destroyed && Object.keys(l.list.heap).length === 0, 'liberaHash deixou nós no heap');
    const c = s.operations.criaHash.build(l.list);
    checkSteps(s, 'criaHash', c);
    assert.ok(!c.list.destroyed && c.list.slots.every((x) => x === null) && c.list.fields.qtd === 0);
  }
}
console.log(`ok (vetores/hash): ${checked} snapshots verificados em ${ARR.length} estruturas`);
