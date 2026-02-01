const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { fullName, address, city, province, postalCode, country, cartItems } = req.body;

  let productList = "";
  if (Array.isArray(cartItems)) {
    productList = cartItems
      .map(item =>
        `${item.name} (Size: ${item.selectedSize}, Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
      )
      .join("\n");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.BUSINESS_EMAIL || "your-business@gmail.com",
    subject: "📦 New Shipping Info + Products",
    text: `
A new shipping address has been submitted:

Name: ${fullName}
Address: ${address}
City: ${city}
Province: ${province}
Postal Code: ${postalCode}
Country: ${country}

Products:
${productList || "No products provided"}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to business owner");
    res.json({ success: true, message: "Shipping info + products emailed to owner" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;