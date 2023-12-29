const express = require("express");
const Product = require("../Model/Product");
const Order = require("../Model/Order");
const mongoose = require("mongoose");
const router = express.Router();

// Create a new order
router.post("/orders", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ message: "Invalid productId" });
      }

      const product = await Product.findById(productId).session(session);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let offeredPrice = product.price;

      if (product.offer && product.offer.type === "flat") {
        offeredPrice -= product.offer.flatDiscount;
      } else if (product.offer && product.offer.type === "percentage") {
        const discount = (product.offer.percentageDiscount / 100) * product.price;
        offeredPrice -= discount;
      }

      const order = new Order({
        product: productId,
        originalPrice: product.price,
        offeredPrice,
        totalPrice: offeredPrice,
      });

      const newOrder = await order.save({ session });

      // Update product cart details
      await Product.findByIdAndUpdate(
        productId,
        { inCart: true },
        { new: true, session }
      );

      return res.status(201).json(newOrder);
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  } finally {
    session.endSession();
  }
});


// Get all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).populate({
      path: "product",
      select: "name price offer imageUrl offeredPrice",
      populate: {
        path: "offer.bundledProduct",
        select: "name price imageUrl",
      },
    });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    const ordersValue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalPrice" },
          totalOrders: { $sum: "$quantity" },
          originalPrice: { $sum: "$originalPrice" },
        },
      },
    ]);

    const { totalAmount, totalOrders, originalPrice } = ordersValue[0];
    const totalDiscountedPrice = parseFloat(
      (originalPrice - totalAmount).toFixed(2)
    );

    res.status(200).json({
      orders,
      totalOfferedPrice: parseFloat(totalAmount.toFixed(2)),
      totalOrders: parseFloat(totalOrders.toFixed(2)),
      totalOriginalPrice: parseFloat(originalPrice.toFixed(2)),
      totalDiscountedPrice,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Update quantity by ID
router.put("/orders/:orderId/updatequantity", async (req, res) => {
  try {
    const { quantity } = req.body;
    const orderId = req.params.orderId;

    if (!quantity || isNaN(quantity)) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const order = await Order.findById(orderId).populate({
      path: "product",
      select: "name price offer",
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedQuantity = order.quantity + quantity;
    const updatedTotalPrice = updatedQuantity * order.offeredPrice;
    const updatedOriginalPrice = updatedQuantity * order.product.price;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          quantity: updatedQuantity,
          totalPrice: updatedTotalPrice,
          originalPrice: updatedOriginalPrice,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order quantity:", error);
    res.status(500).json({ message: "Failed to update order quantity" });
  }
});

// Delete order by ID
router.delete("/orders/delete", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { productId } = req.query;
    if (!productId)
      return res.status(400).json({ message: "Provide productId" });

    await session.withTransaction(async () => {
      const deletedOrder = await Order.findOneAndDelete({
        product: productId,
      }).session(session);

      if (!deletedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await Product.findByIdAndUpdate(
        productId,
        { $set: { inCart: false } },
        { new: true }
      ).session(session);

      return res.status(200).json({ message: "Order successfully deleted" });
    });
  } catch (error) {
    console.error("Error deleting order and updating product:", error);
    return res.status(404).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
});

module.exports = router;
