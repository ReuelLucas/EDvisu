// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Pilha/Estatica/pilha_int.c',
  file: 'pilha_int.c',
};

export const STRUCTS = {
  desc: [
    { n: 5, text: 'typedef struct pilha {' },
    { n: 6, text: '    int dados[MAX];' },
    { n: 7, text: '    int topo;' },
    { n: 8, text: '} *Pilha;' },
  ],
};

// funções que NÃO vêm do repositório do professor (escritas pelo EDvisu; arquivo-fonte em tools/autoral)
export const AUTHORED = {};

// funções do repositório cujo NOME foi trocado no EDvisu: { nome usado aqui: nome original }
export const RENAMED = {};

export const FUNCTIONS = {
  push: [
    { n: 17, id: 'sig', text: 'int push(Pilha p, int matricula){' },
    { n: 18, id: 'ifok', text: '    if(p->topo < MAX && p != NULL){' },
    { n: 19, id: 'setdado', text: '        p->dados[p->topo] = matricula;' },
    { n: 20, id: 'topoinc', text: '        p->topo++;' },
    { n: 21, id: 'ret0', text: '        return 0;' },
    { n: 22, id: null, text: '    }else' },
    { n: 23, id: 'ret1', text: '        return 1;' },
    { n: 24, id: null, text: '}' },
  ],
  peek: [
    { n: 26, id: 'sig', text: 'int peek(Pilha p, int* matricula){' },
    { n: 27, id: 'ifvazia', text: '    if (p->topo == 0 || p == NULL)' },
    { n: 28, id: 'ret1', text: '        return 1;' },
    { n: 29, id: null, text: '    else' },
    { n: 30, id: 'setout', text: '        *matricula = p->dados[p->topo - 1];' },
    { n: 31, id: 'ret0', text: '        return 0;' },
    { n: 32, id: null, text: '}' },
  ],
  pop: [
    { n: 34, id: 'sig', text: 'int pop(Pilha p){' },
    { n: 35, id: 'ifvazia', text: '    if (p->topo == 0 || p == NULL)' },
    { n: 36, id: 'ret1', text: '        return 1;' },
    { n: 37, id: null, text: '    else' },
    { n: 38, id: 'topodec', text: '        p->topo--;' },
    { n: 39, id: 'ret0', text: '    return 0;' },
    { n: 40, id: null, text: '}' },
  ],
  tamanho_pilha: [
    { n: 42, id: 'sig', text: 'int tamanho_pilha(Pilha p){' },
    { n: 43, id: 'ifp', text: '    if(p == NULL)' },
    { n: 44, id: 'retz', text: '        return 0;' },
    { n: 45, id: 'ret', text: '    return p->topo;' },
    { n: 46, id: null, text: '}' },
  ],
  destruir_pilha: [
    { n: 48, id: 'sig', text: 'void destruir_pilha(Pilha p){' },
    { n: 49, id: 'ifp', text: '    if(p != NULL)' },
    { n: 50, id: 'freedesc', text: '        free(p);' },
    { n: 51, id: null, text: '}' },
  ],
};
