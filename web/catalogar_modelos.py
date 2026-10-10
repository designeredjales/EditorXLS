"""Cataloga os modelos XSL de web/modelos/<pacote>/ para a aba Modelos do editor.

- Remove duplicados (mesmo conteúdo em outro nome, idioma ou pacote) e lista onde mais aparecem.
- Classifica cada modelo (orçamento, pedido, listagem, parceiro, integração, texto, Enviar Para).
- Detecta o que o modelo usa (seções, referências, informações extras, metadados, recursos do Promob).
- Junta descrições e alertas curados a partir da análise feita nos lotes recebidos.
"""
import hashlib
import pathlib
import re

DESCRICOES = {
    "Parceiro_Cinex_Orcamento": ("Orçamento ao cliente com preço por item, condições de pagamento e total final.",
                                 ["A linha usa preço de tabela e o total usa preço de orçamento: as linhas não fecham com o total.",
                                  "As colunas Rep e Qty mostram o mesmo campo."]),
    "Parceiro_Cinex": ("Listagem sem preço para visualização, com link \"Cinex do Meu Jeito\" (external.ProcessStart).", []),
    "PromobERPStartIntegration": ("XML para o ERP Start: itens, estrutura, configurado, roteiro e otimização de corte.",
                                  ["Sobe na hierarquia com parent::node() repetido; quebra em subitens.",
                                   "Condição or/and sem parênteses em GERARESTRUTURA."]),
    "MCMIntegration": ("Integração MCM (base do ERP Start): estrutura, roteiro, máquinas e colunas de nesting.", []),
    "Bontempo": ("XML de pedido Bontempo gerado como texto: preços tabela/loja/cliente, IPI, NCM, fornecedor.",
                 ["Monta XML com method=\"text\": aspas ou & numa descrição geram arquivo inválido."]),
    "PedidoMontadoGeral": ("Pedido de módulos montados com peso (tabela de preço), subtotal por categoria e total dividido entre fábrica e Brilhart Color.",
                           ["Subtotal com célula dentro de célula.", "Nomes de categoria fixos no código."]),
    "FabricaXML": ("XML Focco em três importações: estrutura, configurado e roteiro produtivo com corte e usinagem.",
                   ["A regra do CODIGO se repete em vários templates."]),
    "Listagem_Chapas": ("Listagem de painéis por matéria-prima, com m², quantidade de painéis e subitens que abrem e fecham.", []),
    "Listagem_Chapas_Repeticao": ("Mesma listagem de painéis, com a coluna Repetição no lugar de Cód. pai/Cód.", []),
    "ListagemMontadosParceiros": ("Listagem de módulos montados (primeiro nível) com condições de pagamento.", []),
    "OrcamentoExplodido": ("Orçamento padrão com módulos explodidos por categoria e preço com componentes.", []),
    "TxtBudget": ("Arquivo TXT de largura fixa com preço de orçamento.", ["Idêntico ao TxtOrder exceto o nível de preço."]),
    "TxtOrder": ("Arquivo TXT de largura fixa com preço de pedido.", ["Idêntico ao TxtBudget exceto o nível de preço."]),
    "pedido": ("Pedido HTML só com os itens marcados SEPARACAO_PEDIDO = pedido_geral.",
               ["sum() direto no preço: se o Promob gravar vírgula decimal, o total sai NaN."]),
    "pedido_separado": ("Pedido HTML só com os itens marcados SEPARACAO_PEDIDO = pedido_laca.",
                        ["sum() direto no preço: se o Promob gravar vírgula decimal, o total sai NaN."]),
    "sendTo": ("Configuração do menu Enviar Para: liga cada opção (arquivo, e-mail, FTP, pacote .zip) a um layout XSL e a categorias.", []),
    "old_sendTo": ("Versão antiga da configuração do Enviar Para.", []),
    "StudioB": ("Copia o XML do Promob inteiro sem os nós BUDGET: a fábrica não vê o preço ao cliente.", []),
    "Default": ("CSV simples (ponto e vírgula) com item, quantidade, referência, descrição e medidas.", []),
    "Fabrica": ("TXT para a fábrica com ID do projeto, versão do Promob, dados da loja e do cliente e itens de primeiro nível.", []),
    "FabricaTXT": ("TXT para a fábrica (pacote SCA) com código, modelo e dimensão.", []),
    "FabricaTESTE": ("Variação de teste do TXT da fábrica.", []),
    "Sismodular": ("TXT para o Sismodular com código, modelo e dimensão.", []),
    "cinex": ("XML de pedido para a Cinex com dezenas de referências de configuração (CNX__*) e dados do pedido.",
              ["Exporta os metadados USERNAME e PASSWORD em texto aberto no XML do pedido."]),
    "Bartzen": ("XML Bartzen: cópia do XML com atributos escolhidos e * na referência quando há observação.", []),
    "Casaepoesia": ("XML Casa e Poesia (mesmo conteúdo do Bartzen.xsl).", []),
    "DefaultBartzen": ("TXT Bartzen com código composto (REF.LARG.COMP em 4 dígitos).", []),
    "DefaultBartzen2": ("Variação do TXT Bartzen com saída XML e telefones em 11 posições.", []),
    "DefaultBartzenObservacao": ("TXT Bartzen com * e linha de observação por item.", []),
    "DefaultCePObservacao": ("TXT Casa e Poesia com * e linha de observação por item.", []),
    "DefaultBartzen_Antigo": ("Versão antiga do TXT Bartzen.", []),
    "TXTtabelaGeral": ("TXT da tabela geral (EXPORTXML = tabela_geral/tabela_micro).", ["Cópia dos outros TXTtabela*; só muda o destino."]),
    "TXTtabelaLaca": ("TXT da tabela laca (EXPORTXML = tabela_laca).", ["Cópia dos outros TXTtabela*; só muda o destino."]),
    "TXTtabelaBlum": ("TXT da tabela Blum (EXPORTXML = tabela_blum).", ["Cópia dos outros TXTtabela*; só muda o destino."]),
    "TXTtabelaAcessorios": ("TXT da tabela de acessórios (EXPORTXML = tabela_acessorios).", ["Cópia dos outros TXTtabela*; só muda o destino."]),
    "TXTtabelaGeral_acessorios": ("TXT geral com acessórios juntos.", []),
    "XMLtabelaGeral": ("XML da tabela geral: cópia do XML do Promob com atributos escolhidos, só itens do destino.", []),
    "XMLtabelaLaca": ("XML da tabela laca.", []), "XMLtabelaBlum": ("XML da tabela Blum.", []),
    "XMLtabelaAcessorios": ("XML da tabela de acessórios.", []), "XMLtabelaGeral_Acessorios": ("XML geral com acessórios.", []),
    "XMLtabelageral2": ("Variação do XML da tabela geral.", []),
    "Orcamento": ("Orçamento padrão do Promob: dados do cliente, peças e total.", []),
    "Orcamento_Manager": ("Orçamento padrão (versão Manager).", []),
    "OrcamentoResumido": ("Orçamento resumido: texto de apresentação, cliente, total, entradas, condições, observações e assinaturas.", []),
    "Listagem": ("Listagem padrão do Promob.", []), "Listagem_categoria": ("Listagem padrão agrupada por categoria.", []),
    "ListagemCompleta": ("Listagem completa padrão do Promob.", []), "ListagemCINEX": ("Listagem Cinex (seções do editor do Promob).", []),
    "PedidoSCA": ("Pedido SCA com total por categoria.", []), "PedidoSCA_explodido": ("Pedido SCA com módulos explodidos.", []),
    "TESTE_Pecas": ("Layout de teste de peças (pedido SCA de acessórios).", []),
    "parceiro_finotoc_detalhado": ("Pedido Finotoc detalhado: uma coluna para cada configuração da porta (espessura, face, cor, puxador, cava, iluminação, frisos…).", []),
}
IDIOMA = {"pt": "PT", "pt-BR": "PT", "es": "ES", "en": "EN"}


def norm(t):
    return re.sub(r"\s+", " ", t.replace("﻿", "")).strip()


def ler(p):
    raw = p.read_bytes()
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw.decode("cp1252")


def base_e_idioma(nome):
    stem = re.sub(r"\.(xslt?|xml|css)$", "", nome, flags=re.I)
    m = re.match(r"^(.*?)\.(pt-BR|pt|es|en)(_copia)?$", stem)
    return (m.group(1), IDIOMA[m.group(2)]) if m else (stem, "")


def categoria(nome, metodo, texto):
    n = nome.lower()
    if n.endswith(".xml") and "SENDTOCOLLECTION" in texto:
        return "Enviar Para (configuração)"
    if n.endswith(".css"):
        return "Estilos (CSS)"
    if metodo == "xml":
        return "Integração ERP (XML)"
    if metodo == "text":
        return "Arquivos texto (TXT/CSV)"
    if "teste" in n:
        return "Testes"
    if "parceiro" in n:
        return "Parceiros e fornecedores"
    if "pedido" in n:
        return "Pedidos"
    if "orcamento" in n:
        return "Orçamentos"
    if "listagem" in n:
        return "Listagens"
    return "Outros relatórios"


def recursos(t):
    out = []
    secs = []
    for s in re.findall(r'id="([A-Z][A-Z_]+)"', t):
        if s in ("HEADER", "CUSTOMERDATA", "COMPANYDATA", "BODY", "PAYMENTTERMS", "PAYMENTENTRIES", "TOTALS", "FOOTER") and s not in secs:
            secs.append(s)
    if secs:
        out.append("Seções: " + ", ".join(secs))
    extra = sorted(set(re.findall(r"EXTRAINFORMATION\[@ID='([^']+)'", t)))
    if extra:
        out.append("Tabela de preço: " + ", ".join(extra))
    refs = sorted(set(re.findall(r"REFERENCES/(\w+)", t)) - {"COMPLETE", "REFERENCE"})
    if refs:
        out.append("Referências: " + ", ".join(refs[:12]) + (f" e mais {len(refs) - 12}" if len(refs) > 12 else ""))
    meta = sorted(set(re.findall(r"METADATA\[@ID='([^']+)'", t)) - {"INTEGRATIONDATA"})
    if meta:
        out.append("Metadados: " + ", ".join(meta))
    ext = sorted(set(re.findall(r"external\.(\w+)", t)))
    if ext:
        out.append("Recursos do Promob: " + ", ".join(ext))
    css = sorted(set(re.findall(r'href="[^"]*?([\w]+\.css)"', t, re.I)))
    if css:
        out.append("Estilo: " + ", ".join(css))
    return out


def catalogar(raiz):
    raiz = pathlib.Path(raiz)
    if not raiz.is_dir():
        return {"modelos": [], "assets": []}
    vistos, modelos, assets = {}, [], []
    for pacote in sorted(p for p in raiz.iterdir() if p.is_dir()):
        nome_pacote = re.sub(r"^\d+\s*", "", pacote.name)
        for f in sorted(pacote.iterdir(), key=lambda x: x.name.lower()):
            ext = f.suffix.lower()
            if ext == ".css":
                assets.append({"name": f.name, "path": "Budget/Layouts/Listing/" + f.name, "text": ler(f)})
                continue
            if ext not in (".xsl", ".xslt", ".xml"):
                continue
            texto = ler(f)
            h = hashlib.md5(norm(texto).encode()).hexdigest()
            base, idioma = base_e_idioma(f.name)
            if h in vistos:
                m = vistos[h]
                m["tambem"].append(f"{nome_pacote} / {f.name}")
                if idioma and idioma not in m["idiomas"]:
                    m["idiomas"].append(idioma)
                continue
            mm = re.search(r'<xsl:output[^>]*method="(\w+)"', texto)
            metodo = mm.group(1) if mm else ("config" if ext == ".xml" else "html")
            desc, alertas = DESCRICOES.get(base, (None, []))
            if desc is None:
                pm = re.match(r"^parceiro_(.+)$", base, re.I)
                desc = (f"Orçamento/pedido do parceiro {pm.group(1).replace('_', ' ')}." if pm else
                        {"xml": "Integração em XML.", "text": "Arquivo texto para ERP ou fábrica."}.get(metodo, "Relatório HTML."))
            m = {"id": h[:10], "name": f.name, "base": base, "pacote": nome_pacote, "cat": categoria(f.name, metodo, texto),
                 "tipo": {"html": "HTML", "xml": "XML", "text": "TXT", "config": "Config"}.get(metodo, metodo.upper()),
                 "idiomas": [idioma] if idioma else [], "desc": desc, "alertas": list(alertas), "recursos": recursos(texto),
                 "linhas": texto.count("\n") + 1, "tambem": [], "text": texto}
            vistos[h] = m
            modelos.append(m)
    return {"modelos": modelos, "assets": assets}


if __name__ == "__main__":
    r = catalogar(pathlib.Path(__file__).parent / "modelos")
    from collections import Counter
    print(len(r["modelos"]), "modelos distintos,", len(r["assets"]), "CSS")
    for c, n in Counter(m["cat"] for m in r["modelos"]).most_common():
        print(f"  {n:3d}  {c}")
