// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");

// // ✅ Configure Nodemailer with Gmail SMTP + App Password
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // true for port 465
//   auth: {
//     user: process.env.EMAIL_USER, // Gmail address from .env
//     pass: process.env.EMAIL_PASS  // Gmail App Password from .env (no spaces)
//   }
// });

// router.post("/", async (req, res) => {
//   const shipping = req.body;

//   const mailOptions = {
//     from: process.env.EMAIL_USER,                // sender (your Gmail)
//     to: "BUSINESS_OWNER_EMAIL@gmail.com",        // replace with business owner’s email
//     subject: "📦 New Shipping Address Submitted",
//     text: `
//     A new shipping address has been submitted:

//     Name: ${shipping.fullName}
//     Address: ${shipping.address}
//     City: ${shipping.city}
//     Province: ${shipping.province}
//     Postal Code: ${shipping.postalCode}
//     Country: ${shipping.country}
//     `
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent successfully to business owner");
//     res.json({ success: true, message: "Shipping address emailed to owner" });
//   } catch (error) {
//     console.error("❌ Error sending email:", error);
//     res.status(500).json({
//       error: error.message,
//       stack: error.stack
//     });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// ✅ Configure Nodemailer with Gmail SMTP + App Password
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER, // Gmail address from .env
    pass: process.env.EMAIL_PASS  // Gmail App Password from .env
  }
});

router.post("/", async (req, res) => {
  const { fullName, address, city, province, postalCode, country, cartItems } = req.body;

  // ✅ Build product list string
  let productList = "";
  if (Array.isArray(cartItems)) {
    productList = cartItems
      .map(item =>
        `${item.name} (Size: ${item.selectedSize}, Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
      )
      .join("\n");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,                // sender (your Gmail)
    to: "BUSINESS_OWNER_EMAIL@gmail.com",        // replace with business owner’s email
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
