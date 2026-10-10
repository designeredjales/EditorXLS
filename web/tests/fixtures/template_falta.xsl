<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:key name="porCodigo" match="ITEM" use="@REFERENCE" />
  <xsl:template match="LISTING">
    <html><body><table><tr id="BODY"><td>
      <xsl:call-template name="GerarItens" />
      <xsl:for-each select="//ITEM[count(. | key('iguais', @REFERENCE)[1]) = 1]"><xsl:value-of select="@REFERENCE" /></xsl:for-each>
      <xsl:value-of select="format-number(1, '#.##0,00', 'br')" />
      <xsl:value-of select="$naoDeclarada" />
    </td></tr></table></body></html>
  </xsl:template>
</xsl:stylesheet>
