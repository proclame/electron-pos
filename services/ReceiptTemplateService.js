class ReceiptTemplateService {
  generateReceiptHTML(sale, settings) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
            width: 100%;
            font-size: 12px;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            text-align: left;
            padding: 4px;
            font-size: 12px;
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
        }
        .logo {
            max-width: 80%;
            max-height: 100px;
            margin: 0 auto;
            display: block;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    ${
      settings.logo_base64
        ? `
        <img src="${settings.logo_base64}" class="logo" alt="Logo"/>
    `
        : ''
    }
    <div class="center bold">${settings.company_name}</div>
    ${
      settings.company_address
        ? `
        <div class="center">${settings.company_address.split('\n').join('<br/>')}</div>
    `
        : ''
    }
    ${
      settings.vat_number
        ? `
        <div class="center">VAT: ${settings.vat_number}</div>
    `
        : ''
    }
    <div class="divider"></div>
    <div>Receipt #: ${sale.id}</div>
    <div>Date: ${new Date().toLocaleString('nl-NL')}</div>
    <div class="divider"></div>
    <table>
        <tr>
            <th></th>
            <th>Item</th>
            <th>Price</th>
            <th></th>
            <th class="right">Total</th>
        </tr>
        ${sale.items
          .map(
            (item) => `
            <tr>
                <td>${item.quantity}&nbsp;x</td>
                <td>${item.product.name}</td>
                <td>${settings.currency_symbol}${item.product.unit_price.toFixed(2)}</td>
                <td>${item.discount_percentage || ''}${item.discount_percentage > 0 ? '%' : ''}</td>
                <td class="right">${settings.currency_symbol}${item.total.toFixed(2)}</td>
            </tr>
        `,
          )
          .join('')}
    </table>
    <div class="divider"></div>
    <div class="right">Subtotal: ${settings.currency_symbol}${sale.subtotal.toFixed(2)}</div>
    ${
      sale.discount_amount > 0
        ? `
        <div class="right">Discount: ${settings.currency_symbol}${sale.discount_amount.toFixed(2)}</div>
    `
        : ''
    }
    <div class="right bold">TOTAL: ${settings.currency_symbol}${sale.total.toFixed(2)}</div>
    ${
      settings.vat_percentage
        ? `
        <div class="right">Incl. VAT (${settings.vat_percentage}%): 
            ${settings.currency_symbol}${(sale.total * (parseFloat(settings.vat_percentage) / (100 + parseFloat(settings.vat_percentage)))).toFixed(2)}
        </div>
    `
        : ''
    }
    <div class="divider"></div>
    ${
      sale.notes
        ? `
        <div class="center">Notes: ${sale.notes}</div>
        <div class="divider"></div>
    `
        : ''
    }              
    <div class="center">${settings.thank_you_text.split('\n').join('<br/>')}<br>&nbsp;.</div>
</body>
</html>`;
  }
}

module.exports = new ReceiptTemplateService();
