import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Initialize Resend with the API key from environment variables
    const apiKey = process.env.RESEND_API_KEY || 're_123456789';
    this.resend = new Resend(apiKey);
  }

  async sendStaffInvitation(to: string, firstName: string, tempPassword: string, companyName: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Note: Resend Free Tier requires sending from onboarding@resend.dev unless a domain is verified
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const htmlSnippet = `
      <div style="font-family: Arial, sans-serif; max-w-xl mx-auto border p-6 rounded shadow">
        <h2 style="color: #4F46E5;">Welcome to ${companyName}!</h2>
        <p>Hi ${firstName},</p>
        <p>You have been invited to join the <strong>${companyName}</strong> workspace on the SaaS Inventory Platform.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login URL:</strong> <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 5px;">${tempPassword}</span></p>
        </div>
        <p style="color: #dc2626; font-size: 13px;"><em>Note: You will be forced to change this temporary password immediately upon your first login.</em></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">This is an automated system message. Please do not reply.</p>
      </div>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `InventoryPro <${fromEmail}>`,
        to: [to],
        subject: `Your Workspace Invitation for ${companyName}`,
        html: htmlSnippet,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Invitation email systematically sent to ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Resend API dispatch failed to ${to}: ${error.message}`);
      // Fallback: Dump to console so the admin can at least see it during development
      console.log(`\n\n[RESEND FALLBACK - EMAIL SIMULATION]\nEmail to: ${to}\nTemp Password: ${tempPassword}\n\n`);
    }
  }
}
