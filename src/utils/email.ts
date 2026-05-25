import nodemailer from 'nodemailer';

// Configure the nodemailer transport using Hostinger SMTP details
// We use environment variables so credentials are kept secure
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a password reset email to the user
 * @param to Email address of the user
 * @param resetToken The unhashed token they will use to reset the password
 */
export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  // We expect FRONTEND_URL to be defined in .env, pointing to your Next.js app
  // E.g., http://localhost:3000 or https://yourdomain.com
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // The link the user will click on in the email
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Job Platform Support" <${process.env.SMTP_USER}>`, // Sender address
    to, // List of receivers
    subject: 'Password Reset Request', // Subject line
    text: `You requested a password reset. Please go to this link to reset your password: ${resetLink} \n\nIf you did not request this, please ignore this email.`,
    html: `
      <h2>Password Reset Request</h2>
      <p>You recently requested to reset your password for your Job Platform account.</p>
      <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
      <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${to}:`, error);
    throw new Error('Could not send password reset email');
  }
};
