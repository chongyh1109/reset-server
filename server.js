const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let verificationCodes = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mpprojectteam2026@gmail.com",
    pass: "dkpmfedimyxdvzdg"
  }
});

app.get("/", (req, res) => {
  res.send("Reset Server is running 🚀");
});

app.post("/send-code", async (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  try {
    await transporter.sendMail({
      from: "mpprojectteam2026@gmail.com",
      to: email,
      subject: "Password Reset Code",
      text: `Your 6-digit code is: ${code}`
    });

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] === code) {
    delete verificationCodes[email];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});