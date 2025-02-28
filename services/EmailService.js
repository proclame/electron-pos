const nodemailer = require('nodemailer');
const { settingsRepo } = require('../models/database');
const PDFService = require('./PDFService');
const receiptTemplate = require('./ReceiptTemplateService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = null;
  }

  async init() {
    this.settings = await settingsRepo.getAll();

    if (this.settings.enable_email !== 'true' || !this.settings.smtp_host) {
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

    const receiptHtml = receiptTemplate.generateReceiptHTML(sale, this.settings);
    const pdfBuffer = await PDFService.generateReceiptBuffer(sale);

    const info = await this.transporter.sendMail({
      from: this.settings.smtp_from,
      to: emailAddress,
      subject: `Receipt #${sale.id} from ${this.settings.company_name}`,
      text: `Receipt #${sale.id} from ${this.settings.company_name}`,
      html: receiptHtml,
      attachments: [
        {
          filename: `receipt-${sale.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}

module.exports = new EmailService();
