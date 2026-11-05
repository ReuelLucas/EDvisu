// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Lista li, int valor, int* pos){
    if(li == NULL || li->final == NULL)
        return 1;
    Elem* aux = li->final->prox;
    int i = 0;
    while(i < li->qtd){
        if(aux->valor == valor){
            *pos = i;
            return 0;
        }
        aux = aux->prox;
        i++;
    }
    return 1;
}

int remove_valor(Lista li, int valor){
    if(li == NULL || li->final == NULL)
        return 1;
    Elem* ant = li->final;
    Elem* aux = ant->prox;
    int i = 0;
    while(i < li->qtd && aux->valor != valor){
        ant = aux;
        aux = aux->prox;
        i++;
    }
    if(i == li->qtd)
        return 1;
    if(li->qtd == 1){
        li->final = NULL;
    }else{
        ant->prox = aux->prox;
        if(aux == li->final)
            li->final = ant;
    }
    free(aux);
    li->qtd--;
    return 0;
}

void destruir(Lista li){
    if(li != NULL){
        if(li->final != NULL){
            Elem* no = li->final->prox;
            li->final->prox = NULL;
            while(no != NULL){
                Elem* prox = no->prox;
                free(no);
                no = prox;
            }
        }
        free(li);
    }
}
