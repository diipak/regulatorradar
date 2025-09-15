# EmailJS Setup Guide

To enable email notifications in RegulatorRadar, you need to configure EmailJS. This is a free service that allows sending emails directly from the browser.

## Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create Email Service

1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

## Step 3: Create Email Template

1. Go to "Email Templates" in EmailJS dashboard
2. Click "Create New Template"
3. Use this template content:

```html
Subject: [RegulatorRadar] {{regulation_type}} Alert - Severity {{severity_score}}/10

Hello {{to_name}},

A new regulatory update has been detected that may affect your fintech operations:

**{{regulation_title}}**

**Severity:** {{severity_score}}/10 ({{regulation_type}})

**Summary:**
{{plain_english_summary}}

**Action Items:**
{{action_items}}

**Compliance Deadlines:**
{{compliance_deadlines}}

**View Full Document:** {{regulation_url}}

---
This is an automated alert from RegulatorRadar.
Unsubscribe: {{unsubscribe_url}}
```

4. Save the template and note down your **Template ID**

## Step 4: Get Public Key

1. Go to "Account" → "General"
2. Find your **Public Key**

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your EmailJS credentials:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Step 6: Test Email Functionality

1. Start your development server: `npm run dev`
2. Go to the Subscribe page
3. Enter your email address
4. Click "Subscribe to Alerts"
5. Check your email for the test message

## Troubleshooting

### Common Issues:

1. **"Email service not configured"**
   - Check that all environment variables are set correctly
   - Restart your development server after changing .env

2. **"Failed to send email"**
   - Verify your EmailJS service is active
   - Check that your email template variables match the code
   - Ensure your email service has proper authentication

3. **Emails not received**
   - Check spam/junk folder
   - Verify the email address is correct
   - Test with a different email provider

### EmailJS Free Tier Limits:

- 200 emails per month
- Perfect for demo and small-scale testing
- Upgrade to paid plan for production use

## Production Considerations

For production deployment:

1. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Consider upgrading to EmailJS paid plan for higher limits
3. Set up proper email templates with your branding
4. Test thoroughly with different email providers

## Alternative Email Services

If you prefer other services:

- **SendGrid**: More robust, requires backend
- **Mailgun**: Good for high volume
- **AWS SES**: Cost-effective for large scale
- **Resend**: Modern alternative with good developer experience

For hackathon purposes, EmailJS is the fastest to set up and requires no backend infrastructure.