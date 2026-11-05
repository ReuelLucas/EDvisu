// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

#define MAX 6

typedef struct lista {
    int dados[MAX];
    int qtd;
} *Lista;

int inserir_inicio(Lista li, int valor){
    if(li == NULL || li->qtd == MAX)
        return 1;
    int i = li->qtd;
    while(i > 0){
        li->dados[i] = li->dados[i - 1];
        i--;
    }
    li->dados[0] = valor;
    li->qtd++;
    return 0;
}

int inserir_final(Lista li, int valor){
    if(li == NULL || li->qtd == MAX)
        return 1;
    li->dados[li->qtd] = valor;
    li->qtd++;
    return 0;
}

int remover_inicio(Lista li){
    if(li == NULL || li->qtd == 0)
        return 1;
    int i = 0;
    while(i < li->qtd - 1){
        li->dados[i] = li->dados[i + 1];
        i++;
    }
    li->qtd--;
    return 0;
}

int remover_final(Lista li){
    if(li == NULL || li->qtd == 0)
        return 1;
    li->qtd--;
    return 0;
}

int tamanho_lista(Lista li){
    if(li == NULL)
        return 0;
    return li->qtd;
}

int busca_valor(Lista li, int valor, int* pos){
    if(li == NULL || li->qtd == 0)
        return 1;
    int i = 0;
    while(i < li->qtd){
        if(li->dados[i] == valor){
            *pos = i;
            return 0;
        }
        i++;
    }
    return 1;
}

int remove_valor(Lista li, int valor){
    if(li == NULL || li->qtd == 0)
        return 1;
    int i = 0;
    while(i < li->qtd && li->dados[i] != valor)
        i++;
    if(i == li->qtd)
        return 1;
    while(i < li->qtd - 1){
        li->dados[i] = li->dados[i + 1];
        i++;
    }
    li->qtd--;
    return 0;
}

void destruir(Lista li){
    if(li != NULL)
        free(li);
}
