# Desafio de Teste — Sudoku Binário

Casos de teste em **JavaScript (Jest)** para um **Sudoku binário (Binairo/Takuzu) 6 x 6**.
Desenvolvido com TDD: primeiro os testes (commit `test:`, falhando), depois a implementação
(commit `feat:`).

## Colaborador

- **Gustavo Fumagalli** — [@gufuba](https://github.com/gufuba)

## Especificação do desafio

- Casos de teste para testar **Sudoku binário de tamanho 6 x 6**.
- Casos de teste em **JavaScript** para testar **JavaScript**.

### Regras do Sudoku binário (implementadas e testadas)

O tabuleiro 6 x 6 é preenchido apenas com **0 e 1**:

1. **No máximo dois números iguais seguidos** em qualquer linha ou coluna (`000` e `111` são proibidos).
2. Cada linha e cada coluna tem **a mesma quantidade de 0s e 1s** (3 de cada).
3. **Não pode haver duas linhas iguais** nem **duas colunas iguais**.

Células preenchidas no tabuleiro inicial são **fixas** (não podem ser alteradas). O jogador vence
quando o tabuleiro está **completo e sem nenhum conflito**.

## Como executar

```bash
npm install
npm test        # roda os testes com relatório de cobertura (exige 100%)
```

Requer Node.js 18 ou superior.

## Estrutura

```text
src/sudokuBinario.js          # classe SudokuBinario (regras, validação e solucionador)
tests/sudokuBinario.test.js   # casos de teste (Jest)
```

### API usada pelos testes

```js
const sudoku = new SudokuBinario(['01....', '......', ...]);  // 6 textos de 6 caracteres: 0, 1 ou .
SudokuBinario.vazio();                // tabuleiro 6x6 sem nenhuma célula preenchida

sudoku.valor(l, c);                   // 0, 1 ou null (vazia)
sudoku.ehFixa(l, c);                  // célula dada no tabuleiro inicial?
sudoku.definir(l, c, 0 | 1);          // jogada (erro se a célula for fixa)
sudoku.limpar(l, c);                  // esvazia a célula (erro se for fixa)

sudoku.conflitos();                   // lista de violações das 3 regras ([] = nenhuma)
sudoku.completo();                    // sem células vazias?
sudoku.resolvido();                   // completo e sem conflitos?

sudoku.resolver();                    // solução (novo SudokuBinario) ou null
sudoku.contarSolucoes(limite = 2);    // conta soluções (para no limite)
sudoku.solucaoUnica();                // exatamente uma solução?
```

Formato dos conflitos: `{ regra: 'TRES_SEGUIDOS', tipo, indice }`,
`{ regra: 'EXCESSO', tipo, indice, valor }` e `{ regra: 'DUPLICADA', tipo, indices: [i, j] }`,
onde `tipo` é `'linha'` ou `'coluna'`.

## Funcionamento dos casos de teste

51 testes, organizados em grupos (`describe`):

| Grupo | O que verifica |
|---|---|
| **Tabuleiro 6x6** | Tamanho 6; tabuleiro vazio com 36 células; leitura do tabuleiro inicial (`0`, `1`, `.`) com células fixas; rejeição de tabuleiros inválidos (5 ou 7 linhas, linhas com 5 ou 7 colunas, caractere inválido, entrada que não é lista) e de coordenadas fora do tabuleiro. |
| **Preenchimento das células** | `definir` coloca 0 ou 1; célula livre pode ser sobrescrita e limpa; célula **fixa** não pode ser alterada nem limpa; valores diferentes de 0/1 são rejeitados (`2`, `'1'`, `null`, `undefined`, `0.5`). |
| **Regra 1 — três iguais seguidos** | Detecta `000`/`111` em linha e coluna, no início, meio e fim; dois iguais seguidos são permitidos; célula vazia ou valor diferente quebra a sequência; quatro iguais geram **um único** conflito por linha. |
| **Regra 2 — mesma quantidade de 0 e 1** | Mais de três 0s (linha) ou três 1s (coluna) violam; 3 e 3 está correto; linha incompleta com até 3 de cada valor ainda é aceita. |
| **Regra 3 — sem linhas/colunas iguais** | Duas linhas (ou colunas) **completas** iguais violam; linhas incompletas iguais ou completas diferentes não são conflito. |
| **Fim de jogo** | O gabarito usado nos testes respeita todas as regras; `completo()` e `resolvido()` (completo mas inválido e válido mas incompleto **não** vencem); simulação de uma partida em que o jogador completa a última linha e vence; uma jogada errada é apontada como conflito. |
| **Solucionador** | Resolve tabuleiro com a última linha em branco (a solução é o gabarito); não altera o original; tabuleiro já resolvido; tabuleiro vazio tem solução válida; respeita as células fixas; devolve `null` quando as células já violam as regras e quando **não há conflito aparente mas não existe solução**; `contarSolucoes` (1, 1, 0, e respeita o limite) e `solucaoUnica`. |

**Gabarito dos testes** (válido nas três regras):

```text
0 1 0 1 1 0
0 1 1 0 0 1
1 0 0 1 0 1
1 0 1 0 1 0
0 1 0 0 1 1
1 0 1 1 0 0
```

**Cobertura:** `jest.coverageThreshold` exige **100 %** de instruções, ramos, funções e linhas;
o `npm test` falha se a cobertura cair. O workflow do GitHub Actions
(`.github/workflows/testes.yml`) roda os testes a cada push.
