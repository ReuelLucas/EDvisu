// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Lista li, int valor, int* pos){
    if(li == NULL || li->inicio == NULL)
        return 1;
    Elem* aux = li->inicio;
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

int remove_valor(Lista li, int valor){
    if(li == NULL || li->inicio == NULL)
        return 1;
    Elem* aux = li->inicio;
    while(aux != NULL && aux->valor != valor)
        aux = aux->prox;
    if(aux == NULL)
        return 1;
    if(aux->ant == NULL)
        li->inicio = aux->prox;
    else
        aux->ant->prox = aux->prox;
    if(aux->prox == NULL)
        li->final = aux->ant;
    else
        aux->prox->ant = aux->ant;
    free(aux);
    li->qtd--;
    return 0;
}
