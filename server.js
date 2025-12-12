const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Client, Environment } = require("square");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Check env
console.log("🔑 Access Token Loaded:", process.env.ACCESS_TOKEN ? "✅ Yes" : "❌ No");
console.log("📍 Location ID Loaded:", process.env.LOCATION_ID ? "✅ Yes" : "❌ No");

// Serve HTML test file (optional for testing)
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "card.html");
  fs.readFile(htmlPath, "utf-8", (err, html) => {
    if (err) return res.status(500).send("Internal Server Error");
    res.status(200).send(html);
  });
});

// ✅ Fetch products from Square Catalog
app.get("/api/products", async (req, res) => {
  try {
    const client = new Client({
      accessToken: process.env.ACCESS_TOKEN,
      environment: Environment.Production,
    });

    const { catalogApi } = client;
    const response = await catalogApi.listCatalog(undefined, "ITEM,IMAGE");
    const objects = response.result.objects || [];

    // Build image lookup map
    const imageMap = {};
    for (const obj of objects) {
      if (obj.type === "IMAGE") {
        imageMap[obj.id] = obj.imageData?.url;
      }
    }

    // Filter items and attach image
    const products = objects
      .filter((obj) => obj.type === "ITEM")
      .map((item) => {
        const data = item.itemData;
       const variation = data.variations?.[0]?.itemVariationData;
const priceMoney = variation?.priceMoney?.amount;
const price = priceMoney ? Number(priceMoney) / 100 : 0;




        // Resolve image from imageMap
        const imageId = data.imageIds?.[0];
        const imageUrl = imageId ? imageMap[imageId] : "https://via.placeholder.com/400x500.png?text=NAIJA+Product";

        return {
          id: item.id,
          name: data.name,
          description: data.description || "",
          price,
          image: imageUrl
        };
      });

    res.json(products);
  } catch (error) {
    console.error("💥 Failed to fetch products from Square:", error);
    res.status(500).json({ error: error.message || "Failed to load products from Square" });
  }
});



   

// ✅ Main payment route
app.post("/api/square/charge", async (req, res) => {
  try {
    const { sourceId, amount, postalCode, discountCode } = req.body;


      console.log("🧾 Incoming payment:", { amount, discountCode });


    const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
    if (postalCode && !postalCodeRegex.test(postalCode)) {
      return res.status(400).json({
        payment: null,
        errors: [{ detail: "Invalid postal code format." }],
      });
    }

    const client = new Client({
      accessToken: process.env.ACCESS_TOKEN,
      environment: Environment.Production,
    });

    // ✅ Apply discount if code matches
   // ✅ Apply discount if code matches
   
let finalAmount = amount;
if (discountCode && discountCode.trim().toUpperCase() === 'NEWBIE123'.toUpperCase()) {
  finalAmount = amount - 5; // subtract 5 CAD
  if (finalAmount < 0) finalAmount = 0; // safety check
}

       console.log("💸 Final amount after discount:", finalAmount);

    console.log("🔐 Payment request:", { sourceId, amount, finalAmount, postalCode, discountCode });

    const response = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: Date.now().toString(),
      amountMoney: {
        amount: Math.round(finalAmount * 100), // Convert to cents
        currency: "CAD",
      },
      locationId: process.env.LOCATION_ID,
    });

    console.log("✅ Payment response:", response.result);

    const { payment, errors } = response.result || {};
    res.status(200).json({
      payment: payment || null,
      errors: errors || []
    });

  } catch (error) {
    console.error("💥 Payment Error:", error);
    const errors =
      error?.result?.errors ||
      [{ code: "UNKNOWN_ERROR", detail: error.message || "Unknown error", category: "API_ERROR" }];
    res.status(200).json({
      payment: null,
      errors
    });
  }
});


app.use("/api/shipping", require("./routes/shipping"));



app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
