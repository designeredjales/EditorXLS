<?xml version="1.0" encoding="utf-8"?>
<!-- Teste de compatibilidade de CSS do navegador interno do Promob.
     Coloque este arquivo na pasta de layouts do Promob, gere uma listagem/orçamento com ele
     e veja quais recursos aparecem como SIM (verde) ou NÃO (vermelho). -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html generator="ProMob.Cadastro">
      <head>
        <title>Teste de CSS do Promob</title>
        <style type="text/css">
          body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222222; margin: 16px; }
          h1 { font-size: 18px; color: #0e6e6a; margin: 0 0 4px 0; }
          table.t { border-collapse: collapse; width: 100%; margin-top: 10px; }
          table.t td, table.t th { border: 1px solid #c9d2d0; padding: 5px 8px; text-align: left; vertical-align: middle; }
          table.t th { background-color: #0e6e6a; color: #ffffff; }
          .no { color: #cc0000; font-weight: bold; }
          .yes { color: #1a7f2e; font-weight: bold; display: none; }
          /* 1. Bloco style: se este bloco funcionar, a linha 1 mostra SIM */
          .t1 .yes { display: inline; } .t1 .no { display: none; }
          /* 2. Seletor de filho :first-child (CSS2) */
          .t2 span:first-child { display: none; } .t2 span:first-child + span { display: inline; }
          /* 3. Seletor de atributo (CSS2) */
          .t3 span[title="x"] { display: inline; } .t3 span[title="n"] { display: none; }
          /* 4. :nth-child (CSS3) */
          .t4 span:nth-child(2) { display: inline; } .t4 span:nth-child(1) { display: none; }
          /* 5. Variáveis CSS: só aparece SIM se var() funcionar */
          .t5 { --mostra: inline; } .t5 .yes { display: var(--mostra); } .t5 .no { display: var(--esconde, none); }
          /* 6. @media print reconhecido */
          @media all { .t6 .yes { display: inline; } .t6 .no { display: none; } }
          /* Amostras visuais */
          .raio { border: 2px solid #0e6e6a; border-radius: 10px; padding: 6px; }
          .sombra { border: 1px solid #c9d2d0; box-shadow: 3px 3px 6px #888888; padding: 6px; }
          .rgba { background-color: #ffffff; background-color: rgba(14, 110, 106, 0.25); padding: 6px; }
          .flex { display: flex; } .flex div { border: 1px solid #0e6e6a; padding: 4px 8px; margin-right: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; } .grid div { border: 1px solid #0e6e6a; padding: 4px; }
          .calc { width: 100px; width: calc(50% - 10px); background-color: #d9ecea; padding: 4px; }
          .antes:before { content: "OK: "; color: #1a7f2e; font-weight: bold; }
          .quebra { page-break-before: always; }
        </style>
      </head>
      <body>
        <h1>Teste de CSS do navegador do Promob</h1>
        <div>Gerado em <xsl:value-of select="@DATE" /> às <xsl:value-of select="@HOUR" /> · Promob <xsl:value-of select="ABOUTPROMOB/@VERSION" />.<xsl:value-of select="ABOUTPROMOB/@REVISION" /> <xsl:value-of select="ABOUTPROMOB/@DISTRIBUTION" /></div>

        <table class="t">
          <tr><th width="45%">Recurso</th><th>Funciona?</th></tr>
          <tr><td>Estilo direto no elemento (style="...")</td><td><span style="color:#1a7f2e;font-weight:bold">SIM</span></td></tr>
          <tr><td>1. Bloco &lt;style&gt; no cabeçalho</td><td class="t1"><span class="no">NÃO</span><span class="yes">SIM</span></td></tr>
          <tr><td>2. Seletor :first-child (CSS2)</td><td class="t2"><span class="no">NÃO</span><span class="yes">SIM</span></td></tr>
          <tr><td>3. Seletor de atributo [title] (CSS2)</td><td class="t3"><span class="no" title="n">NÃO</span><span class="yes" title="x">SIM</span></td></tr>
          <tr><td>4. Seletor :nth-child (CSS3)</td><td class="t4"><span class="no">NÃO</span><span class="yes">SIM</span></td></tr>
          <tr><td>5. Variáveis CSS (var)</td><td class="t5"><span class="no">NÃO</span><span class="yes">SIM</span></td></tr>
          <tr><td>6. Regras @media</td><td class="t6"><span class="no">NÃO</span><span class="yes">SIM</span></td></tr>
        </table>

        <table class="t">
          <tr><th width="45%">Amostra visual</th><th>Como deve aparecer</th></tr>
          <tr><td><div class="raio">Cantos arredondados</div></td><td>Moldura com cantos curvos (se ficar reta, não suporta)</td></tr>
          <tr><td><div class="sombra">Sombra</div></td><td>Sombra cinza embaixo e à direita</td></tr>
          <tr><td><div class="rgba">Cor transparente</div></td><td>Fundo verde-claro (se ficar branco, não suporta)</td></tr>
          <tr><td><div class="flex"><div>A</div><div>B</div><div>C</div></div></td><td>A, B e C lado a lado (se empilhar, não suporta flexbox)</td></tr>
          <tr><td><div class="grid"><div>1</div><div>2</div><div>3</div></div></td><td>1, 2 e 3 em três colunas (se empilhar, não suporta grid)</td></tr>
          <tr><td><div class="calc">Largura calculada</div></td><td>Faixa com metade da largura da célula (se ficar estreita, não suporta calc)</td></tr>
          <tr><td><div class="antes">texto gerado pelo CSS</div></td><td>Deve começar com "OK:" em verde</td></tr>
        </table>

        <table class="t">
          <tr><th width="45%">Motor do navegador (precisa de JavaScript ligado)</th><th>Resultado</th></tr>
          <tr><td>Identificação do navegador</td><td id="ua">JavaScript desligado</td></tr>
          <tr><td>Modo do documento</td><td id="modo">—</td></tr>
          <tr><td>Recursos detectados</td><td id="recursos">—</td></tr>
        </table>
        <script type="text/javascript">
          var d = document, st = d.createElement('div').style;
          function sn(v) { return v ? 'SIM' : 'NÃO'; }
          d.getElementById('ua').innerHTML = navigator.userAgent;
          d.getElementById('modo').innerHTML = (d.documentMode ? 'Internet Explorer, modo ' + d.documentMode + ' · ' : '') + (d.compatMode == 'BackCompat' ? 'modo de compatibilidade (quirks)' : 'modo padrão');
          d.getElementById('recursos').innerHTML =
            'Flexbox: ' + sn('flexBasis' in st || 'msFlexAlign' in st) +
            ' · Grid: ' + sn('gridTemplateColumns' in st) +
            ' · Cantos arredondados: ' + sn('borderRadius' in st) +
            ' · Sombra: ' + sn('boxShadow' in st) +
            ' · Transparência: ' + sn('opacity' in st);
        </script>
        <p style="color:#666666;margin-top:12px">Tire um print desta tela e envie para ajustar o editor ao motor do seu Promob.</p>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
