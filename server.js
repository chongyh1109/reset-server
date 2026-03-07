const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let verificationCodes = {};
let attempts = {};
let sendCooldown = {};

app.get("/", (req, res) => {
  res.send("Reset Server is running 🚀");
});

const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }

  tls: {
      rejectUnauthorized: false
  }
});

app.post("/send-code", async (req, res) => {

  console.log("Send-code API called");
  console.log("Request body:", req.body);

  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email required" });
  }

  const now = Date.now();

  if (sendCooldown[email] && now - sendCooldown[email] < 60000) {
    return res.json({
      success: false,
      message: "Please wait 60 seconds before requesting another code"
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  verificationCodes[email] = {
    code: code,
    expire: Date.now() + 5 * 60 * 1000
  };

  sendCooldown[email] = now;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset Code",
      text: `Your 6-digit verification code is: ${code}`
    });

    console.log("Email sent to:", info.response);

    res.json({ success: true });

  } catch (error) {

    console.log("Email error:", error);
    res.json({ success: false, error: error.message });

  }

});

app.post("/verify-code", (req, res) => {

  const { email, code } = req.body;

  const data = verificationCodes[email];

  if (!data) {
    return res.json({ success: false, message: "No code found" });
  }

  if (!attempts[email]) {
    attempts[email] = 0;
  }

  if (Date.now() > data.expire) {
    delete verificationCodes[email];
    attempts[email] = 0;
    return res.json({ success: false, message: "Code expired" });
  }

  if (data.code === code) {
    delete verificationCodes[email];
    attempts[email] = 0;
    return res.json({ success: true });
  }

  attempts[email]++;

  if (attempts[email] >= 3) {
    delete verificationCodes[email];
    attempts[email] = 0;
    return res.json({ success: false, message: "Too many attempts. Request new code." });
  }

  return res.json({ success: false, message: "Wrong code" });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});