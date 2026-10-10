<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html><body><table><tr id="HEADER">
      <td width="1%">
        <img src="%pastasistema%/identity/logo.png" width="100" />
        </img>
      </td>
    </tr></table></body></html>
  </xsl:template>
</xsl:stylesheet>
