// Testes do Editor XSL Promob.
// Uso: python3 web/build.py && cd web/tests && npm ci && node run.js
// Navegador: usa o Chromium do Playwright; para apontar outro, defina PW_CHROMIUM=/caminho/do/chrome.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

const WEB = path.resolve(__dirname, "..");
const DIST = path.join(WEB, "dist", "EditorXSL-Promob.html");
const FIX = path.join(__dirname, "fixtures");
const SAMPLE = fs.readFileSync(path.join(WEB, "samples", "Orcamento_Exemplo.xml"), "utf8");
const fx = n => fs.readFileSync(path.join(FIX, n), "utf8");

const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ ok: true, name }); console.log("  ok      " + name); }
  catch (e) { results.push({ ok: false, name, msg: e.message }); console.log("  FALHOU  " + name + "\n          " + e.message.split("\n").join("\n          ")); }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const codes = list => [...new Set(list.filter(f => f.sev !== "info").map(f => f.code))].sort();

function chromiumPath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const local = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
  return fs.existsSync(local) ? local : undefined;
}

(async () => {
  if (!fs.existsSync(DIST)) { console.error("Rode antes: python3 web/build.py"); process.exit(2); }
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message));
  // Sem depender da internet: CodeMirror do node_modules e sem fontes externas.
  const cmDir = path.join(__dirname, "node_modules", "codemirror");
  if (fs.existsSync(cmDir)) await page.route("https://cdnjs.cloudflare.com/**", r => r.fulfill({ path: path.join(cmDir, r.request().url().endsWith("xml.min.js") ? "mode/xml/xml.js" : "lib/codemirror.js"), contentType: "application/javascript" }));
  await page.route("https://fonts.**", r => r.abort());
  await page.goto("file://" + DIST);
  await page.waitForFunction(() => window.EditorXSL && document.querySelector("#mdSummary").textContent.length > 0);

  // Funções executadas dentro da página.
  const audit = (text, name, names) => page.evaluate(([t, n, ns]) => window.EditorXSL.audit(t, n, ns ? { names: new Set(ns), where: "no teste" } : {}).map(f => ({ sev: f.sev, code: f.code, title: f.title, fix: !!f.fix, line: f.line })), [text, name, names]);
  const fixAll = (text, name) => page.evaluate(([t, n]) => window.EditorXSL.applyFixes(t, n, {}), [text, name]);
  const transform = (xsl, xml) => page.evaluate(([a, b]) => {
    const p = new DOMParser(), d = p.parseFromString(a, "application/xml");
    if (d.getElementsByTagName("parsererror")[0]) return { error: "XSL inválido" };
    const pr = new XSLTProcessor(); pr.importStylesheet(d);
    const out = pr.transformToDocument(p.parseFromString(b, "application/xml"));
    return out && out.documentElement ? { html: out.documentElement.outerHTML, text: out.documentElement.textContent } : { error: "não renderizou" };
  }, [xsl, xml]);
  const build = (xsl, name) => page.evaluate(([t, n]) => { const E = window.EditorXSL; const r = E.interpretXsl(t, n); return { types: r.model.blocks.map(b => b.type), pv: E.generate(r.model, true), full: E.generate(r.model, false) }; }, [xsl, name]);

  console.log("\nPágina");
  await test("abre sem erro de script e com as 9 abas", async () => {
    assert(!pageErrors.length, "Erros: " + pageErrors.join(" | "));
    const n = await page.$$eval(".tab", a => a.length); assert(n === 9, `abas: ${n}`);
  });
  await test("todos os códigos da biblioteca são XML válido", async () => {
    const bad = await page.evaluate(() => {
      const libs = JSON.parse(document.getElementById("library").textContent).flatMap(l => l.itens.map(i => ({ t: i.t, c: i.c })));
      const all = libs.concat(window.EditorXSL.builtin().map(i => ({ t: i.t, c: i.c })));
      return { n: all.length, bad: all.filter(s => new DOMParser().parseFromString(/^\s*<\?xml/.test(s.c) ? s.c : `<r xmlns:xsl="http://www.w3.org/1999/XSL/Transform">${s.c}</r>`, "application/xml").getElementsByTagName("parsererror")[0]).map(s => s.t) };
    });
    assert(bad.n > 50 && !bad.bad.length, `${bad.n} códigos; inválidos: ${bad.bad.join(", ")}`);
  });

  console.log("\nAuditoria");
  await test("layout limpo não tem erro nem alerta", async () => { const c = codes(await audit(fx("limpo.xsl"), "limpo.xsl")); assert(!c.length, c.join(",")); });
  for (const [file, expect] of [["atributo_repetido.xsl", ["xml"]], ["img_sobrando.xsl", ["xml"]]]) {
    await test(`${file}: acusa erro de estrutura e a correção deixa o arquivo válido`, async () => {
      const c = codes(await audit(fx(file), file)); assert(JSON.stringify(c) === JSON.stringify(expect), `achou ${c}`);
      const r = await fixAll(fx(file), file); const after = codes(await audit(r.text, file));
      assert(!after.length && r.applied.length === 1, `depois: ${after} · aplicadas: ${r.applied}`);
      assert(!(await transform(r.text, SAMPLE)).error, "não renderiza depois da correção");
    });
  }
  await test("template_falta.xsl: template, chave, formato e variável que faltam", async () => {
    const c = codes(await audit(fx("template_falta.xsl"), "t.xsl"));
    for (const k of ["tpl-falta", "key-falta", "formato-falta", "var-falta"]) assert(c.includes(k), `faltou ${k} em ${c}`);
    const r = await fixAll(fx("template_falta.xsl"), "t.xsl"), after = codes(await audit(r.text, "t.xsl"));
    assert(!after.includes("formato-falta") && after.includes("tpl-falta"), `depois: ${after}`);
  });
  await test("soma_virgula.xsl: sum() dá NaN com vírgula e SomarDecimal corrige", async () => {
    assert(codes(await audit(fx("soma_virgula.xsl"), "s.xsl")).includes("sum-virgula"), "não acusou sum()");
    const esperado = await page.evaluate(x => { const d = new DOMParser().parseFromString(x, "application/xml"); let s = 0; d.querySelectorAll("LISTING > AMBIENTS > AMBIENT > CATEGORIES > CATEGORY > ITEMS > ITEM > PRICE > MARGINS > BUDGET").forEach(b => { s += +b.getAttribute("TOTAL").replace(",", "."); }); return s.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, SAMPLE);
    const antes = await transform(fx("soma_virgula.xsl"), SAMPLE);
    const r = await fixAll(fx("soma_virgula.xsl"), "s.xsl"), depois = await transform(r.text, SAMPLE);
    assert(/NaN/.test(antes.text), "o original deveria dar NaN com vírgula: " + antes.text.trim());
    assert(depois.text.trim() === esperado, `esperado ${esperado}, veio ${depois.text && depois.text.trim()}`);
    const ponto = SAMPLE.replace(/((?:TOTAL|VALUE)=")(\d+),(\d+)"/g, "$1$2.$3\"");
    assert((await transform(r.text, ponto)).text.trim() === esperado, "com ponto decimal o total mudou");
    assert(!codes(await audit(r.text, "s.xsl")).includes("sum-virgula"), "o alerta continuou");
  });
  await test("teste_sem_cifrao.xsl: teste sem $ e parent::node() fixo", async () => {
    const c = codes(await audit(fx("teste_sem_cifrao.xsl"), "v.xsl"));
    assert(c.includes("var-sem-cifrao") && c.includes("parent-fixo"), `achou ${c}`);
    const r = await fixAll(fx("teste_sem_cifrao.xsl"), "v.xsl");
    assert(/test="\$porCaixa = 0"/.test(r.text), "não trocou por $porCaixa");
  });
  await test("sendTo.xml: acusa só o layout que não está na pasta", async () => {
    const l = await audit(fx("sendTo.xml"), "sendTo.xml", ["limpo.xsl", "sendto.xml"]);
    assert(l.length === 1 && l[0].code === "arquivo-falta" && /Fabrica\.xsl/.test(l[0].title), JSON.stringify(l));
  });

  console.log("\nConstrutor visual");
  await test("interpreta layout com seções e mostra o cliente", async () => {
    const b = await build(fx("limpo.xsl"), "limpo.xsl");
    for (const t of ["header", "customer", "total", "footer"]) assert(b.types.includes(t), `faltou bloco ${t}: ${b.types}`);
    const o = await transform(b.pv, SAMPLE); assert(!o.error && /Mariana/.test(o.text), o.error || "cliente não aparece");
  });
  await test("interpreta layout sem seções pelos templates (parceiros)", async () => {
    const b = await build(fx("sem_secoes.xsl"), "sem_secoes.xsl");
    assert(b.types.includes("customer") && b.types.includes("code"), `blocos: ${b.types}`);
    const o = await transform(b.pv, SAMPLE);
    assert(!o.error && /Dados do Parceiro/.test(o.text) && /Mariana/.test(o.text) && /\d,\d\d/.test(o.text), o.error || o.text.slice(0, 200));
  });
  await test("layout gerado reabre no construtor igual", async () => {
    const b = await build(fx("limpo.xsl"), "limpo.xsl"), again = await build(b.full, "x.xsl");
    assert(JSON.stringify(again.types) === JSON.stringify(b.types), `${again.types} ≠ ${b.types}`);
  });
  await test("exemplo de compatibilidade CSS abre e renderiza", async () => {
    const t = fs.readFileSync(path.join(WEB, "samples", "Teste_Compatibilidade_CSS.xsl"), "utf8");
    const o = await transform((await build(t, "css.xsl")).pv, SAMPLE); assert(!o.error, o.error);
  });

  console.log("\nGerador de parceiros");
  await test("lê a ficha do parceiro (dados, logo, cor, CSS, moeda)", async () => {
    const i = await page.evaluate(t => { const { _rows, _logo, _ti, ...f } = window.EditorXSL.partnerInfo(t); return f; }, fx("parceiro_base.xsl"));
    assert(i.titulo === "Parceiro Exemplo" && i.logo.endsWith("parceiro_exemplo.png") && i.largura === "100" && i.cor === "#556982" && i.moeda === "R$" && /formatacao\.css$/.test(i.css), JSON.stringify(i));
    assert(JSON.stringify(i.campos) === JSON.stringify([{ label: "Nome", value: "Exemplo Ferragens" }, { label: "Telefone", value: "(48) 3000-0000" }]), JSON.stringify(i.campos));
  });
  await test("regerar com a própria ficha não muda nada", async () => {
    const d = await page.evaluate(t => { const E = window.EditorXSL, { _rows, _logo, _ti, ...f } = E.partnerInfo(t); return E.canonDist(E.partnerApply(t, f), t); }, fx("parceiro_base.xsl"));
    assert(d === 0, `${d} diferença(s)`);
  });
  await test("gera parceiro novo com outros dados, cor e logo", async () => {
    const g = await page.evaluate(t => window.EditorXSL.partnerApply(t, { titulo: "Parceiro Diâmetro", logo: "%pastasistema%/identity/diametro.png", largura: "120", altura: "40", cor: "#0e6e6a", css: "", moeda: "R$",
      campos: [{ label: "Nome", value: "Diâmetro & Cia <Design>" }, { label: "E-mail", value: "contato@diametro.com.br" }, { label: "Site", value: "diametro.com.br" }] }), fx("parceiro_base.xsl"));
    const o = await transform(g, SAMPLE);
    assert(!o.error, o.error);
    assert(o.text.includes("Diâmetro & Cia <Design>") && o.text.includes("contato@diametro.com.br") && /Mariana/.test(o.text), o.text.slice(0, 300));
    assert(/diametro\.png" width="120" height="40"/.test(g) && !/#556982/i.test(g) && /#0e6e6a/.test(g) && !/Exemplo Ferragens/.test(g), "logo, cor ou dados antigos não foram trocados");
    assert(!codes(await audit(g, "Parceiro_Diametro.xsl")).length, "o gerado tem problema na auditoria");
  });

  console.log("\nInterface");
  await test("arquivo com erro: status, Saúde do arquivo e trava do Salvar", async () => {
    await page.setInputFiles("#inFiles", path.join(FIX, "template_falta.xsl")); await page.waitForTimeout(500);
    const st = await page.textContent("#edStatus"); assert(/erro/.test(st), "status: " + st);
    assert(await page.$(".health .fnd.erro"), "sem bloco de saúde");
    await page.click("#btnSave"); await page.waitForTimeout(200);
    assert((await page.textContent("#btnSave")) === "Salvar assim mesmo", "o Salvar não pediu confirmação");
  });
  await test("correção pelo painel deixa o arquivo válido e guarda a versão anterior", async () => {
    await page.setInputFiles("#inFiles", path.join(FIX, "atributo_repetido.xsl")); await page.waitForTimeout(500);
    await page.click(".health [data-hfix]"); await page.waitForTimeout(400);
    assert(/válido/.test(await page.textContent("#edStatus")), await page.textContent("#edStatus"));
    await page.click("#btnHist"); await page.waitForTimeout(300);
    const insp = await page.textContent("#inspect");
    assert(insp.includes("antes da correção automática") || insp.includes("Original (ao abrir)"), "sem versão anterior no Histórico: " + insp.replace(/\s+/g, " ").slice(0, 300));
    await page.click("#btnHist");
  });
  await test("aba Auditoria lista os arquivos abertos", async () => {
    await page.click('[data-tab="audit"]'); await page.selectOption("#auScope", "files"); await page.waitForTimeout(500);
    const s = await page.textContent("#auSummary"); assert(/com erro/.test(s), s);
    assert((await page.$$(".aurow")).length >= 1, "nenhuma linha");
  });

  // Acervo completo: só quando a pasta web/modelos existe (fica fora do git).
  const nModels = await page.evaluate(() => window.EditorXSL.models().length);
  if (nModels) {
    console.log(`\nAcervo (${nModels} modelos)`);
    await test("aba Parceiros importa o acervo e gera os marcados num .zip", async () => {
      await page.evaluate(() => localStorage.removeItem("exsl.parceiros"));
      await page.click('[data-tab="partners"]'); await page.click("#pgImport"); await page.waitForFunction(() => /parceiros importados/.test(document.querySelector("#toast").textContent), null, { timeout: 15000 });
      const n = await page.$$eval(".pgt tbody tr", a => a.length), pad = await page.$$eval(".pgt .sevc", a => a.filter(x => x.textContent === "Padrão").length);
      assert(n > 50 && pad > 20, `${n} parceiros, ${pad} padrão`);
      const [d] = await Promise.all([page.waitForEvent("download"), page.click("#pgGenAll")]);
      assert(d.suggestedFilename() === "parceiros_gerados.zip", d.suggestedFilename());
      await page.evaluate(() => localStorage.removeItem("exsl.parceiros"));
    });
    await test("todo modelo de relatório sem erro de auditoria abre e renderiza no construtor", async () => {
      const r = await page.evaluate(xml => {
        const E = window.EditorXSL, xd = new DOMParser().parseFromString(xml, "application/xml"), falhas = [];
        let n = 0;
        for (const m of E.models()) {
          if (!/\.xslt?$/i.test(m.name) || /method\s*=\s*["'](text|xml)["']/.test(m.text)) continue;
          if (E.audit(m.text, m.name, {}).some(f => f.sev === "erro" && f.code === "xml")) continue;
          n++;
          try {
            const g = E.generate(E.interpretXsl(m.text, m.name).model, true), d = new DOMParser().parseFromString(g, "application/xml");
            const p = new XSLTProcessor(); p.importStylesheet(d); const o = p.transformToDocument(xd);
            if (!o || !o.documentElement) falhas.push(m.pacote + "/" + m.name);
          } catch (e) { falhas.push(m.pacote + "/" + m.name + ": " + e.message.slice(0, 60)); }
        }
        return { n, falhas };
      }, SAMPLE);
      assert(r.n > 100 && !r.falhas.length, `${r.n} testados; falharam: ${r.falhas.join(" | ")}`);
    });
    await test("auditoria do acervo roda em menos de 5 s", async () => {
      const ms = await page.evaluate(() => { const t = performance.now(); window.EditorXSL.models().forEach(m => window.EditorXSL.audit(m.text, m.name, {})); return performance.now() - t; });
      assert(ms < 5000, `${Math.round(ms)} ms`);
    });
  } else console.log("\nAcervo: nenhum modelo embutido nesta versão (a pasta web/modelos fica fora do git); testes do acervo pulados.");

  await test("nenhum erro de script durante os testes", async () => assert(!pageErrors.length, pageErrors.join(" | ")));
  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length} de ${results.length} testes passaram.`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
