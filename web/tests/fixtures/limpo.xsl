<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html generator="ProMob.Cadastro">
      <head><title>Limpo</title></head>
      <body>
        <table>
          <thead id="HEADER"><tr><td>Orçamento <xsl:value-of select="@DATE" /></td></tr></thead>
          <tbody>
            <tr id="CUSTOMERDATA"><td><xsl:value-of select="CUSTOMERSDATA/DATA[@ID='nomecliente']/@VALUE" /></td></tr>
            <tr id="TOTALS"><td><xsl:value-of select="format-number(translate(TOTALPRICES/MARGINS/BUDGET/@VALUE, ',', '.'), '###.##0,00', 'formato')" /></td></tr>
          </tbody>
          <tfoot id="FOOTER"><tr><td>Rodapé</td></tr></tfoot>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
