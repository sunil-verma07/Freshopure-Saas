const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const UserOrder = require("../models/order.js");
const Cart = require("../models/cart.js");
const db = getDatabase();
// const UserOrder = db.collection('UserOrders');
const OrderStatus = require("../models/orderStatus.js");
const itemsPrice = require("../models/cart.js");
const Items = require("../models/item.js");
const Images = require("../models/image.js");
const Address = require("../models/address.js");
const UserItems = db.collection("UserItems");
const HotelItemPrice = require("../models/hotelItemPrice.js");
const Addresses = require("../models/address.js");
const category = require("../models/category.js");
const item = require("../models/item.js");

const placeOrder = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;

    //order address
    const address = await Addresses.findOne({
      HotelId: hotelId,
      selected: true,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    //order status
    const orderStatus = "65cef0c27ebbb69ab54c55f4";

    //cart items
    const cart_doc = await Cart.findOne({ hotelId: hotelId });
    console.log(cart_doc, hotelId, "abcd");
    const orders = {};

    let totalOrderPrice = 0;

    for (let item of cart_doc?.cartItems) {
      const itemPrice = await HotelItemPrice.findOne({
        vendorId: item.vendorId,
        itemId: item.itemId,
        hotelId: hotelId,
      });

      if (!itemPrice) {
        console.log("Hotel item price not found for item:", item);
        continue;
      }

      const updatedItem = {
        vendorId: item.vendorId,
        itemId: item.itemId,
        quantity: item.quantity,
        price: itemPrice?.todayCostPrice,
      };

      if (!orders[item.vendorId]) {
        orders[item.vendorId] = [];
      }
      orders[item.vendorId].push(updatedItem);
    }

    console.log(totalOrderPrice, "cost");

    for (const vendorId in orders) {
      if (Object.hasOwnProperty.call(orders, vendorId)) {
        const items = orders[vendorId];

        //order Number
        const currentDate = new Date();
        const formattedDate = currentDate
          .toISOString()
          .substring(0, 10)
          .replace(/-/g, "");
        const randomNumber = Math.floor(Math.random() * 10000);
        const orderNumber = `${formattedDate}-${randomNumber}`;

        let totalPrice = 0;
        items.forEach((item) => {
          const totalGrams = item.quantity.kg * 1000 + item.quantity.gram; // Convert kg to grams and add the gram value
          totalPrice = totalPrice + (totalGrams * item.price) / 1000; // Multiply total grams with price and store in totalPrice field
        });

        const order = new UserOrder({
          vendorId,
          hotelId,
          orderNumber,
          orderStatus,
          totalPrice,
          address,
          orderedItems: items,
        });

        console.log(order, "order");

        await order.save();
      }
    }

    await Cart.deleteOne({ hotelId: new ObjectId(hotelId) });

    res.status(200).json({ message: "Order Placed", orders });
  } catch (error) {
    console.log(error);
    if (error.message == "Both addressId and price are required fields.") {
      res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderHistory = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;

    const orderData = await UserOrder.aggregate([
      {
        $match: { hotelId: hotelId },
      },
      {
        $lookup: {
          from: "Users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatusDetails",
        },
      },
      {
        $unwind: "$orderStatusDetails",
      },
      {
        $unwind: "$orderedItems", // Unwind orderedItems array
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "images",
        },
      },
      {
        $unwind: "$images",
      },
      {
        $group: {
          _id: {
            orderId: "$_id",
          },
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          totalPrice: { $first: "$totalPrice" },
          address: { $first: "$address" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          hotelId: { $first: "$hotelId" },
          vendorDetails: { $first: "$vendorDetails" },
          // orderData: { $first: "$$ROOT" },
          orderStatusDetails: { $first: "$orderStatusDetails" },
          orderedItems: {
            $push: {
              $mergeObjects: [
                "$orderedItems",
                { itemDetails: "$itemDetails" },
                { image: "$images" },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: 1,
          vendorDetails: 1,
          orderNumber: 1,
          isReviewed: 1,
          totalPrice: 1,
          address: 1,
          createdAt: 1,
          updatedAt: 1,
          orderStatusDetails: 1,
          // orderData: 1,
          orderedItems: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success message",
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
});

const allHotelOrders = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;

    const hotelOrders = await UserOrder.find({
      hotelId: hotelId,
    }).populate("orderStatus");

    res.status(200).json({ hotelOrders });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderAgain = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.hotel._id;
    const { order_id, addressId } = req.body;

    if (!addressId || !order_id) {
      throw new Error("Both addressId and order_id are required fields.");
    }

    const findOrder = await UserOrder.findOne({ _id: new ObjectId(order_id) });
    if (findOrder) {
      const orderedItems = findOrder?.orderedItems ?? [];
      const cartPresent = await Cart.findOne({ UserId: new ObjectId(UserId) });
      if (cartPresent) {
        const x = await Cart.updateOne(
          { UserId: new ObjectId(UserId) },
          { $set: { orderedItems: orderedItems } }
        );
      } else {
        const cart = new Cart({
          UserId,
          orderedItems,
        });
        // Save the cart to the database
        await cart.save();
      }

      res.status(200).json({ message: "Order Items Added To cart" });
    } else {
      res.status(400).json({ error: "Order Not Found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const compiledOrderForHotel = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.hotel._id;
    // const { itemId } = req.body;

    // if (!itemId) {
    //   throw new Error('itemId is required fields.');
    // }

    // const data =null;
    async function callApi(UserId, callback) {
      const reqBody = {
        UserId: UserId,
      };
      fetch(
        `https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/compiledOrderForHotel?secret=alwaysShine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: JSON.stringify(reqBody),
        }
      )
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          // console.log('Request succeeded with JSON response', data);
          return callback(null, data);
        })
        .catch(function (error) {
          console.log("Request failed", error);
          return callback(error);
        });
    }

    callApi(UserId, function (error, data) {
      if (error) {
        throw new Error(error);
      } else {
        return res.status(200).json({ success: true, data: data });
      }
    });

    // res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderDetails = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const orderData = await UserOrder.aggregate([
      {
        $match: { _id: new ObjectId(orderId) },
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatus",
        },
      },
      {
        $unwind: "$orderStatus",
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "orderedItems.itemDetails",
        },
      },
      {
        $unwind: "$orderedItems.itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "orderedItems.itemDetails._id",
          foreignField: "itemId",
          as: "orderedItems.itemDetails.images",
        },
      },
      {
        $unwind: {
          path: "$orderedItems.itemDetails.images",
          preserveNullAndEmptyArrays: true, // Preserve documents without images
        },
      },
      {
        $lookup: {
          from: "Prices",
          localField: "orderedItems.itemDetails._id",
          foreignField: "itemId",
          as: "orderedItems.itemDetails.price",
        },
      },
      {
        $unwind: {
          path: "$orderedItems.itemDetails.price",
          preserveNullAndEmptyArrays: true, // Preserve documents without price
        },
      },
      {
        $lookup: {
          from: "Categories",
          localField: "orderedItems.itemDetails.categoryId",
          foreignField: "_id",
          as: "orderedItems.itemDetails.category",
        },
      },
      {
        $unwind: {
          path: "$orderedItems.itemDetails.category",
          preserveNullAndEmptyArrays: true, // Preserve documents without category
        },
      },
      {
        $group: {
          _id: "$_id",
          orderStatus: { $first: "$orderStatus" },
          orderedItems: { $push: "$orderedItems" },
        },
      },
    ]);

    return res.status(200).json({ success: true, data: orderData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  placeOrder,
  orderHistory,
  orderAgain,
  compiledOrderForHotel,
  orderDetails,
  allHotelOrders,
};
