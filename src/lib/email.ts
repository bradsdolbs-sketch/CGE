import nodemailer from 'nodemailer'
import type { Viewing, Property, MaintenanceRequest, MaintenanceUpdate, RentPayment, Tenancy, ComplianceItem } from '@prisma/client'

// ─── Transport ───────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ─── Shared Brand Styles ──────────────────────────────────────────────────────

const brandStyles = `
  body { margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f2ee; color: #1a1a1a; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: #1a1a1a; padding: 24px 32px; }
  .header-logo { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; text-decoration: none; }
  .header-accent { display: block; width: 32px; height: 3px; background: #1A3D2B; margin-top: 8px; }
  .body { padding: 32px; }
  .footer { background: #1a1a1a; padding: 24px 32px; color: #a8a8a8; font-size: 12px; line-height: 1.5; }
  .footer a { color: #1A3D2B; text-decoration: none; }
  h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
  h2 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 24px 0 8px; }
  p { font-size: 15px; line-height: 1.6; color: #404040; margin: 0 0 16px; }
  .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f5f2ee; font-size: 14px; }
  .detail-label { color: #737373; width: 140px; flex-shrink: 0; }
  .detail-value { color: #1a1a1a; font-weight: 500; }
  .btn { display: inline-block; background: #1A3D2B; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .alert-box { background: #F0EBE0; border-left: 4px solid #1A3D2B; padding: 16px; border-radius: 0 6px 6px 0; margin: 16px 0; }
`

function wrapEmail(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Central Gate Estates</title>
  <style>${brandStyles}</style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#f5f2ee;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <span class="header-logo">Central Gate Estates</span>
      <span class="header-accent"></span>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="color:#a8a8a8;margin:0 0 8px;">Central Gate Estates Ltd &mdash; East London Living, Done Right</p>
      <p style="color:#a8a8a8;margin:0 0 4px;">Registered in England &amp; Wales &bull; ARLA Propertymark &bull; TDS Member &bull; ICO Registered</p>
      <p style="color:#a8a8a8;margin:0;">
        <a href="mailto:hello@centralgateestates.com">hello@centralgateestates.com</a> &bull;
        <a href="https://wa.link/gy7gtr">WhatsApp us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// ─── Core send function ───────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: `"Central Gate Estates" <${process.env.SMTP_FROM ?? 'noreply@centralgateestates.com'}>`,
    to,
    subject,
    html,
    text: text ?? stripHtml(html),
    ...(replyTo ? { replyTo } : {}),
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const html = wrapEmail(`
    <h1>Reset your password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your Central Gate Estates account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="font-size:13px;color:#737373;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <p style="font-size:13px;color:#737373;">Or copy this link: ${resetUrl}</p>
  `, 'Reset your CGE portal password')

  await sendEmail({ to, subject: 'Reset your Central Gate Estates password', html })
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: 'LANDLORD' | 'TENANT',
  portalUrl: string,
  tempPassword: string,
): Promise<void> {
  const roleLabel = role === 'LANDLORD' ? 'landlord' : 'tenant'
  const html = wrapEmail(`
    <h1>Welcome to Central Gate Estates</h1>
    <p>Hi ${name},</p>
    <p>Your ${roleLabel} portal account is ready. You can log in using the details below.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Portal</span><span class="detail-value"><a href="${portalUrl}">${portalUrl}</a></span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${to}</span></div>
      <div class="detail-row"><span class="detail-label">Temporary password</span><span class="detail-value">${tempPassword}</span></div>
    </div>
    <p>Please log in and change your password as soon as possible.</p>
    <p style="margin:24px 0;">
      <a href="${portalUrl}" class="btn">Go to your portal →</a>
    </p>
    <p style="font-size:13px;color:#737373;">Questions? WhatsApp us at <a href="https://wa.link/gy7gtr">wa.link/gy7gtr</a></p>
  `, 'Your CGE portal is ready')

  await sendEmail({ to, subject: 'Your Central Gate Estates portal access', html })
}

// ─── Viewing Confirmation ─────────────────────────────────────────────────────

export async function sendViewingConfirmation(
  viewing: Viewing,
  property: Property
): Promise<void> {
  const content = `
    <h1>Viewing Confirmed</h1>
    <p>Hi ${viewing.firstName},</p>
    <p>Your viewing has been confirmed. We look forward to showing you around.</p>

    <h2>Viewing Details</h2>
    <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${property.addressLine1}, ${property.area}, ${property.postcode}</span></div>
    <div class="detail-row"><span class="detail-label">Date &amp; Time</span><span class="detail-value">${formatDateTime(viewing.scheduledAt)}</span></div>
    <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${viewing.duration} minutes</span></div>

    <p style="margin-top:24px;">Please arrive a few minutes early. If you need to reschedule, call us on <strong>WhatsApp us</strong> or WhatsApp Bradley on <a href="https://wa.link/0nr9sr">07700 900001</a>.</p>

    <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.addressLine1}, ${property.postcode}`)}">Get Directions</a>

    <div class="alert-box">
      <p style="margin:0;font-size:14px;"><strong>What to bring:</strong> Valid photo ID. We conduct right-to-rent checks as part of the application process.</p>
    </div>
  `

  await sendEmail({
    to: `${viewing.firstName} ${viewing.lastName} <${viewing.email}>`,
    subject: `Viewing confirmed — ${property.addressLine1}, ${property.area}`,
    html: wrapEmail(content, `Your viewing is confirmed for ${formatDateTime(viewing.scheduledAt)}`),
  })
}

// ─── Maintenance Update ───────────────────────────────────────────────────────

export async function sendMaintenanceUpdate(
  request: MaintenanceRequest,
  update: MaintenanceUpdate,
  recipientEmail: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    NEW: 'New',
    ASSIGNED: 'Contractor Assigned',
    IN_PROGRESS: 'In Progress',
    AWAITING_PARTS: 'Awaiting Parts',
    AWAITING_APPROVAL: 'Awaiting Approval',
    COMPLETED: 'Completed',
    INVOICED: 'Invoiced',
    CANCELLED: 'Cancelled',
  }

  const statusColors: Record<string, string> = {
    NEW: '#e3f0ff',
    ASSIGNED: '#fff3cd',
    IN_PROGRESS: '#fff3cd',
    AWAITING_PARTS: '#F0EBE0',
    AWAITING_APPROVAL: '#F0EBE0',
    COMPLETED: '#d4edda',
    INVOICED: '#d1ecf1',
    CANCELLED: '#f5f5f5',
  }

  const content = `
    <h1>Maintenance Update</h1>
    <p>An update has been posted on your maintenance job.</p>

    <h2>Job Details</h2>
    <div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value">#${request.id.slice(-8).toUpperCase()}</span></div>
    <div class="detail-row"><span class="detail-label">Issue</span><span class="detail-value">${request.title}</span></div>
    <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${request.category.replace('_', ' ')}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge" style="background:${statusColors[update.status] ?? '#f5f5f5'}">${statusLabels[update.status] ?? update.status}</span></span></div>

    <h2>Update</h2>
    <div class="alert-box">
      <p style="margin:0;">${update.note}</p>
    </div>

    ${update.photos.length > 0 ? `<p style="font-size:13px;color:#737373;">${update.photos.length} photo(s) attached to this update — view them in your portal.</p>` : ''}

    <p>If you have any questions, please don't hesitate to get in touch.</p>
    <a class="btn" href="${process.env.NEXTAUTH_URL ?? 'https://portal.centralgateestates.com'}/portal">View in Portal</a>
  `

  await sendEmail({
    to: recipientEmail,
    subject: `Maintenance update: ${request.title} — ${statusLabels[update.status] ?? update.status}`,
    html: wrapEmail(content, `Your maintenance job "${request.title}" has been updated`),
  })
}

// ─── Rent Receipt ─────────────────────────────────────────────────────────────

export async function sendRentReceipt(
  payment: RentPayment,
  tenancy: Tenancy,
  tenantEmail: string
): Promise<void> {
  const content = `
    <h1>Rent Receipt</h1>
    <p>Thank you for your payment. This email confirms receipt of your rent for the period below.</p>

    <h2>Payment Details</h2>
    <div class="detail-row"><span class="detail-label">Amount Paid</span><span class="detail-value">${formatCurrency(payment.amountPaid)}</span></div>
    <div class="detail-row"><span class="detail-label">Due Date</span><span class="detail-value">${formatDate(payment.dueDate)}</span></div>
    ${payment.paidDate ? `<div class="detail-row"><span class="detail-label">Paid On</span><span class="detail-value">${formatDate(payment.paidDate)}</span></div>` : ''}
    ${payment.reference ? `<div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value">${payment.reference}</span></div>` : ''}
    <div class="detail-row"><span class="detail-label">Tenancy Ref</span><span class="detail-value">#${tenancy.id.slice(-8).toUpperCase()}</span></div>

    <p style="margin-top:24px;">Please retain this email as your proof of payment. If you believe this is incorrect, contact us immediately.</p>

    <a class="btn" href="${process.env.NEXTAUTH_URL ?? 'https://portal.centralgateestates.com'}/portal/payments">View Payment History</a>
  `

  await sendEmail({
    to: tenantEmail,
    subject: `Rent receipt — ${formatCurrency(payment.amountPaid)} received`,
    html: wrapEmail(content, `Your rent payment of ${formatCurrency(payment.amountPaid)} has been received`),
  })
}

// ─── Compliance Alert ─────────────────────────────────────────────────────────

export async function sendComplianceAlert(
  item: ComplianceItem,
  propertyAddress: string,
  agentEmail: string
): Promise<void> {
  const certLabels: Record<string, string> = {
    GAS_SAFETY: 'Gas Safety Certificate',
    EICR: 'Electrical Installation Condition Report (EICR)',
    EPC: 'Energy Performance Certificate (EPC)',
    HMO_LICENCE: 'HMO Licence',
    LEGIONELLA: 'Legionella Risk Assessment',
    PAT_TESTING: 'PAT Testing',
    FIRE_SAFETY: 'Fire Safety Certificate',
    RIGHT_TO_RENT: 'Right to Rent Check',
  }

  const certName = certLabels[item.type] ?? item.type
  const daysUntilExpiry = item.expiryDate
    ? Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const urgencyColor = daysUntilExpiry !== null && daysUntilExpiry <= 14 ? '#dc3545' : '#1A3D2B'
  const urgencyText = daysUntilExpiry !== null && daysUntilExpiry <= 0
    ? 'EXPIRED'
    : daysUntilExpiry !== null
    ? `expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
    : 'expiry unknown'

  const content = `
    <h1>Compliance Alert</h1>
    <p>Action required: a compliance certificate is due for renewal.</p>

    <div class="alert-box" style="border-left-color:${urgencyColor};">
      <p style="margin:0;font-weight:600;color:${urgencyColor};">${certName} — ${urgencyText.toUpperCase()}</p>
    </div>

    <h2>Details</h2>
    <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
    <div class="detail-row"><span class="detail-label">Certificate</span><span class="detail-value">${certName}</span></div>
    ${item.expiryDate ? `<div class="detail-row"><span class="detail-label">Expiry Date</span><span class="detail-value">${formatDate(item.expiryDate)}</span></div>` : ''}
    ${item.issueDate ? `<div class="detail-row"><span class="detail-label">Issue Date</span><span class="detail-value">${formatDate(item.issueDate)}</span></div>` : ''}

    <p style="margin-top:24px;">Please arrange renewal as soon as possible to maintain legal compliance. Failure to hold valid certificates can result in fines and invalidate landlord insurance.</p>

    <a class="btn" href="${process.env.NEXTAUTH_URL ?? 'https://app.centralgateestates.com'}/dashboard/compliance">View Compliance Dashboard</a>
  `

  await sendEmail({
    to: agentEmail,
    subject: `ACTION REQUIRED: ${certName} ${urgencyText} — ${propertyAddress}`,
    html: wrapEmail(content, `${certName} for ${propertyAddress} ${urgencyText}`),
  })
}

// ─── Rent Arrears — Tenant ────────────────────────────────────────────────────

export async function sendRentArrearsTenantEmail(
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  amountOwed: number,
  daysOverdue: number,
  portalUrl: string,
): Promise<void> {
  const html = wrapEmail(`
    <h1>Important: Rent Payment Overdue</h1>
    <p>Dear ${tenantName},</p>
    <p>We are writing to notify you that your rent payment for the property below is now <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue</strong>.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
      <div class="detail-row"><span class="detail-label">Amount Owed</span><span class="detail-value" style="color:#dc3545;font-weight:700;">£${amountOwed.toLocaleString()}</span></div>
      <div class="detail-row"><span class="detail-label">Days Overdue</span><span class="detail-value">${daysOverdue}</span></div>
    </div>
    <p>Please make payment immediately to avoid any further action. If you are experiencing financial difficulties, please contact us <strong>urgently</strong> so we can discuss your situation.</p>
    <p style="margin:24px 0;">
      <a href="${portalUrl}/payments" class="btn">Make Payment Now →</a>
    </p>
    <p style="font-size:13px;color:#737373;">If you have already made payment, please disregard this notice and provide your payment reference to <a href="mailto:hello@centralgateestates.com">hello@centralgateestates.com</a>.</p>
  `, `Your rent payment of £${amountOwed.toLocaleString()} is overdue`)

  await sendEmail({
    to: tenantEmail,
    subject: `URGENT: Rent overdue — £${amountOwed.toLocaleString()} outstanding`,
    html,
  })
}

// ─── Rent Arrears — Landlord ──────────────────────────────────────────────────

export async function sendRentArrearsLandlordEmail(
  landlordEmail: string,
  landlordName: string,
  propertyAddress: string,
  tenantName: string,
  amountOwed: number,
  daysOverdue: number,
): Promise<void> {
  const html = wrapEmail(`
    <h1>Rent Arrears — We Are Handling This</h1>
    <p>Dear ${landlordName},</p>
    <p>We are writing to inform you that rent for the following property is currently <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue</strong>.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
      <div class="detail-row"><span class="detail-label">Tenant</span><span class="detail-value">${tenantName}</span></div>
      <div class="detail-row"><span class="detail-label">Amount Owed</span><span class="detail-value" style="font-weight:700;">£${amountOwed.toLocaleString()}</span></div>
      <div class="detail-row"><span class="detail-label">Days Overdue</span><span class="detail-value">${daysOverdue}</span></div>
    </div>
    <p><strong>We have already contacted the tenant directly</strong> and issued a formal overdue notice. We are actively managing this situation on your behalf.</p>
    <p>We will keep you updated on any developments. Once we have confirmation of payment or further information from the tenant, we will contact you immediately.</p>
    <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
    <p style="margin:8px 0 0;">
      <a href="https://wa.link/gy7gtr" class="btn">Contact Bradley on WhatsApp</a>
    </p>
    <p style="margin:8px 0 0;">
      <a href="https://wa.link/0nr9sr" style="display:inline-block;background:#f5f2ee;color:#1a1a1a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Contact Claire on WhatsApp</a>
    </p>
  `, `Rent arrears for ${propertyAddress} — we are handling this`)

  await sendEmail({
    to: landlordEmail,
    subject: `Rent arrears update — ${propertyAddress}`,
    html,
  })
}

// ─── Referencing Invite (to tenant) ──────────────────────────────────────────

export async function sendReferencingInviteEmail(
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  referencingUrl: string,
): Promise<void> {
  const html = wrapEmail(`
    <h1>Your Referencing Pack is Ready</h1>
    <p>Dear ${tenantName},</p>
    <p>Thank you for your holding deposit for <strong>${propertyAddress}</strong>. The next step in securing your tenancy is to complete our referencing process.</p>
    <p>This takes approximately <strong>10–15 minutes</strong> and you will need:</p>
    <ul style="font-size:15px;line-height:1.8;color:#404040;padding-left:20px;">
      <li>Photo ID (passport or driving licence)</li>
      <li>3 most recent payslips (or proof of income)</li>
      <li>Bank statement (last 3 months)</li>
      <li>Employer contact details</li>
      <li>Previous landlord contact details</li>
    </ul>
    <div class="alert-box">
      <p style="margin:0;font-size:14px;"><strong>Important:</strong> We will contact your employer and previous landlord to verify the information you provide. Please ensure all details are accurate.</p>
    </div>
    <p style="margin:24px 0;">
      <a href="${referencingUrl}" class="btn">Begin Referencing →</a>
    </p>
    <p style="font-size:13px;color:#737373;">This link is unique to you. Please do not share it. If you have any questions, WhatsApp us at <a href="https://wa.link/gy7gtr">wa.link/gy7gtr</a>.</p>
  `, 'Complete your referencing to secure your tenancy')

  await sendEmail({
    to: tenantEmail,
    subject: `Action required: Complete your referencing — ${propertyAddress}`,
    html,
  })
}

// ─── Employer Verification ────────────────────────────────────────────────────

export async function sendEmployerVerificationEmail(
  employerEmail: string,
  employerName: string,
  tenantName: string,
  jobTitle: string,
  declaredSalary: number,
  contractType: string,
  confirmUrl: string,
): Promise<void> {
  const html = wrapEmail(`
    <h1>Employment Verification Request</h1>
    <p>Dear ${employerName},</p>
    <p>We are a property letting agency and are currently conducting a tenancy reference for one of your employees. We would be grateful if you could confirm the employment details below.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Employee Name</span><span class="detail-value">${tenantName}</span></div>
      <div class="detail-row"><span class="detail-label">Job Title</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Declared Salary</span><span class="detail-value">£${declaredSalary.toLocaleString()} per annum</span></div>
      <div class="detail-row"><span class="detail-label">Contract Type</span><span class="detail-value">${contractType}</span></div>
    </div>
    <p>This takes less than 2 minutes. Please click the button below to confirm, amend, or dispute these details.</p>
    <p style="margin:24px 0;">
      <a href="${confirmUrl}" class="btn">Confirm Employment Details →</a>
    </p>
    <p style="font-size:13px;color:#737373;">This is a legitimate request from Central Gate Estates Ltd, a regulated property letting agency. If you have any concerns, please contact us at <a href="mailto:hello@centralgateestates.com">hello@centralgateestates.com</a>.</p>
    <p style="font-size:13px;color:#737373;">This link expires in 7 days.</p>
  `, `Employment verification request for ${tenantName}`)

  await sendEmail({
    to: employerEmail,
    subject: `Employment verification: ${tenantName} — Central Gate Estates`,
    html,
    replyTo: 'hello@centralgateestates.com',
  })
}

// ─── Previous Landlord Verification ──────────────────────────────────────────

export async function sendPreviousLandlordVerificationEmail(
  landlordEmail: string,
  landlordName: string,
  tenantName: string,
  propertyAddress: string,
  tenancyPeriod: string,
  confirmUrl: string,
): Promise<void> {
  const html = wrapEmail(`
    <h1>Tenancy Reference Request</h1>
    <p>Dear ${landlordName},</p>
    <p>We are a property letting agency and are currently processing a tenancy application. The applicant has provided your details as their previous landlord. We would be grateful if you could provide a brief reference.</p>
    <div class="alert-box">
      <div class="detail-row"><span class="detail-label">Tenant Name</span><span class="detail-value">${tenantName}</span></div>
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
      <div class="detail-row"><span class="detail-label">Tenancy Period</span><span class="detail-value">${tenancyPeriod}</span></div>
    </div>
    <p>This takes less than 2 minutes. Please click below to submit your reference.</p>
    <p style="margin:24px 0;">
      <a href="${confirmUrl}" class="btn">Submit Reference →</a>
    </p>
    <p style="font-size:13px;color:#737373;">Central Gate Estates Ltd is a regulated letting agency. If you have any concerns about this request, please contact us at <a href="mailto:hello@centralgateestates.com">hello@centralgateestates.com</a>.</p>
    <p style="font-size:13px;color:#737373;">This link expires in 7 days.</p>
  `, `Tenancy reference request for ${tenantName}`)

  await sendEmail({
    to: landlordEmail,
    subject: `Tenancy reference request: ${tenantName} — Central Gate Estates`,
    html,
    replyTo: 'hello@centralgateestates.com',
  })
}

// ─── Referencing Complete (to agent) ─────────────────────────────────────────

export async function sendReferencingCompleteEmail(
  agentEmail: string,
  tenantName: string,
  propertyAddress: string,
  score: number,
  status: string,
  reportUrl: string,
): Promise<void> {
  const statusColor = status === 'PASSED' ? '#28a745' : status === 'CONDITIONAL' ? '#fd7e14' : '#dc3545'
  const html = wrapEmail(`
    <h1>Referencing Complete</h1>
    <p>The referencing application for <strong>${tenantName}</strong> has been completed and is ready for review.</p>
    <div class="alert-box" style="border-left-color:${statusColor};">
      <div class="detail-row"><span class="detail-label">Tenant</span><span class="detail-value">${tenantName}</span></div>
      <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${propertyAddress}</span></div>
      <div class="detail-row"><span class="detail-label">Affordability Score</span><span class="detail-value" style="font-weight:700;font-size:18px;">${score}/100</span></div>
      <div class="detail-row"><span class="detail-label">Outcome</span><span class="detail-value" style="font-weight:700;color:${statusColor};">${status}</span></div>
    </div>
    <p style="margin:24px 0;">
      <a href="${reportUrl}" class="btn">View Full Report →</a>
    </p>
  `, `Referencing complete for ${tenantName} — Score: ${score}/100`)

  await sendEmail({
    to: agentEmail,
    subject: `Referencing complete: ${tenantName} — Score ${score}/100 (${status})`,
    html,
  })
}
