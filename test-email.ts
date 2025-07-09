import dotenv from "dotenv";
dotenv.config({path: ".env.local"});


import nodemailer from "nodemailer";

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test Mailer" <${process.env.EMAIL_USER}>`,
      to: "your-personal-email@gmail.com", // replace with your test email
      subject: "🚀 Test Email from GDG",
      text: "If you're reading this, nodemailer works!",
    });

    console.log("✅ Email sent: ", info.response);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

testEmail();
