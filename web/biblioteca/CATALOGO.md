# Catálogo de modelos XSL analisados

Cada modelo recebido é lido, classificado e desmontado em padrões reutilizáveis. Os padrões entram na Biblioteca de códigos do editor (arquivos `*.json` desta pasta), sempre com a origem.

| Lote | Arquivo da biblioteca | Padrões |
|---|---|---|
| 1 | `01_cinex.json` | 19 |
| 2 | `02_pedido_chapas_txt_integracao.json` | 25 |
| 3 | `03_pedidos_sendto.json` | 14 |

## Tipos de layout encontrados

| Tipo | Saída | Modelos |
|---|---|---|
| Relatório na tela (orçamento, pedido, listagem) | HTML | Parceiro_Cinex_Orcamento, Parceiro_Cinex, PedidoMontadoGeral, OrcamentoExplodido, ListagemMontadosParceiros, Listagem_Chapas, Listagem_Chapas_Repeticao, pedido, pedido_separado |
| Integração com ERP | XML | PromobERPStartIntegration (ERP Start), FabricaXML (Focco), XMLtabela* e Bartzen/Casaepoesia (SendTo), StudioB |
| Arquivo texto para ERP ou fábrica | TXT / CSV | TxtBudget, TxtOrder, Fabrica, Default, DefaultBartzen*, TXTtabela* |
| XML montado como texto | TXT | Bontempo |
| Configuração do menu Enviar Para | XML de configuração | sendTo.xml |

## Fichas

### Lote 1 — Cinex

**Parceiro_Cinex_Orcamento.xsl** · orçamento HTML · padrões: quantidade alterada, unidade ≠ un, mostrar preço condicionado (SHOWPRICE), logos.
Problemas: a linha usa preço de tabela e o total usa preço de orçamento (não fecham); "Rep" e "Qty" mostram o mesmo campo; itens saem como `<td>` sem `<tr>`.

**Parceiro_Cinex.xsl** · listagem HTML sem preço · padrões: link `external.ProcessStart`, aviso "apenas para visualização".

**PromobERPStartIntegration.xsl** · XML ERP Start · padrões: busca em cascata (referência → atributo → integração), ID por estrutura, filtro PEDIDOFABRICA, roteiro, corte, de-para de atributos, plugins como comentário.
Problemas: `parent::node()` repetido 4–5 vezes para achar o ambiente (quebra em subitens; use `ancestor::AMBIENT`); condição com `or`/`and` sem parênteses em GERARESTRUTURA.

### Lote 2 — pedidos, chapas, TXT e integrações

**PedidoMontadoGeral.xsl** · pedido HTML de módulos montados · padrões: **peso pela tabela de preço** (`PRICE/EXTRAINFORMATIONS/EXTRAINFORMATION[@ID='Peso']/@TOTALVALUE`), preço do módulo + componentes, subtotal por categoria, esconder categorias, total separado por parceiro (Brilhart Color).
Problemas: subtotal com `<td>` dentro de `<td>`; nomes de categoria fixos no código; título em inglês ("Explode modules budget").

**OrcamentoExplodido.xsl / ListagemMontadosParceiros.pt.xsl** · padrões do Promob · só módulos de primeiro nível, preço + componentes.
Problema: recuo dos subitens com `disable-output-escaping`, que nem todo navegador respeita.

**Listagem_Chapas.pt.xsl / Listagem_Chapas_Repeticao.pt.xsl** · listagem de painéis · padrões: expandir/recolher subitens com `external.GetStringVSA('pastaSistema')`, painéis a partir do m², dados de chapa (MATERIAL, THICKNESS, MODEL, MAXWIDTH, MAXDEPTH).
Os dois arquivos só diferem em duas colunas (Cód. pai/Cód. × Repetição): candidatos a um arquivo só.

**TxtBudget.xsl / TxtOrder.xsl** · TXT de largura fixa · padrões: coluna de largura fixa, quebra de linha CRLF.
Os dois são idênticos exceto BUDGET × ORDER: viram um arquivo com uma variável.

**Bontempo.xsl** · XML gerado como texto · padrões: NCM, IPI em cascata, metadados do pedido, código da tabela de preço.
Risco: monta XML à mão com `method="text"`; uma descrição com aspas ou `&` gera XML inválido. Preferir `method="xml"` ou o template Substituir.

**FabricaXML.xsl** · XML Focco (estrutura, configurado, roteiro) · padrões: esqueleto Focco, código CODE→COMPLETE, características do Builder, operações com corte e CAM, quantidade por repetição.
Problema: a regra do CODIGO aparece 4 vezes; virou template na biblioteca.

### Lote 3 — pedidos separados e Enviar Para

**pedido.xsl / pedido_separado.xsl** · pedido HTML filtrado pela referência `SEPARACAO_PEDIDO` (pedido_geral × pedido_laca).
Idênticos exceto o valor do filtro. Risco: `sum()` direto no preço só funciona se o Promob gravar ponto decimal; com vírgula o total sai NaN. **Confirmar com um XML real.**

**SendTo (3 pacotes: Casa e Poesia, Bartzen e variação)** · configuração do menu Enviar Para + layouts TXT/XML.
- `sendTo.xml` liga cada opção (arquivo, e-mail, FTP, pacote .zip) a um XSL e a categorias de orçamento.
- `TXTtabela*` / `XMLtabela*`: o mesmo arquivo repetido 4–5 vezes, mudando só o destino (`EXPORTXML` = geral, laca, Blum, acessórios). Os itens dos outros destinos são descartados com templates vazios.
- `StudioB.xsl`: copia o XML inteiro sem os nós BUDGET (a fábrica não vê o preço ao cliente).
- `DefaultBartzen*`: código do painel montado com medidas (`REF.LARG.COMP` em 4 dígitos).
- `Casaepoesia.xsl` e `Bartzen.xsl` são o mesmo arquivo com nomes diferentes.

## Padrões de arquitetura que se repetem

1. **Arquivo copiado por cliente ou destino.** TxtBudget/TxtOrder, pedido/pedido_separado, Chapas/Chapas_Repeticao e os TXT/XMLtabela* são cópias que diferem em 1–3 linhas. Recomendação: um arquivo base com uma variável no topo (`pedido`, `destino`, `nivelPreco`).
2. **Roteamento por referência do item.** `SEPARACAO_PEDIDO` e `EXPORTXML` dizem para onde cada item vai. É o mecanismo para separar pedidos por fornecedor, linha ou setor.
3. **Recursos do navegador do Promob.** `external.ProcessStart` (abrir link/programa) e `external.GetStringVSA('pastaSistema')` (pasta do sistema) só funcionam dentro do Promob.
4. **Peso e dados fiscais vêm da tabela de preço** (`PRICE/EXTRAINFORMATIONS`), não das referências do item.
