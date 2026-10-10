<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html><body><table><tr id="HEADER"><td>
      <img src="%pastasistema%/identity/logo.jpg" height="100" width="100" height="23" />
    </td></tr></table></body></html>
  </xsl:template>
</xsl:stylesheet>
