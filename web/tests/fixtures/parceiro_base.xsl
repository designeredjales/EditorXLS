<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:decimal-format name="formato" decimal-separator="," grouping-separator="." />
  <xsl:output method="html" />
  <xsl:template match="LISTING">
    <html generator="ProMob.Cadastro">
      <head>
        <title>Parceiro Exemplo</title>
        <link href="%pastasistema%\Budget\Layouts\Listing\formatacao.css" rel="stylesheet" type="text/css" />
      </head>
      <body>
        <table align="center" border="0">
          <thead id="HEADER">
            <tr>
              <td width="1%"><img src="%pastasistema%/identity/parceiro_exemplo.png" width="100" height="100" /></td>
              <td valign="top">
                <table border="0" cellspacing="0" cellpadding="3" width="100%">
                  <tr>
                    <td style="FONT-FAMILY: Arial; COLOR: #556982; FONT-SIZE: 16px; FONT-WEIGHT: bold" colspan="2">Dados do parceiro</td>
                  </tr>
                  <tr>
                    <td style="COLOR: #535353" align="left">
                      <b>Nome: </b>Exemplo Ferragens
                    </td>
                  </tr>
                  <tr>
                    <td style="COLOR: #535353" align="left">
                      <b>Telefone: </b>(48) 3000-0000
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr id="CUSTOMERDATA"><td style="COLOR: #556982">Cliente: <xsl:value-of select="CUSTOMERSDATA/DATA[@ID='nomecliente']/@VALUE" /></td></tr>
            <tr id="TOTALS"><td><b>R$ </b><xsl:value-of select="format-number(translate(TOTALPRICES/MARGINS/BUDGET/@VALUE, ',', '.'), '###.##0,00', 'formato')" /></td></tr>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
