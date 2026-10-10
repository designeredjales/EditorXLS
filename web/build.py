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
