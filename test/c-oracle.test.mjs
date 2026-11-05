// Oráculo em C: compila o código C REAL (repositório + tools/autoral) com gcc, executa a mesma sequência de
// operações e compara com os passos do EDvisu (estado final da tabela e resultado de cada chamada).
// Se não houver gcc, o teste é ignorado.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STRUCTURES } from '../src/structures/index.js';

try { execFileSync('gcc', ['--version'], { stdio: 'ignore' }); } catch { console.log('c-oracle: gcc não encontrado, teste ignorado'); process.exit(0); }

const STRATS = ['linear', 'quad', 'duplo'];
const WORDS = [15, 26, 37, 48, 5, 16, 20, 31, 0, 11, 22, 4, 9, 42, 7, 100];
let seed = 99;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const dir = mkdtempSync(join(tmpdir(), 'edvisu-c-'));
let comparados = 0;

for (const strat of STRATS) {
  const s = STRUCTURES.find((x) => x.id === `hash-${strat}`);
  const L = s.listing.FUNCTIONS;
  const text = (fn) => L[fn].map((l) => l.text).join('\n');
  const suf = { linear: 'SondagemLinear', quad: 'SondagemQuadratica', duplo: 'DuploHash' }[strat];
  const authored = readFileSync(`tools/autoral/hash_${strat === 'quad' ? 'quadratica' : strat}.c`, 'utf8');
  const c = `#include <stdio.h>\n#include <stdlib.h>\n${text('chaveDivisao')}\n${authored}
int main(){
  Hash *ha = criaHash(11);
  char op[4]; int w;
  while (scanf("%3s %d", op, &w) == 2) {
    int out = -1, r;
    if (op[0]=='I') r = insereHash_${suf}(ha, w);
    else if (op[0]=='B') r = buscaHash_${suf}(ha, w, &out);
    else r = removeHash_${suf}(ha, w);
    printf("%d %d %d |", r, out, ha->qtd);
    for (int i = 0; i < ha->TABLE_SIZE; i++) printf(" %d", ha->itens[i]);
    printf("\\n");
  }
  liberaHash(ha);
  return 0;
}`;
  writeFileSync(join(dir, `${strat}.c`), c);
  execFileSync('gcc', ['-O0', '-o', join(dir, strat), join(dir, `${strat}.c`)]);

  for (let run = 0; run < 25; run += 1) {
    const cmds = Array.from({ length: 30 }, () => ['I', 'I', 'B', 'R'][rnd(4)] + ' ' + WORDS[rnd(WORDS.length)]);
    const out = execFileSync(join(dir, strat), { input: cmds.join('\n') + '\n' }).toString().trim().split('\n');
    let mem = s.create(true);
    cmds.forEach((cmd, k) => {
      const [op, w] = cmd.split(' ');
      const name = { I: `insereHash_${suf}`, B: `buscaHash_${suf}`, R: `removeHash_${suf}` }[op];
      const r = s.operations[name].build(mem, Number(w));
      mem = r.list;
      const last = r.steps.at(-1);
      const ok = r.steps.some((x) => x.line === 'ret1');
      const found = r.steps.find((x) => x.line === 'setout');
      const jsOut = found ? found.vars.find((v) => v.name === 'out').value : -1;
      const row = mem.slots.map((x) => (x === null ? -1 : x)).join(' ');
      const jsLine = `${ok ? 1 : 0} ${jsOut} ${mem.fields.qtd} | ${row}`;
      assert.equal(jsLine, out[k], `${strat} run ${run} cmd ${k} (${cmd}): C e EDvisu divergem\n  C : ${out[k]}\n  JS: ${jsLine}`);
      assert.ok(last, 'sem passos');
      comparados += 1;
    });
  }
}
console.log(`ok (oráculo C): ${comparados} operações iguais entre o C compilado e o EDvisu`);
