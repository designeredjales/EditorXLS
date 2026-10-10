<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html>
      <head><title>Parceiro Teste</title></head>
      <body>
        <table align="center" border="0">
          <xsl:call-template name="GerarCabecalho" />
          <xsl:call-template name="GerarCorpo" />
        </table>
      </body>
    </html>
  </xsl:template>
  <xsl:template name="GerarCabecalho">
    <thead><tr><td><b>Dados do Parceiro</b> Parceiro Teste Ltda</td></tr></thead>
  </xsl:template>
  <xsl:template name="GerarCorpo">
    <tbody>
      <tr><td><xsl:call-template name="GerarDadosCliente" /></td></tr>
      <tr><td><xsl:call-template name="GerarItens" /></td></tr>
    </tbody>
  </xsl:template>
  <xsl:template name="GerarDadosCliente">
    <table>
      <tr><td><b>Nome:</b> <xsl:value-of select="CUSTOMERSDATA/DATA[@ID='nomecliente']/@VALUE" /></td></tr>
      <tr><td><b>CPF:</b> <xsl:value-of select="CUSTOMERSDATA/DATA[@ID='cpfcnpj']/@VALUE" /></td></tr>
    </table>
  </xsl:template>
  <xsl:template name="GerarItens">
    <table>
      <xsl:for-each select="AMBIENTS/AMBIENT/CATEGORIES/CATEGORY/ITEMS/ITEM">
        <xsl:variable name="valorPreco" select="translate(PRICE/MARGINS/BUDGET/@TOTAL, ',', '.')" />
        <tr><td><xsl:value-of select="@DESCRIPTION" /></td><td><xsl:value-of select="format-number($valorPreco, '###.##0,00', 'formato')" /></td></tr>
      </xsl:for-each>
    </table>
  </xsl:template>
</xsl:stylesheet>
