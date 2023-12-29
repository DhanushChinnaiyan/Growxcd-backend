const express = require("express");
const Product = require("../Model/Product");
const router = express.Router();

// Retrieve all products
router.get("/products", async (req, res) => {
  try {
    const { productId } = req.query;
    const query = productId ? { _id: productId } : {};

    const product = await Product.find(query);
    if (!product.length) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.log("Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Create a new product
router.post("/products", async (req, res) => {
  try {
    const { name, price, imageUrl, description } = req.body;
    if (!name || !price || !imageUrl || !description) {
      return res.status(400).json({ message: "Please provide all details" });
    }
    const newProduct = await Product.create({
      name,
      price,
      imageUrl,
      description,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
});

// Update a product
router.put("/products/:productId", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.log("Getting error", error);
    res
      .status(400)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Delete a product
router.delete("/products/:productId", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.log("Getting error", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Apply offer to a product
router.put("/products/:productId/offer", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate req.body containing the updated offer details before using it
    const updatedOffer = req.body;

    let offeredPrice = product.price;

    if (updatedOffer.type === "flat") {
      offeredPrice -= updatedOffer.flatDiscount;
    } else if (updatedOffer.type === "percentage") {
      const discount = (updatedOffer.percentageDiscount / 100) * product.price;
      offeredPrice -= discount;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { offer: updatedOffer, offeredPrice },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


module.exports = router;
