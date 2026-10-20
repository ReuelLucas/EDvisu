# EDvisu — Visualizador de Estruturas de Dados

Projeto acadêmico (UNICAP) que mostra, **passo a passo**, o que acontece na memória quando um código em C manipula uma estrutura de dados. A cada passo, a tela exibe o trecho de código em execução, as variáveis locais, os ponteiros e a estrutura desenhada como nós e setas.

![Passo free(aux) de remover_final](docs/screenshot.png)

## O que já funciona

Cinco estruturas, cada uma com o código C real da disciplina (`estruturas-de-dados/` do repositório do professor), escolhidas pelas abas no topo da tela:

| Estrutura | Funções com passo a passo |
|---|---|
| Lista simples | `inserir_inicio`, `inserir_final`, `remover_inicio`, `remover_final`, `tamanho_lista` |
| Lista dupla | as mesmas cinco, com `prox`, `ant`, `inicio` e `final` |
| Lista circular | `inserir_inicio`, `inserir_final` (as demais ainda são funções vazias no repositório) |
| Pilha dinâmica (desenhada na vertical, topo em cima) | `push`, `pop`, `peek`, `size` |
| Fila dinâmica | `enqueue`, `dequeue` |

Na tela:

- **Passo a passo nos dois sentidos:** Voltar/Avançar, slider, reprodução automática e setas ← → do teclado.
- **Painel de código:** a função inteira no topo da coluna lateral, com a linha em execução destacada e a rolagem acompanhando a execução. A numeração sempre começa em 1 dentro de cada função ou struct.
- **`free()` visível:** o nó liberado fica cinza e tracejado ("liberado") por um passo, e ponteiros que ainda apontam para ele aparecem como seta vermelha tracejada. No passo seguinte ele some.
- **Ponteiros auxiliares (`no`, `aux`, `ant`):** além da etiqueta colorida sobre o nó, a faixa acima do desenho mostra um pontinho quando o ponteiro é criado (anel verde), quando está declarado sem valor (pontinho vazado) e quando sai de escopo (cinza riscado, "removida").
- **Painel de variáveis expansível:** a seta ▸ de cada ponteiro abre a struct completa para onde ele aponta.
- **Painel Memória (heap) expansível:** lista todos os objetos alocados com todos os campos, destacando o que mudou.
- **Falha de segmentação:** `remover_inicio` da lista dupla trava no código original quando há um único nó (`li->inicio->ant` com `li->inicio == NULL`). O visualizador mostra o travamento em vez de esconder o erro.

> Os endereços mostrados (`0x6040`, etc.) são **ilustrativos**, gerados a partir do id do nó.

## Como rodar

Requisito: **Docker**, ou Node.js 20.19+ / 22.12+ instalado na máquina.

### Com Docker (não precisa instalar Node)

Na pasta do projeto:

```bash
# Windows (cmd)
docker run -it --rm -p 5173:5173 -v "%cd%":/app -w /app --entrypoint sh node:24-alpine

# Windows (PowerShell)
docker run -it --rm -p 5173:5173 -v "${PWD}:/app" -w /app --entrypoint sh node:24-alpine

# Linux / macOS
docker run -it --rm -p 5173:5173 -v "$(pwd)":/app -w /app --entrypoint sh node:24-alpine
```

Dentro do container:

```bash
npm install
npm run dev -- --host
```

Abra <http://localhost:5173>. O `--host` é necessário para o navegador acessar o servidor de dentro do container.

Para sair do container: `Ctrl+C` (para o servidor) e `exit`. Os arquivos ficam na sua pasta por causa do volume (`-v`).

### Sem Docker

```bash
npm install
npm run dev
```

### Observações

- **Atualização automática no Windows:** o `vite.config.ts` usa `server.watch.usePolling`, porque volumes do Docker no Windows não avisam o Vite quando um arquivo muda.
- **`node_modules` é da plataforma onde foi instalado:** o instalado dentro do container (Linux) não funciona no Node do Windows. Rode os comandos `npm` sempre no mesmo ambiente.
- **Build de produção:** `npm run build` gera a pasta `dist/`.

## Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript (`App.tsx`); os componentes do visualizador estão em JavaScript (`.jsx`)
- [React Flow](https://reactflow.dev/) (pacote `reactflow`, versão 11) para nós e arestas

## Como o código está organizado

A tela **nunca calcula nada sozinha**: ela só desenha um *snapshot* por vez. Um snapshot é uma foto do estado da memória e da execução naquele instante. Avançar e voltar é só trocar o índice do snapshot exibido.

```
src/
├── memoryModel.js            Modelo da memória (nós, descritor, free) + gravador de passos + contrato do snapshot
├── structures/
│   ├── index.js              Catálogo das estruturas (abas da tela)
│   ├── simpleList.js         Lista simples: um gerador de passos por função C
│   ├── doublyList.js         Lista dupla
│   ├── circularList.js       Lista circular
│   ├── stack.js              Pilha dinâmica
│   ├── queue.js              Fila dinâmica
│   ├── listCommon.js         Funções idênticas em mais de uma estrutura (tamanho_lista)
│   └── listings/             Código C real (GERADO por tools/gen-listings.mjs)
├── snapshotToFlow.js         Snapshot -> nodes/edges do React Flow
├── LinkedListNode.jsx        Nós desenhados: descritor, Elem e NULL
├── Panels.jsx                Código, variáveis, memória, structs e a faixa de ponteiros auxiliares
├── useStepper.js             Lista de passos + índice atual (avançar, voltar, reproduzir)
├── LinkedListVisualizer.jsx  Tela principal (abas + estrutura selecionada)
└── App.tsx                   Renderiza o visualizador
tools/gen-listings.mjs        Gera structures/listings/*.js a partir do repositório do professor
test/steps.test.mjs           Testa todos os geradores (ver "Testes")
```

Formato de um snapshot (documentado no topo de `memoryModel.js`):

```js
{
  fn, line, message,    // função C em execução, id da linha, texto explicativo
  list,                 // { kind, desc, nodes, nextId, freed }: estado da memória
  order, floating,      // ordem de desenho e nós fora da fileira (novo / removendo)
  ghosts,               // nós que sofreram free() neste passo (aparecem "liberado" por um passo)
  vars,                 // variáveis locais visíveis
  focusEdge, focusField,// o que acabou de mudar (aresta ou campo do descritor)
  crash,                // true quando o código C falharia neste passo
}
```

### Adicionando uma função nova

1. Inclua as linhas da função no `STRUCTURES` de `tools/gen-listings.mjs` e regenere os listings (veja abaixo).
2. Escreva o gerador em `structures/<estrutura>.js`, com um `rec.push(...)` por linha de C executada (`rec.free(id)` para free, `rec.ret(...)` para return).
3. Registre-o em `operations` e em `buttons` da estrutura.

### Regenerando a listagem do código C

Os arquivos de `structures/listings/` são **gerados**. Não edite à mão:

```bash
node tools/gen-listings.mjs <caminho/para/EDL-2026-1> <hash-do-commit> src/structures/listings
```

Se o texto do arquivo C mudar e não bater com o esperado, o script falha em vez de gerar uma listagem inconsistente.

### Testes

```bash
npx esbuild test/steps.test.mjs --bundle --platform=node --format=esm --outfile=/tmp/steps.mjs && node /tmp/steps.mjs
```

Verifica, para as cinco estruturas, que toda linha citada pelos passos existe no código C, que o `free()` dura um passo, que as variáveis locais terminam no `return` e que 200 sequências aleatórias de operações dão o mesmo resultado de um modelo de referência.

## Limitações atuais

- Os passos são **escritos à mão**, um gerador por função. O projeto ainda não interpreta código C.
- O formato do snapshot é o contrato que um futuro interpretador de C deverá produzir, sem mudar a interface.
- Funções como `destruir`, `acessar_*` e `menor_valor_pilha` ainda não têm passo a passo.

## Próximos passos

- Passo a passo das funções restantes (`destruir`, `acessar_*`, remoções da lista circular quando o professor implementar).
- Decisão em aberto sobre como extrair o estado de um código C real: backend com GDB, WebAssembly (Emscripten) ou interpretador próprio de um subconjunto de C.
- Modo "preveja o resultado antes de executar" como gamificação.

## Contribuindo

- Uma branch por tarefa: `git switch -c feature/pilha`.
- Abra um Pull Request para a `main` e peça revisão de um colega.
- Não versione `node_modules/` nem `dist/` (já estão no `.gitignore`).

## Créditos

O código C exibido vem do repositório da disciplina de Estrutura de Dados Lineares (UNICAP), [PauloHARocha/EDL-2026-1](https://github.com/PauloHARocha/EDL-2026-1), pasta `estruturas-de-dados/` (listas, pilha e fila dinâmicas), commit `8e45a40`. Os direitos sobre esse código pertencem ao autor original.

