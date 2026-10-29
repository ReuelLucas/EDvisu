// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: null,
  commit: null,
  path: 'tools/autoral/lista_vetor.c',
  file: 'lista_vetor.c',
};

export const STRUCTS = {
  desc: [
    { n: 7, text: 'typedef struct lista {' },
    { n: 8, text: '    int dados[MAX];' },
    { n: 9, text: '    int qtd;' },
    { n: 10, text: '} *Lista;' },
  ],
};

// funções que NÃO vêm do repositório do professor (escritas pelo EDvisu; arquivo-fonte em tools/autoral)
export const AUTHORED = {"inserir_inicio":"tools/autoral/lista_vetor.c","inserir_final":"tools/autoral/lista_vetor.c","remover_inicio":"tools/autoral/lista_vetor.c","remover_final":"tools/autoral/lista_vetor.c","tamanho_lista":"tools/autoral/lista_vetor.c","busca_valor":"tools/autoral/lista_vetor.c","remove_valor":"tools/autoral/lista_vetor.c","destruir":"tools/autoral/lista_vetor.c"};

export const FUNCTIONS = {
  inserir_inicio: [
    { n: 12, id: 'sig', text: 'int inserir_inicio(Lista li, int valor){' },
    { n: 13, id: 'ifguard', text: '    if(li == NULL || li->qtd == MAX)' },
    { n: 14, id: 'retguard', text: '        return 1;' },
    { n: 15, id: 'icount', text: '    int i = li->qtd;' },
    { n: 16, id: 'while', text: '    while(i > 0){' },
    { n: 17, id: 'shift', text: '        li->dados[i] = li->dados[i - 1];' },
    { n: 18, id: 'dec', text: '        i--;' },
    { n: 19, id: null, text: '    }' },
    { n: 20, id: 'setdado', text: '    li->dados[0] = valor;' },
    { n: 21, id: 'qtdinc', text: '    li->qtd++;' },
    { n: 22, id: 'ret0', text: '    return 0;' },
    { n: 23, id: null, text: '}' },
  ],
  inserir_final: [
    { n: 25, id: 'sig', text: 'int inserir_final(Lista li, int valor){' },
    { n: 26, id: 'ifguard', text: '    if(li == NULL || li->qtd == MAX)' },
    { n: 27, id: 'retguard', text: '        return 1;' },
    { n: 28, id: 'setdado', text: '    li->dados[li->qtd] = valor;' },
    { n: 29, id: 'qtdinc', text: '    li->qtd++;' },
    { n: 30, id: 'ret0', text: '    return 0;' },
    { n: 31, id: null, text: '}' },
  ],
  remover_inicio: [
    { n: 33, id: 'sig', text: 'int remover_inicio(Lista li){' },
    { n: 34, id: 'ifguard', text: '    if(li == NULL || li->qtd == 0)' },
    { n: 35, id: 'retguard', text: '        return 1;' },
    { n: 36, id: 'icount', text: '    int i = 0;' },
    { n: 37, id: 'while', text: '    while(i < li->qtd - 1){' },
    { n: 38, id: 'shift', text: '        li->dados[i] = li->dados[i + 1];' },
    { n: 39, id: 'inc', text: '        i++;' },
    { n: 40, id: null, text: '    }' },
    { n: 41, id: 'qtddec', text: '    li->qtd--;' },
    { n: 42, id: 'ret0', text: '    return 0;' },
    { n: 43, id: null, text: '}' },
  ],
  remover_final: [
    { n: 45, id: 'sig', text: 'int remover_final(Lista li){' },
    { n: 46, id: 'ifguard', text: '    if(li == NULL || li->qtd == 0)' },
    { n: 47, id: 'retguard', text: '        return 1;' },
    { n: 48, id: 'qtddec', text: '    li->qtd--;' },
    { n: 49, id: 'ret0', text: '    return 0;' },
    { n: 50, id: null, text: '}' },
  ],
  tamanho_lista: [
    { n: 52, id: 'sig', text: 'int tamanho_lista(Lista li){' },
    { n: 53, id: 'ifp', text: '    if(li == NULL)' },
    { n: 54, id: 'retz', text: '        return 0;' },
    { n: 55, id: 'ret', text: '    return li->qtd;' },
    { n: 56, id: null, text: '}' },
  ],
  busca_valor: [
    { n: 58, id: 'sig', text: 'int busca_valor(Lista li, int valor, int* pos){' },
    { n: 59, id: 'ifguard', text: '    if(li == NULL || li->qtd == 0)' },
    { n: 60, id: 'retguard', text: '        return 1;' },
    { n: 61, id: 'icount', text: '    int i = 0;' },
    { n: 62, id: 'while', text: '    while(i < li->qtd){' },
    { n: 63, id: 'ifigual', text: '        if(li->dados[i] == valor){' },
    { n: 64, id: 'setpos', text: '            *pos = i;' },
    { n: 65, id: 'ret0', text: '            return 0;' },
    { n: 66, id: null, text: '        }' },
    { n: 67, id: 'inc', text: '        i++;' },
    { n: 68, id: null, text: '    }' },
    { n: 69, id: 'retnao', text: '    return 1;' },
    { n: 70, id: null, text: '}' },
  ],
  remove_valor: [
    { n: 72, id: 'sig', text: 'int remove_valor(Lista li, int valor){' },
    { n: 73, id: 'ifguard', text: '    if(li == NULL || li->qtd == 0)' },
    { n: 74, id: 'retguard', text: '        return 1;' },
    { n: 75, id: 'icount', text: '    int i = 0;' },
    { n: 76, id: 'while', text: '    while(i < li->qtd && li->dados[i] != valor)' },
    { n: 77, id: 'inc', text: '        i++;' },
    { n: 78, id: 'ifnao', text: '    if(i == li->qtd)' },
    { n: 79, id: 'retnao', text: '        return 1;' },
    { n: 80, id: 'while2', text: '    while(i < li->qtd - 1){' },
    { n: 81, id: 'shift', text: '        li->dados[i] = li->dados[i + 1];' },
    { n: 82, id: 'inc2', text: '        i++;' },
    { n: 83, id: null, text: '    }' },
    { n: 84, id: 'qtddec', text: '    li->qtd--;' },
    { n: 85, id: 'ret0', text: '    return 0;' },
    { n: 86, id: null, text: '}' },
  ],
  destruir: [
    { n: 88, id: 'sig', text: 'void destruir(Lista li){' },
    { n: 89, id: 'ifp', text: '    if(li != NULL)' },
    { n: 90, id: 'freedesc', text: '        free(li);' },
    { n: 91, id: null, text: '}' },
  ],
};
