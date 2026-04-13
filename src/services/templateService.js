export default function personalize(name, company) {
  return `
<div style="font-family:Arial, sans-serif; font-size:14px; color:#202124; line-height:1.6; max-width:600px;">
  <p>Hi ${name},</p>

  <p>I came across <b>${company}</b> and was genuinely impressed by the work your team is doing. I believe there's a strong opportunity for us to collaborate.</p>

  <p>At Karthikeyan Software Solutions, we help companies like ${company} with:</p>

  <ul style="color:#202124; padding-left:20px;">
    <li>Custom Web & Mobile Application Development</li>
    <li>Cloud Infrastructure & DevOps Automation</li>
    <li>Data Analytics & AI-Powered Solutions</li>
    <li>Enterprise Security & Compliance</li>
  </ul>

  <p>Would you be open to a quick 15-minute call this week? I'd love to explore how we can help ${company} scale faster.</p>

  <p>Looking forward to hearing from you.</p>

  <p>
    Best regards,<br>
    <b>Karthikeyan</b><br>
    <span style="color:#555;">Founder, Karthikeyan Software Solutions</span><br>
    <a href="mailto:karthikeyanworkonly@gmail.com" style="color:#1a73e8; text-decoration:none;">karthikeyanworkonly@gmail.com</a>
  </p>
</div>`;
}
