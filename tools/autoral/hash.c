// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int removeHash_SemColisao(Hash *ha, int chave) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(chave, ha->TABLE_SIZE);
    if (ha->itens[pos] == NULL)
        return 0;
    if (*(ha->itens[pos]) != chave)
        return 0;

    free(ha->itens[pos]);
    ha->itens[pos] = NULL;
    ha->qtd--;
    return 1;
}
