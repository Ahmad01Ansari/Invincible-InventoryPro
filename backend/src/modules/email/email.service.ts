import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Open source default testing Transport using the requested email as sender
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Typically Gmail for personal sender accounts
      port: 587,
      secure: false, 
      auth: {
        user: 'rjaahmad60@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password', 
      },
    });
  }

  async sendStaffInvitation(to: string, firstName: string, tempPassword: string, companyName: string) {
    const htmlSnippet = `
      <div style="font-family: Arial, sans-serif; max-w-xl mx-auto border p-6 rounded shadow">
        <h2 style="color: #4F46E5;">Welcome to ${companyName}!</h2>
        <p>Hi ${firstName},</p>
        <p>You have been invited to join the <strong>${companyName}</strong> workspace on the SaaS Inventory Platform.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login URL:</strong> <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 5px;">${tempPassword}</span></p>
        </div>
        <p style="color: #dc2626; font-size: 13px;"><em>Note: You will be forced to change this temporary password immediately upon your first login.</em></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">This is an automated system message. Please do not reply.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"SaaS Admin" <rjaahmad60@gmail.com>',
        to,
        subject: `Your Workspace Invitation for ${companyName}`,
        html: htmlSnippet,
      });
      this.logger.log(`Invitation email systematically sent to ${to}`);
    } catch (error) {
      this.logger.error(`Email dispatch failed to ${to}: ${error.message}`);
      // Fallback: Dump to console so the admin can at least see it during development
      console.log(`\n\n[DEV MODE - EMAIL SIMULATION]\nEmail to: ${to}\nTemp Password: ${tempPassword}\n\n`);
    }
  }
}
