# Editor XSL

## Editor XSL Promob (web)

Editor de layouts XSL do Promob (orçamento, listagem e integração ERP), em uma página só, sem instalação.

- **Mapear pasta do sistema:** lê a pasta do Promob e lista todos os `.xsl` e os `.xml` de layouts e orçamento. No Chrome e no Edge, salva direto na pasta e cria um `.bak` do original.
- **Importar:** arraste ou escolha arquivos avulsos.
- **Editor:** código com destaque, validação na hora e mapa das seções (HEADER, CUSTOMERDATA, BODY, TOTALS, FOOTER…) com nomes legíveis para cada campo.
- **Visualizar:** aplica o XSL ao XML de orçamento e mostra o relatório ou o XML de integração. Avisa quando os dados são o exemplo inventado, ensina a gerar o XML real (Enviar Para → Arquivo XML, com a linha pronta para o `sendTo.xml`) e detecta se o Promob grava os valores com vírgula ou ponto, apontando os layouts que mostrariam NaN.
- **Campos:** catálogo do XML de orçamento e os campos que existem de fato no XML carregado (referências, metadados, integração).
- **Biblioteca de códigos:** trechos prontos (peso pela referência, moeda, somas, colunas, integração) e os seus, com exportação. No editor publicado no claude.ai, a **biblioteca da equipe** reúne os códigos que cada pessoa compartilha (cada uma grava só os seus; o dono do editor pode remover qualquer um).
- **Modelos:** os layouts recebidos, sem duplicados, organizados por tipo (orçamento, pedido, listagem, parceiros, integração, TXT, Enviar Para), com idiomas e pacotes como versões. Abrir, visualizar, levar ao construtor ou exportar.
- **Histórico e backups:** desfazer/refazer, versões por arquivo (ao abrir, salvar, exportar, gerar, antes de restaurar e rascunho automático), comparar, restaurar, voltar ao original, `.bak` e cópia datada em `_historico_editorxsl` a cada salvamento na pasta.
- **+ Código nas seções:** insere um trecho da biblioteca ou um campo direto na seção escolhida do layout.
- **Comparar (estilo WinMerge):** dois arquivos lado a lado com linhas alinhadas, destaque do trecho alterado, navegação entre diferenças, cópia de blocos (→ ←), ignorar espaços, só diferenças, e aplicar o resultado no arquivo. Modo Pacotes compara dois conjuntos de modelos arquivo por arquivo.

- **Parceiros (gerador):** cada parceiro vira uma ficha (arquivo, título, logo, cor, CSS, moeda e dados de contato) e o layout é gerado de uma base (Accord, com seções do Promob, ou Adipar/Leo Madeiras, por templates, ou o XSL aberto no editor). Importa o acervo e classifica cada parceiro em Padrão (sai igual da base), Quase igual ou Personalizado; edita por planilha (.csv); compara o gerado com o original; gera os marcados num .zip. Alterar a base e gerar de novo atualiza todos.
- **Publicar no Promob:** com a pasta do sistema mapeada (Chrome/Edge), grava o layout aberto ou os parceiros marcados direto na pasta escolhida; se o arquivo existir, o original fica em `.bak` e numa cópia datada em `_historico_editorxsl`. No `sendTo.xml`, um formulário inclui uma opção nova no Enviar Para (arquivo ou e-mail, layout, extensão, codificação e categorias).
- **Pedir à IA:** no editor publicado no claude.ai, o Claude responde ali mesmo: altera o arquivo (proposta auditada, comparada com o atual e aplicada só com o seu clique) ou só responde a uma pergunta. Fora do claude.ai, monta o pedido para colar.
- **Auditoria:** confere cada layout antes de ele chegar ao Promob: erro de estrutura, template, variável, chave ou formato que faltam, teste sem `$`, `sum()` que dá NaN com vírgula, `parent::node()` fixo, senha em texto aberto e arquivo citado que não existe. Correções seguras com um clique, em lote (.zip) e relatório (.csv). O Salvar pede confirmação quando o arquivo tem erro.

Os modelos ficam em `web/modelos/<pacote>/` (fora do git) e são catalogados por `web/catalogar_modelos.py` durante o build.

Gerar: `python3 web/build.py` → `web/dist/EditorXSL-Promob.html` (abrir no navegador). Layouts reais podem ficar em `web/private/` (fora do git) para virem embutidos como exemplo. `--sem-modelos` gera sem o acervo.

Testar: `cd web/tests && npm ci && npx playwright install chromium && node run.js`. Os testes cobrem a auditoria (com os arquivos de `web/tests/fixtures`), o construtor visual e a interface; quando o acervo está embutido, também abrem e renderizam todos os modelos. Rodam a cada push no GitHub Actions (`.github/workflows/web.yml`).

---

## Utilitário original (recents.xsl)

Uma reconstrução limpa do utilitário **Editor_XSL.exe** (v1.0.0.0, 2011, .NET 2.0), usado em instalações do **Promob**.

## O que ele faz

O comportamento do original foi lido direto do IL do executável:

1. Você escolhe uma pasta.
2. O programa procura **recursivamente** todos os arquivos `recents.xsl`.
3. Em cada um, ele remove a linha que ordena a lista de recentes por data:
   ```xml
   <xsl:sort select="@date" order="descending"/>
   ```
   Uma linha só sai se tiver **todos** estes termos, sem diferenciar maiúsculas: `xsl:sort`, `select`, `"@date"`, `order`, `"descending"`.
4. O resultado é gravado num `.temp`, que substitui o original e depois é apagado.

## O que mudou em relação ao original

| Original (2011) | Clone (v2) |
|---|---|
| Sem backup | Cria um `recents.xsl.bak` (pode desligar) |
| Reescreve todos os arquivos, mesmo sem alteração | Só regrava o arquivo quando há linha a remover |
| Converte para UTF-8 sem BOM e CRLF | Mantém a codificação, o BOM e as quebras de linha originais |
| Um erro em qualquer arquivo para tudo e deixa o cursor travado em "aguarde" | Registra o erro e segue para os próximos arquivos |
| Uma pasta sem permissão aborta a busca | Ignora a pasta e continua |
| Ignorava uma linha em que o termo aparecia na coluna 0 (`IndexOf > 0`) | Considera qualquer posição |
| Sem relatório | Mostra um log por arquivo, com contagem final e modo **Só simular** |
| Só tinha interface gráfica | Também roda por linha de comando |
| .NET 2.0 | .NET Framework 4.8, que já vem no Windows 10/11 |

## Como usar

### Interface gráfica
Abra o `EditorXSL.exe`, clique em **Procurar...**, escolha a pasta (por exemplo, a pasta do Promob) e clique em **Editar XSL**.

### Linha de comando
```bat
EditorXSL.exe "C:\Promob" --simular
EditorXSL.exe "C:\Promob" [--arquivo recents.xsl] [--sem-backup]
```

### PowerShell (sem compilar)
```powershell
.\scripts\Editar-RecentsXsl.ps1 -Pasta "C:\Promob" -Simular
.\scripts\Editar-RecentsXsl.ps1 -Pasta "C:\Promob"
```

## Como compilar

- **GitHub Actions:** cada push gera o `EditorXSL.exe` como artefato. Abra a aba *Actions*, entre na última execução do *build* e baixe **EditorXSL**.
- **Na sua máquina:** com o .NET SDK 8+ instalado, rode `dotnet build src/EditorXSL/EditorXSL.csproj -c Release`. Você também pode abrir o `.csproj` no Visual Studio 2022.

## Estrutura

```
src/EditorXSL/XslSortRemover.cs   lógica principal (busca e edição)
src/EditorXSL/MainForm.cs         interface WinForms
src/EditorXSL/Program.cs          ponto de entrada da janela e da linha de comando
scripts/Editar-RecentsXsl.ps1     versão em PowerShell
tests/                            teste rápido usado no CI
```
