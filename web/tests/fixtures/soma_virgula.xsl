<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html><body><table><tr id="TOTALS"><td>
      <xsl:variable name="valorTotal" select="sum(AMBIENTS/AMBIENT/CATEGORIES/CATEGORY/ITEMS/ITEM/PRICE/MARGINS/BUDGET/@TOTAL)" />
      <span id="soma"><xsl:value-of select="format-number($valorTotal, '###.##0,00', 'formato')" /></span>
    </td></tr></table></body></html>
  </xsl:template>
</xsl:stylesheet>
