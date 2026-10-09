<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:for-each select="recents/item">
      <xsl:sort select="@date" order="descending"/>
      <xsl:sort select="@name" order="ascending"/>
      <li><xsl:value-of select="@name"/></li>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
