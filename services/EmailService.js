const nodemailer = require('nodemailer');
const { settingsRepo } = require('../models/database');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = null;
  }

  async init() {
    this.settings = await settingsRepo.getAll();

    if (this.settings.enable_email !== 'true' || !this.settings.smtp_host) {
      console.log('Email settings not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.settings.smtp_host,
      port: this.settings.smtp_port,
      secure: this.settings.smtp_secure === 'true',
      auth: {
        user: this.settings.smtp_user,
        pass: this.settings.smtp_pass || 'password',
      },
    });
  }

  async sendReceipt(sale, emailAddress) {
    if (!this.transporter) {
      await this.init();
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const receiptHtml = this.generateReceiptHTML(sale);

    const info = await this.transporter.sendMail({
      from: this.settings.smtp_from,
      to: emailAddress,
      subject: `Receipt #${sale.id} from ${this.settings.company_name}`,
      text: `Receipt #${sale.id} from ${this.settings.company_name}`,
      html: receiptHtml,
    });

    console.log('Message sent: %s', info.messageId);
  }

  generateReceiptHTML(sale) {
    // Similar to PrinterService's generateReceiptHTML
    return `
      <html>
        <body>
          <h1>${this.settings.company_name}</h1>
          <p>${this.settings.company_address}</p>
          <hr>
          ${sale.items
            .map(
              (item) => `
            <div>
              ${item.product.name} x ${item.quantity}
              €${(item.product.unit_price * item.quantity).toFixed(2)}
            </div>
          `,
            )
            .join('')}
          <hr>
          <h3>Total: €${sale.total.toFixed(2)}</h3>
          <p>${this.settings.thank_you_text}</p>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
