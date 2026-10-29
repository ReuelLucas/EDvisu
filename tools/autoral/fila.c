// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Fila f, int valor, int* pos){
    if(f == NULL || f->inicio == NULL)
        return 1;
    Elem* aux = f->inicio;
    int i = 0;
    while(aux != NULL){
        if(aux->valor == valor){
            *pos = i;
            return 0;
        }
        aux = aux->prox;
        i++;
    }
    return 1;
}

int remove_valor(Fila f, int valor){
    if(f == NULL || f->inicio == NULL)
        return 1;
    Elem* aux = f->inicio;
    Elem* ant = NULL;
    while(aux != NULL && aux->valor != valor){
        ant = aux;
        aux = aux->prox;
    }
    if(aux == NULL)
        return 1;
    if(ant == NULL)
        f->inicio = aux->prox;
    else
        ant->prox = aux->prox;
    if(aux == f->final)
        f->final = ant;
    free(aux);
    f->qtd--;
    return 0;
}

void destruir(Fila f){
    if(f != NULL){
        Elem* aux = f->inicio;
        while(aux != NULL){
            Elem* prox = aux->prox;
            free(aux);
            aux = prox;
        }
        free(f);
    }
}
