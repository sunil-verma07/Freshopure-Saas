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

    const orders = {};

    cart_doc?.cartItems?.forEach(async (item) => {
      console.log(item, "i");
      const itemPrice = await HotelItemPrice.findOne({
        vendorId: item.vendorId,
        hotelId: hotelId,
        itemId: item.itemId,
      });

      if (!itemPrice) {
        console.log(
          `Item '${item.itemId}' linked to vendor '${item.vendorId}' not found in HotelItemPrice. Skipping this item.`
        );
        return; // Skip this item if no price found
      }

      // Create a new item object with price
      // const updatedItem = {
      //   ...item,
      //   price: Number(itemPrice.todayCostPrice), // Ensure price is a number
      // };

      item["price"] = itemPrice.todayCostPrice;
      console.log(item, "item");

      if (!orders[item.vendorId]) {
        orders[item.vendorId] = [];
      }

      orders[item.vendorId].push(item);
    });

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

        const order = new UserOrder({
          vendorId,
          hotelId,
          orderNumber,
          orderStatus,
          address,
          orderedItems: items,
        });

        // await order.save();
      }
    }

    res.status(200).json({ message: "Order Placed" });

    // if (cart_doc) {
    //   const orderedItems = [];

    //   for (let item of cart_doc.cartItems) {
    //     let itemSellPrice = await HotelItemPrice.findOne({
    //       itemId: item.itemId,
    //       vendorId: item.vendorId
    //     });

    //     if (!itemSellPrice) {
    //       return res.status(404).json({ message: "Item is not linked" });
    //     }
    //     orderedItems.push({
    //       itemId: item.itemId,
    //       price: itemSellPrice.todayCostPrice,
    //       quantity: item.quantity,
    //     });
    //   }

    // await Cart.deleteOne({ hotelId: new ObjectId(hotelId) });

    // } else {
    //   res.status(404).json({ message: "Your Cart is empty" });
    // }
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
    const vendorId = req.body;
    const orderData = await UserOrder.aggregate([
      {
        $match: { hotelId: hotelId, vendorId },
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatuses",
        },
      },
      {
        $unwind: "$orderStatuses",
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
        $unwind: "$orderedItems.itemDetails.images",
      },
      {
        $group: {
          _id: "$_id",
          hotelId: { $first: "$hotelId" },
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          orderStatuses: { $first: "$orderStatuses" },
          orderedItems: { $push: "$orderedItems" },
          isItemAdded: { $first: "$isItemAdded" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);
    res.status(200).json({ orderData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
