const express = require("express");
const { Client, Environment } = require("square");
require("dotenv").config();

const router = express.Router();

// ✅ Force production environment
const client = new Client({
  accessToken: process.env.ACCESS_TOKEN,
  environment: Environment.Production,
});


router.get("/products", async (req, res) => {
  console.log("🟢 [Square] Fetching products...");

  try {
    const { result } = await client.catalogApi.listCatalog();
    const objects = result.objects || [];

    const items = objects.filter((obj) => obj.type === "ITEM");
    console.log("🧾 Items found:", items.map((i) => i.itemData?.name));

    const images = objects.filter((obj) => obj.type === "IMAGE");

    const formattedItems = await Promise.all(
      items.map(async (item) => {
        try {
          let price = 0;
          try {
            const variation = item.itemData?.variations?.find(
              (v) =>
                typeof v.itemVariationData?.priceMoney?.amount === "bigint" &&
                v.itemVariationData?.priceMoney?.amount > 0n
            );
            const amount =
              variation?.itemVariationData?.priceMoney?.amount || 0n;
            price = Number(amount) / 100;
          } catch (err) {
            console.warn("⚠️ Price parsing failed for item:", item.id, err.message);
          }

          const imageId = item.itemData?.imageIds?.[0];
          let imageUrl = null;

          if (imageId) {
            const imageObj = images.find((img) => img.id === imageId);
            if (imageObj?.imageData?.url) {
              imageUrl = imageObj.imageData.url;
            } else {
              try {
                const { result } = await client.catalogApi.retrieveCatalogObject(imageId);
                imageUrl = result.object?.imageData?.url || null;
              } catch (err) {
                console.warn("⚠️ Failed to retrieve image:", err.message);
              }
            }
          }

          return {
            id: item.id,
            name: item.itemData?.name || "Unnamed Product",
            description: item.itemData?.description || "No description",
            price,
            image: imageUrl,
          };
        } catch (err) {
          console.error("💥 Error inside map() for item:", item.id, err.message);
          return {
            id: item.id,
            name: item.itemData?.name || "Unnamed Product",
            description: "⚠️ Error loading product",
            price: 0,
            image: null,
          };
        }
      })
    );

    res.json(formattedItems);
  } catch (error) {
    console.error("💥 Error fetching products from Square API:", error.message);
    console.error("🧾 Full error object:", JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});





module.exports = router;
