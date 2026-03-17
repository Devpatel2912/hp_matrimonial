import nodemailer from "nodemailer";

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || "no-reply@example.com",
});

const createTransporter = () => {
  const smtpConfig = getSmtpConfig();
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    return { transporter: null, smtpConfig };
  }
  return {
    transporter: nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    }),
    smtpConfig,
  };
};

export const sendOtp = async ({ to, otp }) => {
  const { transporter, smtpConfig } = createTransporter();
  if (!transporter) return { ok: false, error: "SMTP not configured" };

  const info = await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject: "Your OTP",
    text: `Your OTP is ${otp}. It expires soon.`,
  });
  return { ok: true, messageId: info?.messageId };
};
