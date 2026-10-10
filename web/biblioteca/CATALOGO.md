# Catálogo de modelos XSL analisados

Cada modelo recebido é lido, classificado e desmontado em padrões reutilizáveis. Os padrões entram na Biblioteca de códigos do editor (arquivos `*.json` desta pasta), sempre com a origem.

| Lote | Arquivo da biblioteca | Padrões |
|---|---|---|
| 1 | `01_cinex.json` | 19 |
| 2 | `02_pedido_chapas_txt_integracao.json` | 25 |
| 3 | `03_pedidos_sendto.json` | 14 |
| 4 | `04_portas_pedras.json` | 5 |
| 5 | `05_pedido_fabrica_txt.json` | 7 |
| 6 | `06_listing_pacote3.json` | 9 |
| 7 | `07_listing_pacote4.json` | 4 |

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

### Lote 4 — Listing (segunda instalação)

Outra instalação da pasta `Budget\Layouts\Listing`, com versões diferentes dos mesmos arquivos (Listagem, MCMIntegration, Tramontina, Elettromec) e parceiros novos: Cosentino, Appliances, Lofra, Falmec, Franke e Cinex. Trouxe o `Orcamento.css` que faltava.

**Listagem_Builder_Fabrica.xsl** · ficha da porta para a fábrica: código e acabamento do Builder, furo (`DOORHOLE`), lado (`HOLESIDE`), posição do puxador (`KNOBPOSITION`), recorte; numeração hierárquica `xsl:number level="multiple"`.

**Parceiro_Cosentino.xsl** · pedras: área (`AREA`) e alerta "PREENCHER INFORMAÇÕES" quando a descrição do material ficou com o marcador `$MATERIALUSERDESCRIPTION$`.

Arquivos que vieram danificados no `.rar` e não puderam ser lidos: Listagem_Builder_Fabrica.pt, Listagem_Builder_Loja.pt, parceiro_Smeg, Parceiro_tramontina.en (versão nova) e dois arquivos vazios.

### Lote 5 — SendTo de pedido para fábrica (Electrolux, Cata, Tramontina)

Pacote completo (8 de 8 arquivos). `sendTo.xml` liga as categorias Pedido_Electrolux, Pedido_Cata, Pedido_tramontina, pedido, pedido_especiais, orcamento e listagem a layouts TXT.

**Pedido.xsl / Listagem.xsl** · TXT em registros numerados (layout EDI): cada linha começa com um código (21 desconto, 88 ICMS, 92/93 versão da biblioteca "cozinhas", 94 ambiente, 99 total). Itens com código do fornecedor pela família (Alumistar, Ancezki, Casavitra, Lapividros, OMP, Rubinettos, Treviso), dimensões editáveis e letra do puxador. Listagem = Pedido sem o preço total.
Risco: desconto e ICMS são lidos do primeiro item do projeto, assumindo o mesmo valor para todos.

**Pedido_Fabrica_Geral.xsl / Pedido_Fabrica_Especiais.xsl** · o mesmo TXT filtrado pela referência PEDIDO_ESPECIAL (NAO × SIM). Os dois arquivos só diferem nessa palavra.

**Orcamento.xsl** · TXT simples do orçamento. Problema: item sem preço de orçamento sai com "0.00" e "0,00" seguidos.

**sendTo.xml** · a opção de e-mail aponta para `Fabrica.xsl`, que não veio no pacote.

### Lote 6 — Listing pacote 3 (100+ parceiros)

156 arquivos, 124 nomes novos. Dos 113 layouts de parceiro, 51 são cópias quase idênticas da base `Parceiro_Accord` (uma segunda família segue a base Leo Madeiras/Adipar): candidatos a um arquivo base com variáveis.

**OrcamentoMontadoComEdicao.xsl / OrcamentoExplodidoComEdicao.xsl** · o preço vira link que abre a janela de alteração de preço do próprio Promob: `external.InvokeVSAComMensagem(..., 'FormApresentacaoListagem', 'AlterarPreco', 'ref;qtd;tabela;unitário;componentes;unidade;descrição;família;fornecedor')`, liberado pelo atributo `PRICECANMODIFY` do item (padrão Y). As versões SemEdicao são o mesmo layout só leitura.

**ListagemMontados / ListagemExplodidos (e 37 outros)** · logo dinâmico do cliente (`@CLIENTLOGO`), modelo estendido (`MODEL_EXT` com "-" quando vazio) e as seções reais `OBSERVATIONS` e `SIGNATURES`.

**Listagem_Revest.xsl / Parceiro_Kapazi.xsl** · revestimento: m² → caixas com `ceiling(QUANTITY div BOXQUANTITY)`, mínimo 1. Problema: um teste foi escrito `valueOfQuantityPerBox = 0` (sem o `$`), então esse ramo nunca roda.

**Parceiro_Metal_Design.xsl** · imagem do item (`REFERENCES/IMAGE`, senão `@IMAGE`).

**Parceiro_Rometal.xsl** · itens com `NAO_DISPONIVEL = 'Não Disponível'` saem sem destaque.

**Parceiro_Leo_Madeiras_chapas.xsl** · código do fornecedor (`@SUPPLIERREFERENCE`).

**Parceiro_Perfar_Detalhado.xsl** · ficha da porta com códigos do ERP (`ERP_COD`, `ERP_MOD`, `ERP_COR`, `ERP_ACA`, `ERP_FACE`, `ERP_RAIO`, `ERP_LADO_ABE`, `ERP_CAVA_POS`, `ERP_CAVA_DIM`, `ERP_HELO_POS`).

**Parceiro_Salvatore.xsl** · até 5 cores por item (`COR1`–`COR5`), CNPJ da loja (`rep_CNPJempresa`).

**MCMIntegration.xsl** · novos atributos `PRODUCTIVESCRIPT`, `KIT_AGRUPADOR`, `PRICEUNIT`.

Arquivos danificados no `.rar`: Parceiro_Perfar, Listagem_Revest.en, parceiro_Mekal, Parceiro_debacco, parceiro_Zen, parceiro_Zen.pt, parceiro_Lofra, OrcamentoCondicoes.

### Lote 7 — Listing pacote 4

19 arquivos: 7 novos, 8 versões diferentes de modelos já catalogados (anteriores ao logo dinâmico `CLIENTLOGO`, com `Orcamento.css`), 3 idênticos e 1 danificado (`OrcamentoMontado.xsl`, vazio no `.rar`).

**orcamento_ferragens.xsl** · separa o total de ferragens (`FERRAGEM = SIM`) do total da modulação e lista as ferragens sem repetição.
Problemas: **não roda** — chama `PercorrerItens`, `GerarItemFerragem` e `key('iguais')`, que não existem no arquivo; soma o preço com `sum()` (NaN com vírgula). A biblioteca traz a versão corrigida e o agrupamento com `xsl:key` declarado.

**pedido_loja.xsl** · orçamento explodido sem preço por item, total pelo valor de pedido (`ORDER`).

**OrcamentoExplodidoSimples.xsl** · explodido sem matéria-prima e preço de venda. **OrcamentoExplodidoComEdicao.xsl** (desta instalação) ganhou a coluna Matéria-prima (`MATERIAL`).

Parceiros novos: Criativa Puxadores, Estitech, Dancamac.
