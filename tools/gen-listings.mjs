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


// ---------- busca_valor / remove_valor / destruir ----------
// destruir existe no repositório (lista simples, dupla e pilha): entra verbatim. O resto é AUTORAL e vive em
// tools/autoral/*.c (marcado na interface como "não está no repositório").
const buscaSpec = (T, v, head) => [
  [`int busca_valor(${T} ${v}, int valor, int* pos){`, 'sig'],
  [`if(${v} == NULL || ${v}->${head} == NULL)`, 'ifguard'],
  ['return 1;', 'retguard'],
  [`Elem* aux = ${v}->${head};`, 'auxinit'],
  ['int i = 0;', 'icount'],
  ['while(aux != NULL){', 'while'],
  ['if(aux->valor == valor){', 'ifigual'],
  ['*pos = i;', 'setpos'],
  ['return 0;', 'ret0'],
  ['aux = aux->prox;', 'avanca'],
  ['i++;', 'inc'],
  ['return 1;', 'retnao'],
];
const removeSimplesSpec = (T, v, head, tail) => [
  [`int remove_valor(${T} ${v}, int valor){`, 'sig'],
  [`if(${v} == NULL || ${v}->${head} == NULL)`, 'ifguard'],
  ['return 1;', 'retguard'],
  [`Elem* aux = ${v}->${head};`, 'auxinit'],
  ['Elem* ant = NULL;', 'antinit'],
  ['while(aux != NULL && aux->valor != valor){', 'while'],
  ['ant = aux;', 'setant'],
  ['aux = aux->prox;', 'avanca'],
  ['if(aux == NULL)', 'ifnao'],
  ['return 1;', 'retnao'],
  ['if(ant == NULL)', 'ifprim'],
  [`${v}->${head} = aux->prox;`, 'sethead'],
  ['ant->prox = aux->prox;', 'link'],
  ...(tail ? [[`if(aux == ${v}->${tail})`, 'iftail'], [`${v}->${tail} = ant;`, 'settail']] : []),
  ['free(aux);', 'free'],
  [`${v}->qtd--;`, 'qtddec'],
  ['return 0;', 'ret0'],
];
const destruirLista = (T, v, head) => [
  [`void destruir(${T} ${v}){`, 'sig'],
  [`if(${v} != NULL){`, 'ifli'],
  [`Elem* no = ${v}->${head};`, 'noinit'],
  ['while(no != NULL){', 'while'],
  ['Elem *prox = no->prox;', 'proxinit'],
  ['free(no);', 'free'],
  ['no = prox;', 'avanca'],
  [`free(${v});`, 'freedesc'],
];

STRUCTURES.simpleList.functions.destruir = destruirLista('Lista', 'li', 'inicio');
STRUCTURES.doublyList.functions.destruir = destruirLista('Lista', 'li', 'inicio');
STRUCTURES.stack.functions.destruir = [
  ['void destruir(Pilha p){', 'sig'],
  ['if(p != NULL){', 'ifli'],
  ['Elem * aux;', 'auxdecl'],
  ['while(p->topo != NULL){', 'while'],
  ['aux = p->topo;', 'setaux'],
  ['p->topo = aux->prox;', 'settopo'],
  ['free(aux);', 'free'],
  ['free(p);', 'freedesc'],
];

const AUTORAL = 'tools/autoral';
STRUCTURES.simpleList.authored = { file: `${AUTORAL}/lista_simples.c`, functions: {
  busca_valor: buscaSpec('Lista', 'li', 'inicio'), remove_valor: removeSimplesSpec('Lista', 'li', 'inicio', null) } };
STRUCTURES.queue.authored = { file: `${AUTORAL}/fila.c`, functions: {
  destruir: [
    ['void destruir(Fila f){', 'sig'],
    ['if(f != NULL){', 'ifli'],
    ['Elem* aux = f->inicio;', 'noinit'],
    ['while(aux != NULL){', 'while'],
    ['Elem* prox = aux->prox;', 'proxinit'],
    ['free(aux);', 'free'],
    ['aux = prox;', 'avanca'],
    ['free(f);', 'freedesc'],
  ] } };
STRUCTURES.doublyList.authored = { file: `${AUTORAL}/lista_dupla.c`, functions: {
  busca_valor: buscaSpec('Lista', 'li', 'inicio'),
  remove_valor: [
    ['int remove_valor(Lista li, int valor){', 'sig'],
    ['if(li == NULL || li->inicio == NULL)', 'ifguard'],
    ['return 1;', 'retguard'],
    ['Elem* aux = li->inicio;', 'auxinit'],
    ['while(aux != NULL && aux->valor != valor)', 'while'],
    ['aux = aux->prox;', 'avanca'],
    ['if(aux == NULL)', 'ifnao'],
    ['return 1;', 'retnao'],
    ['if(aux->ant == NULL)', 'ifprim'],
    ['li->inicio = aux->prox;', 'sethead'],
    ['aux->ant->prox = aux->prox;', 'linkant'],
    ['if(aux->prox == NULL)', 'ifult'],
    ['li->final = aux->ant;', 'settail'],
    ['aux->prox->ant = aux->ant;', 'linkprox'],
    ['free(aux);', 'free'],
    ['li->qtd--;', 'qtddec'],
    ['return 0;', 'ret0'],
  ] } };
STRUCTURES.circularList.authored = { file: `${AUTORAL}/lista_circular.c`, functions: {
  busca_valor: [
    ['int busca_valor(Lista li, int valor, int* pos){', 'sig'],
    ['if(li == NULL || li->final == NULL)', 'ifguard'],
    ['return 1;', 'retguard'],
    ['Elem* aux = li->final->prox;', 'auxinit'],
    ['int i = 0;', 'icount'],
    ['while(i < li->qtd){', 'while'],
    ['if(aux->valor == valor){', 'ifigual'],
    ['*pos = i;', 'setpos'],
    ['return 0;', 'ret0'],
    ['aux = aux->prox;', 'avanca'],
    ['i++;', 'inc'],
    ['return 1;', 'retnao'],
  ],
  remove_valor: [
    ['int remove_valor(Lista li, int valor){', 'sig'],
    ['if(li == NULL || li->final == NULL)', 'ifguard'],
    ['return 1;', 'retguard'],
    ['Elem* ant = li->final;', 'antinit'],
    ['Elem* aux = ant->prox;', 'auxinit'],
    ['int i = 0;', 'icount'],
    ['while(i < li->qtd && aux->valor != valor){', 'while'],
    ['ant = aux;', 'setant'],
    ['aux = aux->prox;', 'avanca'],
    ['i++;', 'inc'],
    ['if(i == li->qtd)', 'ifnao'],
    ['return 1;', 'retnao'],
    ['if(li->qtd == 1){', 'ifunico'],
    ['li->final = NULL;', 'setfinalnull'],
    ['ant->prox = aux->prox;', 'link'],
    ['if(aux == li->final)', 'iftail'],
    ['li->final = ant;', 'settail'],
    ['free(aux);', 'free'],
    ['li->qtd--;', 'qtddec'],
    ['return 0;', 'ret0'],
  ],
  destruir: [
    ['void destruir(Lista li){', 'sig'],
    ['if(li != NULL){', 'ifli'],
    ['if(li->final != NULL){', 'iffinal'],
    ['Elem* no = li->final->prox;', 'noinit'],
    ['li->final->prox = NULL;', 'quebra'],
    ['while(no != NULL){', 'while'],
    ['Elem* prox = no->prox;', 'proxinit'],
    ['free(no);', 'free'],
    ['no = prox;', 'avanca'],
    ['free(li);', 'freedesc'],
  ] } };


// ---------- estruturas com VETOR (pilha/fila estáticas e hash são do repositório; lista sequencial é autoral) ----------
const END_PTR = /^}\s*\*\s*\w+;/;
const buscaVetor = (T, v, guard, init, whileTxt, ifTxt, dec) => [
  [`int busca_valor(${T} ${v}, int valor, int* pos){`, 'sig'],
  [guard, 'ifguard'],
  ['return 1;', 'retguard'],
  [init, 'icount'],
  [whileTxt, 'while'],
  [ifTxt, 'ifigual'],
  ['*pos = i;', 'setpos'],
  ['return 0;', 'ret0'],
  [dec, 'inc'],
  ['return 1;', 'retnao'],
];

STRUCTURES.stackVet = {
  path: `${BASE}/Pilha/Estatica/pilha_int.c`,
  structs: [{ key: 'desc', start: /^typedef struct pilha\s*\{/, end: END_PTR }],
  functions: {
    push: [
      ['int push(Pilha p, int matricula){', 'sig'],
      ['if(p->topo < MAX && p != NULL){', 'ifok'],
      ['p->dados[p->topo] = matricula;', 'setdado'],
      ['p->topo++;', 'topoinc'],
      ['return 0;', 'ret0'],
      ['return 1;', 'ret1'],
    ],
    peek: [
      ['int peek(Pilha p, int* matricula){', 'sig'],
      ['if (p->topo == 0 || p == NULL)', 'ifvazia'],
      ['return 1;', 'ret1'],
      ['*matricula = p->dados[p->topo - 1];', 'setout'],
      ['return 0;', 'ret0'],
    ],
    pop: [
      ['int pop(Pilha p){', 'sig'],
      ['if (p->topo == 0 || p == NULL)', 'ifvazia'],
      ['return 1;', 'ret1'],
      ['p->topo--;', 'topodec'],
      ['return 0;', 'ret0'],
    ],
    tamanho_pilha: [
      ['int tamanho_pilha(Pilha p){', 'sig'],
      ['if(p == NULL)', 'ifp'],
      ['return 0;', 'retz'],
      ['return p->topo;', 'ret'],
    ],
    destruir_pilha: [
      ['void destruir_pilha(Pilha p){', 'sig'],
      ['if(p != NULL)', 'ifp'],
      ['free(p);', 'freedesc'],
    ],
  },
};

STRUCTURES.queueVet = {
  path: `${BASE}/Fila/Fila-estatica/fila_int.c`,
  // nomes do repositório -> nomes usados no EDvisu (a listagem mostra o NOVO nome e avisa o original)
  rename: { inserir: 'enqueue', remover: 'dequeue', acessar: 'peek' },
  structs: [{ key: 'desc', start: /^struct fila\s*\{/, end: /^};/ }],
  functions: {
    inserir: [
      ['int inserir(Fila f, int valor){', 'sig'],
      ['if(f->qtd < MAX && f != NULL){', 'ifok'],
      ['f->dados[f->final] = valor;', 'setdado'],
      ['f->final = (f->final + 1) % MAX;', 'setfinal'],
      ['f->qtd++;', 'qtdinc'],
      ['return 0;', 'ret0'],
      ['return 1;', 'ret1'],
    ],
    remover: [
      ['int remover(Fila f){', 'sig'],
      ['if(f->qtd == 0 || f == NULL){', 'ifvazia'],
      ['return 1;', 'ret1'],
      ['f->inicio = (f->inicio + 1) % MAX;', 'setinicio'],
      ['f->qtd--;', 'qtddec'],
      ['return 0;', 'ret0'],
    ],
    acessar: [
      ['int acessar(Fila f, int* valor){', 'sig'],
      ['if(f->qtd == 0 || f == NULL){', 'ifvazia'],
      ['return 1;', 'ret1'],
      ['*valor = f->dados[f->inicio];', 'setout'],
      ['return 0;', 'ret0'],
    ],
    tamanho: [
      ['int tamanho(Fila f){', 'sig'],
      ['if(f == NULL){', 'ifp'],
      ['return 0;', 'retz'],
      ['return f->qtd;', 'ret'],
    ],
    destruir: [
      ['void destruir(Fila f){', 'sig'],
      ['if(f != NULL)', 'ifp'],
      ['free(f);', 'freedesc'],
    ],
  },
};

// lista sequencial: não existe no repositório (Lista/ só tem versões encadeadas) -> TODA autoral
STRUCTURES.listVet = {
  path: null,
  structs: [{ key: 'desc', start: /^typedef struct lista\s*\{/, end: END_PTR }],
  functions: {},
  authored: { file: `${AUTORAL}/lista_vetor.c`, functions: {
    inserir_inicio: [
      ['int inserir_inicio(Lista li, int valor){', 'sig'],
      ['if(li == NULL || li->qtd == MAX)', 'ifguard'],
      ['return 1;', 'retguard'],
      ['int i = li->qtd;', 'icount'],
      ['while(i > 0){', 'while'],
      ['li->dados[i] = li->dados[i - 1];', 'shift'],
      ['i--;', 'dec'],
      ['li->dados[0] = valor;', 'setdado'],
      ['li->qtd++;', 'qtdinc'],
      ['return 0;', 'ret0'],
    ],
    inserir_final: [
      ['int inserir_final(Lista li, int valor){', 'sig'],
      ['if(li == NULL || li->qtd == MAX)', 'ifguard'],
      ['return 1;', 'retguard'],
      ['li->dados[li->qtd] = valor;', 'setdado'],
      ['li->qtd++;', 'qtdinc'],
      ['return 0;', 'ret0'],
    ],
    remover_inicio: [
      ['int remover_inicio(Lista li){', 'sig'],
      ['if(li == NULL || li->qtd == 0)', 'ifguard'],
      ['return 1;', 'retguard'],
      ['int i = 0;', 'icount'],
      ['while(i < li->qtd - 1){', 'while'],
      ['li->dados[i] = li->dados[i + 1];', 'shift'],
      ['i++;', 'inc'],
      ['li->qtd--;', 'qtddec'],
      ['return 0;', 'ret0'],
    ],
    remover_final: [
      ['int remover_final(Lista li){', 'sig'],
      ['if(li == NULL || li->qtd == 0)', 'ifguard'],
      ['return 1;', 'retguard'],
      ['li->qtd--;', 'qtddec'],
      ['return 0;', 'ret0'],
    ],
    tamanho_lista: [
      ['int tamanho_lista(Lista li){', 'sig'],
      ['if(li == NULL)', 'ifp'],
      ['return 0;', 'retz'],
      ['return li->qtd;', 'ret'],
    ],
    busca_valor: buscaVetor('Lista', 'li', 'if(li == NULL || li->qtd == 0)', 'int i = 0;', 'while(i < li->qtd){', 'if(li->dados[i] == valor){', 'i++;'),
    remove_valor: [
      ['int remove_valor(Lista li, int valor){', 'sig'],
      ['if(li == NULL || li->qtd == 0)', 'ifguard'],
      ['return 1;', 'retguard'],
      ['int i = 0;', 'icount'],
      ['while(i < li->qtd && li->dados[i] != valor)', 'while'],
      ['i++;', 'inc'],
      ['if(i == li->qtd)', 'ifnao'],
      ['return 1;', 'retnao'],
      ['while(i < li->qtd - 1){', 'while2'],
      ['li->dados[i] = li->dados[i + 1];', 'shift'],
      ['i++;', 'inc2'],
      ['li->qtd--;', 'qtddec'],
      ['return 0;', 'ret0'],
    ],
    destruir: [
      ['void destruir(Lista li){', 'sig'],
      ['if(li != NULL)', 'ifp'],
      ['free(li);', 'freedesc'],
    ],
  } },
};



// ---------- tabelas hash de CHAR com endereçamento aberto — AUTORAIS (chaveDivisao é do repositório; helpers dos slides) ----------
const openCall = {
  SondagemLinear: 'sondagemLinear(pos, i, ha->TABLE_SIZE)',
  SondagemQuadratica: 'sondagemQuadratica(pos, i, ha->TABLE_SIZE)',
  DuploHash: 'duploHash(pos, valor, i, ha->TABLE_SIZE)',
};
const openHelper = {
  SondagemLinear: { sondagemLinear: [
    ['int sondagemLinear(int pos, int i, int TABLE_SIZE) {', 'sig'],
    ['return (pos + i) % TABLE_SIZE;', 'ret'],
  ] },
  SondagemQuadratica: { sondagemQuadratica: [
    ['int sondagemQuadratica(int pos, int i, int TABLE_SIZE) {', 'sig'],
    ['pos = pos + 2*i + 5*i*i;', 'calc'],
    ['return pos % TABLE_SIZE;', 'ret'],
  ] },
  DuploHash: { duploHash: [
    ['int duploHash(int H1, int chave, int i, int TABLE_SIZE) {', 'sig'],
    ['int H2 = chaveDivisao(chave, TABLE_SIZE-1) + 1;', 'h2'],
    ['return (H1 + i*H2) % TABLE_SIZE;', 'ret'],
  ] },
};
const openSpec = (suf) => {
  const head = [
    ['int pos = chaveDivisao(valor, ha->TABLE_SIZE);', 'pos'],
  ];
  const loop = [
    ['for (int i = 0; i < ha->TABLE_SIZE; i++) {', 'for'],
    [`int novaPos = ${openCall[suf]};`, 'novapos'],
  ];
  const findLoop = (fim) => [
    ['if (ha->itens[novaPos] == VAZIO)', 'ifvazio'],
    ['return 0;', 'retvazio'],
    ['if (ha->itens[novaPos] == valor) {', 'ifach'],
    ...fim,
    ['return 0;', 'retfim'],
  ];
  return {
    [`insereHash_${suf}`]: [
      [`int insereHash_${suf}(Hash *ha, int valor) {`, 'sig'],
      ['if (ha == NULL || ha->qtd == ha->TABLE_SIZE)', 'ifguard'],
      ['return 0;', 'retguard'],
      ...head,
      ['int livre = -1;', 'livreinit'],
      ...loop,
      ['if (ha->itens[novaPos] == VAZIO || ha->itens[novaPos] == REMOVIDO) {', 'ifslot'],
      ['if (livre == -1)', 'iflivre'],
      ['livre = novaPos;', 'setlivre'],
      ['if (ha->itens[novaPos] == VAZIO)', 'ifbreak'],
      ['break;', 'brk'],
      ['} else if (ha->itens[novaPos] == valor)', 'ifdup'],
      ['return 0;', 'retdup'],
      ['if (livre == -1)', 'ifsem'],
      ['return 0;', 'retsem'],
      ['ha->itens[livre] = valor;', 'setitem'],
      ['ha->qtd++;', 'qtdinc'],
      ['return 1;', 'ret1'],
    ],
    [`buscaHash_${suf}`]: [
      [`int buscaHash_${suf}(Hash *ha, int valor, int *out) {`, 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ...head, ...loop,
      ...findLoop([['*out = novaPos;', 'setout'], ['return 1;', 'ret1']]),
    ],
    [`removeHash_${suf}`]: [
      [`int removeHash_${suf}(Hash *ha, int valor) {`, 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ...head, ...loop,
      ...findLoop([['ha->itens[novaPos] = REMOVIDO;', 'setrem'], ['ha->qtd--;', 'qtddec'], ['return 1;', 'ret1']]),
    ],
  };
};
const commonOpen = {
  criaHash: [
    ['Hash* criaHash(int TABLE_SIZE) {', 'sig'],
    ['Hash *ha = malloc(sizeof(Hash));', 'mallocha'],
    ['if (ha != NULL) {', 'ifha'],
    ['ha->TABLE_SIZE = TABLE_SIZE;', 'settable'],
    ['ha->qtd = 0;', 'setqtd'],
    ['ha->itens = malloc(TABLE_SIZE * sizeof(int));', 'mallocitens'],
    ['if (ha->itens == NULL) {', 'ifitens'],
    ['free(ha);', 'freefail'],
    ['return NULL;', 'retnull'],
    ['for (int i = 0; i < TABLE_SIZE; i++) {', 'for'],
    ['ha->itens[i] = VAZIO;', 'setvazio'],
    ['return ha;', 'ret'],
  ],
  liberaHash: [
    ['void liberaHash(Hash *ha) {', 'sig'],
    ['if (ha == NULL)', 'ifnull'],
    ['return;', 'retnull'],
    ['free(ha->itens);', 'freeitens'],
    ['free(ha);', 'freeha'],
  ],
};
const commonOpenChar = {
  ...commonOpen,
  criaHash: commonOpen.criaHash.map(([t, id]) => [t.replace('sizeof(int)', 'sizeof(char)'), id]),
};
const openDef = (file, suf) => ({
  path: `${BASE}/Tabela-hash/1_tabela_hash.c`,
  structsFromAuthored: true,
  structs: [{ key: 'desc', start: /^#define VAZIO/, end: /^}\s*Hash;/ }],
  functions: {
    chaveDivisao: [
      ['int chaveDivisao(int chave, int TABLE_SIZE) {', 'sig'],
      ['return (chave & 0x7FFFFFFF) % TABLE_SIZE;', 'ret'],
    ],
  },
  authored: { file: `${AUTORAL}/${file}`, functions: { ...commonOpen, ...openHelper[suf], ...openSpec(suf) } },
});
STRUCTURES.hashLinear = openDef('hash_linear.c', 'SondagemLinear');
STRUCTURES.hashQuad = openDef('hash_quadratica.c', 'SondagemQuadratica');
STRUCTURES.hashDuplo = openDef('hash_duplo.c', 'DuploHash');

// ---------- hash SEM colisão com vetor de char — AUTORAL (chaveDivisao é do repositório) ----------
STRUCTURES.hashChar = {
  path: `${BASE}/Tabela-hash/1_tabela_hash.c`,
  structsFromAuthored: true,
  structs: [{ key: 'desc', start: /^#define VAZIO/, end: /^}\s*Hash;/ }],
  functions: {
    chaveDivisao: [
      ['int chaveDivisao(int chave, int TABLE_SIZE) {', 'sig'],
      ['return (chave & 0x7FFFFFFF) % TABLE_SIZE;', 'ret'],
    ],
  },
  authored: { file: `${AUTORAL}/hash_char.c`, functions: {
    ...commonOpenChar,
    insereHash_SemColisao_Rejeita: [
      ['int insereHash_SemColisao_Rejeita(Hash *ha, char c) {', 'sig'],
      ['if (ha == NULL || ha->qtd == ha->TABLE_SIZE)', 'ifguard'],
      ['return 0;', 'retguard'],
      ['int pos = chaveDivisao(c, ha->TABLE_SIZE);', 'pos'],
      ['if (ha->itens[pos] != VAZIO)', 'ifcol'],
      ['return 0;', 'retcol'],
      ['ha->itens[pos] = c;', 'setitem'],
      ['ha->qtd++;', 'qtdinc'],
      ['return 1;', 'ret1'],
    ],
    insereHash_SemColisao_Sobrescreve: [
      ['int insereHash_SemColisao_Sobrescreve(Hash *ha, char c) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(c, ha->TABLE_SIZE);', 'pos'],
      ['if (ha->itens[pos] == VAZIO)', 'ifvazio'],
      ['ha->qtd++;', 'qtdinc'],
      ['ha->itens[pos] = c;', 'setitem'],
      ['return 1;', 'ret1'],
    ],
    buscaHash_SemColisao: [
      ['int buscaHash_SemColisao(Hash *ha, char c, char *out) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(c, ha->TABLE_SIZE);', 'pos'],
      ['if (ha->itens[pos] != c)', 'ifdiff'],
      ['return 0;', 'retdiff'],
      ['*out = ha->itens[pos];', 'setout'],
      ['return 1;', 'ret1'],
    ],
    removeHash_SemColisao: [
      ['int removeHash_SemColisao(Hash *ha, char c) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(c, ha->TABLE_SIZE);', 'pos'],
      ['if (ha->itens[pos] != c)', 'ifdiff'],
      ['return 0;', 'retdiff'],
      ['ha->itens[pos] = VAZIO;', 'setvazio'],
      ['ha->qtd--;', 'qtddec'],
      ['return 1;', 'ret1'],
    ],
  } },
};

STRUCTURES.hashChain = {
  path: `${BASE}/Tabela-hash/1_tabela_hash.c`,
  structsFromAuthored: true,
  structs: [
    { key: 'elemento', start: /^typedef struct no\s*\{/, end: /^}\s*No;/ },
    { key: 'desc', start: /^typedef struct hash\s*\{/, end: /^}\s*Hash;/ },
  ],
  functions: {
    chaveDivisao: [
      ['int chaveDivisao(int chave, int TABLE_SIZE) {', 'sig'],
      ['return (chave & 0x7FFFFFFF) % TABLE_SIZE;', 'ret'],
    ],
  },
  authored: { file: `${AUTORAL}/hash_encadeada.c`, functions: {
    criaHash: [
      ['Hash* criaHash(int TABLE_SIZE) {', 'sig'],
      ['Hash *ha = malloc(sizeof(Hash));', 'mallocha'],
      ['if (ha != NULL) {', 'ifha'],
      ['ha->TABLE_SIZE = TABLE_SIZE;', 'settable'],
      ['ha->qtd = 0;', 'setqtd'],
      ['ha->itens = malloc(TABLE_SIZE * sizeof(No*));', 'mallocitens'],
      ['if (ha->itens == NULL) {', 'ifitens'],
      ['free(ha);', 'freefail'],
      ['return NULL;', 'retnull'],
      ['for (int i = 0; i < TABLE_SIZE; i++) {', 'for'],
      ['ha->itens[i] = NULL;', 'setnull'],
      ['return ha;', 'ret'],
    ],
    liberaHash: [
      ['void liberaHash(Hash *ha) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return;', 'retnull'],
      ['for (int i = 0; i < ha->TABLE_SIZE; i++) {', 'for'],
      ['No *aux = ha->itens[i];', 'auxinit'],
      ['while (aux != NULL) {', 'while'],
      ['No *prox = aux->prox;', 'proxinit'],
      ['free(aux);', 'freeno'],
      ['aux = prox;', 'avanca'],
      ['free(ha->itens);', 'freeitens'],
      ['free(ha);', 'freeha'],
    ],
    insereHash_Encadeada: [
      ['int insereHash_Encadeada(Hash *ha, int valor) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(valor, ha->TABLE_SIZE);', 'posinit'],
      ['No *aux = ha->itens[pos];', 'auxinit'],
      ['while (aux != NULL) {', 'while'],
      ['if (aux->valor == valor)', 'ifdup'],
      ['return 0;', 'retdup'],
      ['aux = aux->prox;', 'avanca'],
      ['No *novo = malloc(sizeof(No));', 'malloc'],
      ['if (novo == NULL)', 'ifnovo'],
      ['return 0;', 'retnovo'],
      ['novo->valor = valor;', 'setvalor'],
      ['novo->prox = ha->itens[pos];', 'setprox'],
      ['ha->itens[pos] = novo;', 'setslot'],
      ['ha->qtd++;', 'qtdinc'],
      ['return 1;', 'ret1'],
    ],
    buscaHash_Encadeada: [
      ['int buscaHash_Encadeada(Hash *ha, int valor, int *out) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(valor, ha->TABLE_SIZE);', 'posinit'],
      ['No *aux = ha->itens[pos];', 'auxinit'],
      ['while (aux != NULL) {', 'while'],
      ['if (aux->valor == valor) {', 'ifach'],
      ['*out = aux->valor;', 'setout'],
      ['return 1;', 'ret1'],
      ['aux = aux->prox;', 'avanca'],
      ['return 0;', 'retfim'],
    ],
    removeHash_Encadeada: [
      ['int removeHash_Encadeada(Hash *ha, int valor) {', 'sig'],
      ['if (ha == NULL)', 'ifnull'],
      ['return 0;', 'retnull'],
      ['int pos = chaveDivisao(valor, ha->TABLE_SIZE);', 'posinit'],
      ['No *ant = NULL;', 'antinit'],
      ['No *aux = ha->itens[pos];', 'auxinit'],
      ['while (aux != NULL && aux->valor != valor) {', 'while'],
      ['ant = aux;', 'setant'],
      ['aux = aux->prox;', 'avanca'],
      ['if (aux == NULL)', 'ifachou'],
      ['return 0;', 'retfim'],
      ['if (ant == NULL)', 'ifant'],
      ['ha->itens[pos] = aux->prox;', 'unlinkhead'],
      ['ant->prox = aux->prox;', 'unlinkmid'],
      ['free(aux);', 'free'],
      ['ha->qtd--;', 'qtddec'],
      ['return 1;', 'ret1'],
    ],
  } },
};

const q = (str) => "'" + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const fmtLine = (l) => `    { n: ${l.n}, ${'id' in l ? `id: ${l.id === null ? 'null' : q(l.id)}, ` : ''}text: ${q(l.text)} },`;
const fmtBlock = (lines) => `[\n${lines.map(fmtLine).join('\n')}\n  ]`;

mkdirSync(outDir, { recursive: true });

for (const [name, def] of Object.entries(STRUCTURES)) {
  const toLines = (text) => text.split('\n').map((t, i) => ({ n: i + 1, text: t.replace(/\s+$/, '') }));
  // estrutura toda autoral (def.path == null): as structs também vêm do arquivo autoral
  const raw = def.path ? toLines(readFileSync(join(repoRoot, def.path), 'utf8')) : toLines(readFileSync(def.authored.file, 'utf8'));

  const block = (startRe, endRe) => {
    const s = raw.findIndex((l) => startRe.test(l.text));
    const e = raw.findIndex((l, i) => i >= s && endRe.test(l.text));
    if (s < 0 || e < 0) throw new Error(`${name}: bloco não encontrado: ${startRe}`);
    return raw.slice(s, e + 1);
  };

  const extract = (rawLines, spec, fn, label) => {
    const find = (startRe, endRe) => {
      const a = rawLines.findIndex((l) => startRe.test(l.text));
      const b = rawLines.findIndex((l, i) => i >= a && endRe.test(l.text));
      if (a < 0 || b < 0) throw new Error(`${label}.${fn}: função não encontrada`);
      return rawLines.slice(a, b + 1);
    };
    const lines = find(new RegExp(`^\\w[\\w\\s*]*\\b${fn}\\(`), /^}$/);
    let j = 0;
    const out = lines.map((l) => {
      let id = null;
      if (j < spec.length && l.text.trim() === spec[j][0]) {
        id = spec[j][1];
        j += 1;
      }
      return { n: l.n, id, text: l.text };
    });
    if (j !== spec.length) throw new Error(`${label}.${fn}: só casou ${j}/${spec.length} linhas (esperava "${spec[j][0]}")`);
    return out;
  };
  const functions = {};
  for (const [fn, spec] of Object.entries(def.functions)) functions[fn] = extract(raw, spec, fn, name);
  const renamed = {};
  for (const [oldName, newName] of Object.entries(def.rename ?? {})) {
    functions[newName] = functions[oldName].map((l) => ({ ...l, text: l.text.replace(new RegExp(`\\b${oldName}\\(`), `${newName}(`) }));
    delete functions[oldName];
    renamed[newName] = oldName;
  }
  const authored = {};
  if (def.authored) {
    const araw = readFileSync(def.authored.file, 'utf8').split('\n').map((t, i) => ({ n: i + 1, text: t.replace(/\s+$/, '') }));
    for (const [fn, spec] of Object.entries(def.authored.functions)) {
      functions[fn] = extract(araw, spec, fn, `${name}(autoral)`);
      authored[fn] = def.authored.file;
    }
  }

  const strip = (arr) => arr.map(({ n, text }) => ({ n, text }));
  const structDefs = def.structs ?? [
    { key: 'elemento', start: /^typedef struct elemento\s*\{/, end: END_ELEM },
    { key: 'desc', start: def.descStart, end: END_DESC },
  ];
  const authoredRaw = def.authored ? toLines(readFileSync(def.authored.file, 'utf8')) : null;
  const blockIn = (lines, startRe, endRe) => {
    const a = lines.findIndex((l) => startRe.test(l.text));
    const b = lines.findIndex((l, i) => i >= a && endRe.test(l.text));
    if (a < 0 || b < 0) throw new Error(`${name}: bloco não encontrado: ${startRe}`);
    return lines.slice(a, b + 1);
  };
  const structs = Object.fromEntries(
    structDefs.map((sd) => [sd.key, strip(def.structsFromAuthored ? blockIn(authoredRaw, sd.start, sd.end) : block(sd.start, sd.end))]),
  );

  const file = (def.path ?? def.authored.file).split('/').pop();
  const js = `// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um \`id\` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: ${def.path ? "'PauloHARocha/EDL-2026-1'" : 'null'},
  commit: ${def.path ? `'${commit}'` : 'null'},
  path: '${def.path ?? def.authored.file}',
  file: '${file}',
};

export const STRUCTS = {
${Object.entries(structs).map(([k, v]) => `  ${k}: ${fmtBlock(v)},`).join('\n')}
};

// funções que NÃO vêm do repositório do professor (escritas pelo EDvisu; arquivo-fonte em tools/autoral)
export const AUTHORED = ${JSON.stringify(authored)};

// funções do repositório cujo NOME foi trocado no EDvisu: { nome usado aqui: nome original }
export const RENAMED = ${JSON.stringify(renamed)};

export const FUNCTIONS = {
${Object.entries(functions).map(([fn, lines]) => `  ${fn}: ${fmtBlock(lines)},`).join('\n')}
};
`;
  writeFileSync(join(outDir, `${name}.js`), js);
  console.log(`${name}: ${Object.entries(functions).map(([k, v]) => `${k}(${v.length} linhas, ${v.filter((l) => l.id).length} ids)`).join(', ')}`);
}
