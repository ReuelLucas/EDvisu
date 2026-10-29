// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Fila/Fila-estatica/fila_int.c',
  file: 'fila_int.c',
};

export const STRUCTS = {
  desc: [
    { n: 6, text: 'struct fila {' },
    { n: 7, text: '    int dados[MAX];' },
    { n: 8, text: '    int inicio, final, qtd;' },
    { n: 9, text: '};' },
  ],
};

// funções que NÃO vêm do repositório do professor (escritas pelo EDvisu; arquivo-fonte em tools/autoral)
export const AUTHORED = {"busca_valor":"tools/autoral/fila_vetor.c","remove_valor":"tools/autoral/fila_vetor.c"};

export const FUNCTIONS = {
  inserir: [
    { n: 25, id: 'sig', text: 'int inserir(Fila f, int valor){' },
    { n: 26, id: 'ifok', text: '    if(f->qtd < MAX && f != NULL){' },
    { n: 27, id: 'setdado', text: '        f->dados[f->final] = valor;' },
    { n: 28, id: 'setfinal', text: '        f->final = (f->final + 1) % MAX;' },
    { n: 29, id: 'qtdinc', text: '        f->qtd++;' },
    { n: 30, id: 'ret0', text: '        return 0;' },
    { n: 31, id: null, text: '    }else{' },
    { n: 32, id: 'ret1', text: '        return 1;' },
    { n: 33, id: null, text: '    }' },
    { n: 34, id: null, text: '}' },
  ],
  remover: [
    { n: 36, id: 'sig', text: 'int remover(Fila f){' },
    { n: 37, id: 'ifvazia', text: '    if(f->qtd == 0 || f == NULL){' },
    { n: 38, id: 'ret1', text: '        return 1;' },
    { n: 39, id: null, text: '    }else{' },
    { n: 40, id: 'setinicio', text: '        f->inicio = (f->inicio + 1) % MAX;' },
    { n: 41, id: 'qtddec', text: '        f->qtd--;' },
    { n: 42, id: 'ret0', text: '        return 0;' },
    { n: 43, id: null, text: '    }' },
    { n: 44, id: null, text: '}' },
  ],
  acessar: [
    { n: 46, id: 'sig', text: 'int acessar(Fila f, int* valor){' },
    { n: 47, id: 'ifvazia', text: '    if(f->qtd == 0 || f == NULL){' },
    { n: 48, id: 'ret1', text: '        return 1;' },
    { n: 49, id: null, text: '    }else{' },
    { n: 50, id: 'setout', text: '        *valor = f->dados[f->inicio];' },
    { n: 51, id: 'ret0', text: '        return 0;' },
    { n: 52, id: null, text: '    }' },
    { n: 53, id: null, text: '}' },
  ],
  tamanho: [
    { n: 55, id: 'sig', text: 'int tamanho(Fila f){' },
    { n: 56, id: 'ifp', text: '    if(f == NULL){' },
    { n: 57, id: 'retz', text: '        return 0;' },
    { n: 58, id: null, text: '    }' },
    { n: 59, id: 'ret', text: '    return f->qtd;' },
    { n: 60, id: null, text: '}' },
  ],
  destruir: [
    { n: 62, id: 'sig', text: 'void destruir(Fila f){' },
    { n: 63, id: 'ifp', text: '    if(f != NULL)' },
    { n: 64, id: 'freedesc', text: '        free(f);' },
    { n: 65, id: null, text: '}' },
  ],
  busca_valor: [
    { n: 5, id: 'sig', text: 'int busca_valor(Fila f, int valor, int* pos){' },
    { n: 6, id: 'ifguard', text: '    if(f == NULL || f->qtd == 0)' },
    { n: 7, id: 'retguard', text: '        return 1;' },
    { n: 8, id: 'icount', text: '    int i = 0;' },
    { n: 9, id: 'while', text: '    while(i < f->qtd){' },
    { n: 10, id: 'ifigual', text: '        if(f->dados[(f->inicio + i) % MAX] == valor){' },
    { n: 11, id: 'setpos', text: '            *pos = i;' },
    { n: 12, id: 'ret0', text: '            return 0;' },
    { n: 13, id: null, text: '        }' },
    { n: 14, id: 'inc', text: '        i++;' },
    { n: 15, id: null, text: '    }' },
    { n: 16, id: 'retnao', text: '    return 1;' },
    { n: 17, id: null, text: '}' },
  ],
  remove_valor: [
    { n: 19, id: 'sig', text: 'int remove_valor(Fila f, int valor){' },
    { n: 20, id: 'ifguard', text: '    if(f == NULL || f->qtd == 0)' },
    { n: 21, id: 'retguard', text: '        return 1;' },
    { n: 22, id: 'icount', text: '    int i = 0;' },
    { n: 23, id: 'while', text: '    while(i < f->qtd && f->dados[(f->inicio + i) % MAX] != valor)' },
    { n: 24, id: 'inc', text: '        i++;' },
    { n: 25, id: 'ifnao', text: '    if(i == f->qtd)' },
    { n: 26, id: 'retnao', text: '        return 1;' },
    { n: 27, id: 'while2', text: '    while(i < f->qtd - 1){' },
    { n: 28, id: 'shift', text: '        f->dados[(f->inicio + i) % MAX] = f->dados[(f->inicio + i + 1) % MAX];' },
    { n: 29, id: 'inc2', text: '        i++;' },
    { n: 30, id: null, text: '    }' },
    { n: 31, id: 'setfinal', text: '    f->final = (f->final - 1 + MAX) % MAX;' },
    { n: 32, id: 'qtddec', text: '    f->qtd--;' },
    { n: 33, id: 'ret0', text: '    return 0;' },
    { n: 34, id: null, text: '}' },
  ],
};
