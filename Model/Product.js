const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl:{
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  inCart:{
    type:Boolean,
    default:false
  },
  offeredPrice:Number,
  offer: {
    type: {
      type: String,
      enum: ['flat', 'percentage', 'bundled'],
      default: 'flat'
    },
    flatDiscount: {
      type: Number,
      default: 0
    },
    percentageDiscount: {
      type: Number,
      default: 0 
    },
    bundledProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
