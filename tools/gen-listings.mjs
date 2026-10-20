// Uso: node tools/gen-listings.mjs <raiz-do-repo-EDL-2026-1> <hash-do-commit> <pasta-de-saida>
// Ex.: node tools/gen-listings.mjs ../EDL-2026-1 8e45a40... src/structures/listings
//
// Gera um arquivo por estrutura a partir do código C REAL da disciplina (texto verbatim + nº da linha).
// Cada linha executável recebe um `id` (usado pelos passos). Se o arquivo mudar e o texto esperado
// não bater, o script falha em vez de gerar uma listagem inconsistente.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , repoRoot, commit, outDir] = process.argv;
if (!repoRoot || !commit || !outDir) {
  console.error('uso: node tools/gen-listings.mjs <raiz-do-repo> <commit> <pasta-de-saida>');
  process.exit(1);
}

const BASE = 'estruturas-de-dados';
const END_ELEM = /^}\s*Elem;/;
const END_DESC = /^}\s*\*\s*\w+;/;

// [texto esperado (trim), id]  — na ordem em que aparecem; linhas sem par ficam com id null
const TAMANHO = [
  ['int tamanho_lista(Lista li){', 'sig'],
  ['if(li == NULL)', 'ifli'],
  ['return 0;', 'retz'],
  ['int count = 0;', 'count'],
  ['Elem* aux = li->inicio;', 'auxinit'],
  ['while(aux != NULL){', 'while'],
  ['count++;', 'inc'],
  ['aux = aux->prox;', 'avanca'],
  ['return count;', 'ret'],
];

const STRUCTURES = {
  simpleList: {
    path: `${BASE}/Lista/Lista-Unicamente-Encadeada/lista_int.c`,
    descStart: /^typedef struct lista\{/,
    functions: {
      inserir_inicio: [
        ['int inserir_inicio(Lista li, int valor){', 'sig'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no != NULL){', 'ifno'],
        ['no->valor = valor;', 'setvalor'],
        ['no->prox = li->inicio;', 'setprox'],
        ['li->inicio = no;', 'setinicio'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
        ['return 1;', 'ret1'],
      ],
      inserir_final: [
        ['int inserir_final(Lista li, int valor){', 'sig'],
        ['if(li == NULL)', 'ifli'],
        ['return 1;', 'retli'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no == NULL)', 'ifno'],
        ['return 1;', 'retno'],
        ['no->valor = valor;', 'setvalor'],
        ['no->prox = NULL;', 'setprox'],
        ['if(li->inicio == NULL){', 'ifvazia'],
        ['li->inicio = no;', 'vinicio'],
        ['li->qtd++;', 'vqtd'],
        ['return 0;', 'vret'],
        ['Elem* aux = li->inicio;', 'auxinit'],
        ['while(aux->prox != NULL){', 'while'],
        ['aux = aux->prox;', 'avanca'],
        ['aux->prox = no;', 'link'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
      ],
      remover_inicio: [
        ['int remover_inicio(Lista li){', 'sig'],
        ['if(li->inicio == NULL){', 'ifvazio'],
        ['return 1;', 'ret1'],
        ['Elem* no = li->inicio;', 'no'],
        ['li->inicio = no->prox;', 'setinicio'],
        ['li->qtd--;', 'qtddec'],
        ['free(no);', 'free'],
        ['return 0;', 'ret0'],
      ],
      remover_final: [
        ['int remover_final(Lista li){', 'sig'],
        ['if(li == NULL || li->inicio == NULL || li->qtd == 0)', 'ifguard'],
        ['return 1;', 'retguard'],
        ['Elem* aux = li->inicio;', 'auxinit'],
        ['Elem* ant;', 'antdecl'],
        ['if(aux->prox == NULL){', 'ifunico'],
        ['free(aux);', 'ufree'],
        ['li->inicio = NULL;', 'uinicio'],
        ['li->qtd--;', 'uqtd'],
        ['return 0;', 'uret'],
        ['while(aux->prox != NULL){', 'while'],
        ['ant = aux;', 'setant'],
        ['aux = aux ->prox;', 'avanca'],
        ['free(aux);', 'free'],
        ['ant->prox = NULL;', 'antnull'],
        ['li->qtd--;', 'qtddec'],
        ['return 0;', 'ret0'],
      ],
      tamanho_lista: TAMANHO,
    },
  },

  doublyList: {
    path: `${BASE}/Lista/Lista-Duplamente-Encadeada/lista_int.c`,
    descStart: /^typedef struct lista\{/,
    functions: {
      inserir_inicio: [
        ['int inserir_inicio(Lista li, int valor){', 'sig'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no != NULL){', 'ifno'],
        ['no->valor = valor;', 'setvalor'],
        ['no->prox = li->inicio;', 'setprox'],
        ['no->ant = NULL;', 'setant'],
        ['if(li->inicio != NULL){', 'ifinicio'],
        ['li->inicio->ant = no;', 'antinicio'],
        ['li->final = no;', 'setfinal'],
        ['li->inicio = no;', 'setinicio'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
        ['return 1;', 'ret1'],
      ],
      inserir_final: [
        ['int inserir_final(Lista li, int valor){', 'sig'],
        ['if(li == NULL)', 'ifli'],
        ['return 1;', 'retli'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no == NULL)', 'ifno'],
        ['return 1;', 'retno'],
        ['no->valor = valor;', 'setvalor'],
        ['no->prox = NULL;', 'setprox'],
        ['no->ant = li->final;', 'setant'],
        ['if(li->final != NULL){', 'iffinal'],
        ['li->final->prox = no;', 'finalprox'],
        ['li->inicio = no;', 'setinicio'],
        ['li->final = no;', 'setfinal'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
      ],
      remover_inicio: [
        ['int remover_inicio(Lista li){', 'sig'],
        ['if(li->inicio == NULL){', 'ifvazio'],
        ['return 1;', 'ret1'],
        ['Elem* no = li->inicio;', 'no'],
        ['li->inicio = no->prox;', 'setinicio'],
        ['li->inicio->ant = NULL;', 'antnull'],
        ['li->qtd--;', 'qtddec'],
        ['free(no);', 'free'],
        ['return 0;', 'ret0'],
      ],
      remover_final: [
        ['int remover_final(Lista li){', 'sig'],
        ['if(li == NULL || li->inicio == NULL || li->qtd == 0)', 'ifguard'],
        ['return 1;', 'retguard'],
        ['Elem* no = li->final;', 'no'],
        ['li->final = no->ant;', 'setfinal'],
        ['if(li->final != NULL){', 'iffinal'],
        ['li->final->prox = NULL;', 'proxnull'],
        ['li->inicio = NULL;', 'inicionull'],
        ['li->qtd--;', 'qtddec'],
        ['free(no);', 'free'],
        ['return 0;', 'ret0'],
      ],
      tamanho_lista: TAMANHO,
    },
  },

  circularList: {
    path: `${BASE}/Lista/Lista-Unicamente-Encadeada-Circular/lista_int.c`,
    descStart: /^typedef struct lista\{/,
    functions: {
      inserir_inicio: [
        ['int inserir_inicio(Lista li, int valor){', 'sig'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no != NULL){', 'ifno'],
        ['no->valor = valor;', 'setvalor'],
        ['if(li->final == NULL){', 'ifvazia'],
        ['no->prox = no;', 'selfprox'],
        ['li->final = no;', 'setfinal'],
        ['no->prox = li->final->prox;', 'setprox'],
        ['li->final->prox = no;', 'finalprox'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
        ['return 1;', 'ret1'],
      ],
      inserir_final: [
        ['int inserir_final(Lista li, int valor){', 'sig'],
        ['if(li == NULL)', 'ifli'],
        ['return 1;', 'retli'],
        ['Elem* no = malloc(sizeof(Elem));', 'malloc'],
        ['if(no == NULL)', 'ifno'],
        ['return 1;', 'retno'],
        ['no->valor = valor;', 'setvalor'],
        ['if(li->final == NULL){', 'ifvazia'],
        ['li->final = no;', 'setfinal'],
        ['no->prox = no;', 'selfprox'],
        ['no->prox = li->final->prox;', 'setprox'],
        ['li->final->prox = no;', 'finalprox'],
        ['li->final = no;', 'setfinal2'],
        ['li->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
      ],
    },
  },

  stack: {
    path: `${BASE}/Pilha/Dinamica/pilha_int.c`,
    descStart: /^typedef struct pilha\s*\{/,
    functions: {
      push: [
        ['int push(Pilha p, int valor) {', 'sig'],
        ['if (p == NULL) return 1;', 'ifp'],
        ['Elem *no = malloc(sizeof(struct elemento));', 'malloc'],
        ['if (no == NULL) return 1;', 'ifno'],
        ['no->valor = valor;', 'setvalor'],
        ['if (p->qtd == 0) {', 'ifvazia'],
        ['no->prox = NULL;', 'proxnull'],
        ['no->prox = p->topo;', 'proxtopo'],
        ['p->topo = no;', 'settopo'],
        ['p->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
      ],
      pop: [
        ['int pop(Pilha p){', 'sig'],
        ['Elem* aux = p->topo;', 'auxinit'],
        ['if(p->topo != NULL){', 'iftopo'],
        ['p->topo = p->topo->prox;', 'settopo'],
        ['return 1;', 'ret1'],
        ['p->qtd--;', 'qtddec'],
        ['free(aux);', 'free'],
        ['return 0;', 'ret0'],
      ],
      peek: [
        ['int peek(Pilha p, int *valor){', 'sig'],
        ['if(p == NULL || p->topo == NULL){', 'ifguard'],
        ['return 1;', 'ret1'],
        ['*valor = p->topo->valor;', 'setvalor'],
        ['return 0;', 'ret0'],
      ],
      size: [
        ['int size(Pilha p){', 'sig'],
        ['if(p ==NULL){', 'ifp'],
        ['return 0;', 'retz'],
        ['return p->qtd;', 'ret'],
      ],
    },
  },

  queue: {
    path: `${BASE}/Fila/Fila-dinamica/fila_int.c`,
    descStart: /^typedef struct fila\s*\{/,
    functions: {
      enqueue: [
        ['int enqueue(Fila f, int dado){', 'sig'],
        ['if(f == NULL) return 1;', 'iff'],
        ['Elem *no = malloc(sizeof(Elem));', 'malloc'],
        ['no->valor = dado;', 'setvalor'],
        ['no->prox = NULL;', 'setprox'],
        ['if(f->final == NULL){', 'iffinal'],
        ['f->inicio = no;', 'setinicio'],
        ['f->final->prox = no;', 'linkfinal'],
        ['f->final = no;', 'setfinal'],
        ['f->qtd++;', 'qtdinc'],
        ['return 0;', 'ret0'],
      ],
      dequeue: [
        ['int dequeue(Fila f){', 'sig'],
        ['if(f == NULL || f->qtd == 0) return 1;', 'ifguard'],
        ['Elem *aux = f->inicio;', 'auxinit'],
        ['f->inicio = aux->prox; // f->inicio->prox', 'setinicio'],
        ['if(f->inicio == NULL)', 'ifvazio'],
        ['f->final = NULL;', 'setfinal'],
        ['free(aux);', 'free'],
        ['f->qtd--;', 'qtddec'],
        ['return 0;', 'ret0'],
      ],
    },
  },
};

const q = (str) => "'" + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const fmtLine = (l) => `    { n: ${l.n}, ${'id' in l ? `id: ${l.id === null ? 'null' : q(l.id)}, ` : ''}text: ${q(l.text)} },`;
const fmtBlock = (lines) => `[\n${lines.map(fmtLine).join('\n')}\n  ]`;

mkdirSync(outDir, { recursive: true });

for (const [name, def] of Object.entries(STRUCTURES)) {
  const raw = readFileSync(join(repoRoot, def.path), 'utf8')
    .split('\n')
    .map((t, i) => ({ n: i + 1, text: t.replace(/\s+$/, '') }));

  const block = (startRe, endRe) => {
    const s = raw.findIndex((l) => startRe.test(l.text));
    const e = raw.findIndex((l, i) => i >= s && endRe.test(l.text));
    if (s < 0 || e < 0) throw new Error(`${name}: bloco não encontrado: ${startRe}`);
    return raw.slice(s, e + 1);
  };

  const functions = {};
  for (const [fn, spec] of Object.entries(def.functions)) {
    const lines = block(new RegExp(`^\\w+ ${fn}\\(`), /^}$/);
    let j = 0;
    functions[fn] = lines.map((l) => {
      let id = null;
      if (j < spec.length && l.text.trim() === spec[j][0]) {
        id = spec[j][1];
        j += 1;
      }
      return { n: l.n, id, text: l.text };
    });
    if (j !== spec.length) throw new Error(`${name}.${fn}: só casou ${j}/${spec.length} linhas (esperava "${spec[j][0]}")`);
  }

  const strip = (arr) => arr.map(({ n, text }) => ({ n, text }));
  const structs = {
    elemento: strip(block(/^typedef struct elemento\s*\{/, END_ELEM)),
    desc: strip(block(def.descStart, END_DESC)),
  };

  const file = def.path.split('/').pop();
  const js = `// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um \`id\` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '${commit}',
  path: '${def.path}',
  file: '${file}',
};

export const STRUCTS = {
  elemento: ${fmtBlock(structs.elemento)},
  desc: ${fmtBlock(structs.desc)},
};

export const FUNCTIONS = {
${Object.entries(functions).map(([fn, lines]) => `  ${fn}: ${fmtBlock(lines)},`).join('\n')}
};
`;
  writeFileSync(join(outDir, `${name}.js`), js);
  console.log(`${name}: ${Object.entries(functions).map(([k, v]) => `${k}(${v.length} linhas, ${v.filter((l) => l.id).length} ids)`).join(', ')}`);
}
