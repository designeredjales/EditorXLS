<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html><body><table><tr id="BODY"><td>
      <xsl:for-each select="//ITEM">
        <xsl:variable name="porCaixa" select="number(translate(REFERENCES/BOXQUANTITY/@REFERENCE, ',', '.'))" />
        <xsl:if test="porCaixa = 0">-</xsl:if>
        <xsl:value-of select="ancestor::AMBIENT/@DESCRIPTION" />
        <xsl:value-of select="parent::node()/parent::node()/parent::node()/@DESCRIPTION" />
      </xsl:for-each>
    </td></tr></table></body></html>
  </xsl:template>
</xsl:stylesheet>
