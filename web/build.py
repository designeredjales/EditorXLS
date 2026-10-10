"""Gera o Editor XSL Promob em um único HTML.

Saídas em web/dist/:
  editor-xsl-promob.html  -> versão para publicar como Artifact (sem <html>/<head>)
  EditorXSL-Promob.html   -> versão para abrir direto no Chrome/Edge do computador
Os exemplos embutidos vêm de web/samples/ e, se existir, de web/private/ (fora do git).
Os modelos vêm de web/modelos/ (fora do git). Use --sem-modelos para gerar sem eles.
"""
import json, pathlib, sys

base = pathlib.Path(__file__).parent
src = (base / "src" / "app.html").read_text(encoding="utf-8")
samples = []
for folder in ("samples",):
    d = base / folder
    if d.is_dir():
        for f in sorted(d.iterdir()):
            if f.suffix.lower() in (".xsl", ".xslt", ".xml"):
                raw = f.read_bytes()
                try:
                    text = raw.decode("utf-8-sig")
                except UnicodeDecodeError:
                    text = raw.decode("cp1252")
                samples.append({"name": f.name, "text": text})
blob = json.dumps(samples, ensure_ascii=False).replace("</", "<\\/")
libs = []
libdir = base / "biblioteca"
if libdir.is_dir():
    for f in sorted(libdir.glob("*.json")):
        libs.append(json.loads(f.read_text(encoding="utf-8")))
libblob = json.dumps(libs, ensure_ascii=False).replace("</", "<\\/")
import catalogar_modelos
models = {"modelos": [], "assets": []} if "--sem-modelos" in sys.argv else catalogar_modelos.catalogar(base / "modelos")
# Dicionário pt -> es/en aprendido das versões de idioma do acervo (só pares que de fato mudam).
def aprender_dicionario(pasta):
    import re as _re, collections as _c, xml.etree.ElementTree as ET
    XSLT = "{http://www.w3.org/1999/XSL/Transform}"
    def textos(f):
        try: raiz = ET.parse(f).getroot()
        except Exception: return None
        est, txt = [], []
        for e in raiz.iter():
            est.append(e.tag)
            for t in (e.text, e.tail):
                if t and t.strip() and _re.search(r"[A-Za-zÀ-ú]", t): txt.append(" ".join(t.split()))
        return est, txt
    grupos = _c.defaultdict(dict)
    for f in pasta.glob("*/*.xsl"):
        m = _re.match(r"^(.*?)\.(pt-BR|pt|es|en)\.xsl$", f.name, _re.I)
        base, lang = (m.group(1), m.group(2).lower()[:2]) if m else (f.stem, "pt0")
        grupos[(f.parent.name, base.lower())][lang] = f
    pares = {"es": _c.defaultdict(_c.Counter), "en": _c.defaultdict(_c.Counter)}
    for g in grupos.values():
        src = g.get("pt") or g.get("pt0")
        A = src and textos(src)
        if not A: continue
        for lang in ("es", "en"):
            B = lang in g and textos(g[lang])
            if not B or A[0] != B[0] or len(A[1]) != len(B[1]): continue
            for a, b in zip(A[1], B[1]):
                if a != b and len(a) < 200: pares[lang][a][b] += 1
    return {lang: {a: c.most_common(1)[0][0] for a, c in d.items()} for lang, d in pares.items()}
if "--sem-modelos" not in sys.argv: models["dicionario"] = aprender_dicionario(base / "modelos")

# O acervo vai compactado (gzip + base64): cerca de 5 vezes menor. O navegador descompacta ao abrir.
import base64, gzip
modelblob = base64.b64encode(gzip.compress(json.dumps(models, ensure_ascii=False).encode("utf-8"), 9, mtime=0)).decode("ascii")
page = src.replace("__SAMPLES__", blob).replace("__LIBRARY__", libblob).replace("__MODELS__", modelblob)
out = base / "dist"
out.mkdir(exist_ok=True)
(out / "editor-xsl-promob.html").write_text(page, encoding="utf-8")
local = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
         '<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
         '</head>\n<body>\n' + page + '\n</body>\n</html>\n')
(out / "EditorXSL-Promob.html").write_text(local, encoding="utf-8")
print(f"{len(page.encode('utf-8')) / 1e6:.1f} MB · {len(models['modelos'])} modelos, {len(samples)} exemplos e {sum(len(l.get('itens', [])) for l in libs)} códigos de biblioteca embutidos -> {out}")
