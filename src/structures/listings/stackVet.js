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
export const AUTHORED = {"busca_valor":"tools/autoral/pilha_vetor.c","remove_valor":"tools/autoral/pilha_vetor.c"};

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
  busca_valor: [
    { n: 5, id: 'sig', text: 'int busca_valor(Pilha p, int valor, int* pos){' },
    { n: 6, id: 'ifguard', text: '    if(p == NULL || p->topo == 0)' },
    { n: 7, id: 'retguard', text: '        return 1;' },
    { n: 8, id: 'icount', text: '    int i = p->topo - 1;' },
    { n: 9, id: 'while', text: '    while(i >= 0){' },
    { n: 10, id: 'ifigual', text: '        if(p->dados[i] == valor){' },
    { n: 11, id: 'setpos', text: '            *pos = i;' },
    { n: 12, id: 'ret0', text: '            return 0;' },
    { n: 13, id: null, text: '        }' },
    { n: 14, id: 'inc', text: '        i--;' },
    { n: 15, id: null, text: '    }' },
    { n: 16, id: 'retnao', text: '    return 1;' },
    { n: 17, id: null, text: '}' },
  ],
  remove_valor: [
    { n: 19, id: 'sig', text: 'int remove_valor(Pilha p, int valor){' },
    { n: 20, id: 'ifguard', text: '    if(p == NULL || p->topo == 0)' },
    { n: 21, id: 'retguard', text: '        return 1;' },
    { n: 22, id: 'icount', text: '    int i = p->topo - 1;' },
    { n: 23, id: 'while', text: '    while(i >= 0 && p->dados[i] != valor)' },
    { n: 24, id: 'dec', text: '        i--;' },
    { n: 25, id: 'ifnao', text: '    if(i < 0)' },
    { n: 26, id: 'retnao', text: '        return 1;' },
    { n: 27, id: 'while2', text: '    while(i < p->topo - 1){' },
    { n: 28, id: 'shift', text: '        p->dados[i] = p->dados[i + 1];' },
    { n: 29, id: 'inc', text: '        i++;' },
    { n: 30, id: null, text: '    }' },
    { n: 31, id: 'topodec', text: '    p->topo--;' },
    { n: 32, id: 'ret0', text: '    return 0;' },
    { n: 33, id: null, text: '}' },
  ],
};
