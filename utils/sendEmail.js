// require("dotenv").config(); // Make sure this is at the top

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   secure: false, // or true if using port 465
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// async function sendEmail(to, subject, text) {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//     });
//     console.log("Email sent to:", to);
//   } catch (error) {
//     console.error("Email sending failed:", error);
//   }
// }

// module.exports = sendEmail;

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_USER, // You can change this to your verified sender
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", data);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
}

export default sendEmail;
