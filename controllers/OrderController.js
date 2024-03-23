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

const placeOrder = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;
    const { addressId, vendorId } = req.body;

    console.log(addressId, vendorId);
    if (!addressId) {
      throw new Error("Address not found");
    }
    if (!vendorId) {
      throw new Error("Vendor not found");
    }

    const orderStatus = "65cef0c27ebbb69ab54c55f4";
    const cart_doc = await Cart.findOne({ hotelId: hotelId });

    if (cart_doc) {
      const orderedItems = [];

      for (let item of cart_doc.cartItems) {
        let itemSellPrice = await HotelItemPrice.findOne({
          itemId: item.itemId,
        });

        if (!itemSellPrice) {
          return res.status(404).json({ message: "Item is not linked" });
        }
        orderedItems.push({
          itemId: item.itemId,
          price: itemSellPrice.todayCostPrice,
          quantity: item.quantity,
        });
      }

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
        addressId,
        orderedItems,
      });

      await order.save();

      await Cart.deleteOne({ hotelId: new ObjectId(hotelId) });

      res.status(200).json({ message: "Order Placed" });
    } else {
      res.status(404).json({ message: "Your Cart is empty" });
    }
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

    const orderData = await UserOrder.aggregate([
      {
        $match: { hotelId: hotelId },
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

const orderAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.hotel._id;
    const { duration } = req.body;

    if (!duration) {
      throw new Error("duration is required fields.");
    }
    let orders = {};
    if (duration === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      orders.orders = await UserOrder.find({
        createdAt: { $gte: today },
      }).toArray();
    }
    if (duration === "week") {
      const today = new Date();
      const WeeksAgo = new Date(today);
      WeeksAgo.setDate(today.getDate() - 7);
      orders.orders = await UserOrder.find({
        createdAt: { $gte: WeeksAgo },
      }).toArray();
    }
    if (duration === "month") {
      const today = new Date();
      const MonthAgo = new Date(today);
      MonthAgo.setDate(today.getMonth() - 1);
      orders.orders = await UserOrder.find({
        createdAt: { $gte: MonthAgo },
      }).toArray();
    }
    if (duration === "year") {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      orders.orders = await UserOrder.find({
        createdAt: { $gte: oneYearAgo },
      }).toArray();
    }

    const orderAnalytics = {
      totalSpent: 0,
      catagory: [
        {
          LocalVegetables: 0,
        },
        {
          LocalImportedFruits: 0,
        },
        {
          LocalExoticFruits: 0,
        },
      ],
    };
    for (let order of orders.orders) {
      orderAnalytics.totalSpent += order.totalPrice;
      for (let item of order.orderedItems) {
        const items = await Items.findOne({ _id: item.itemId });
        if (items?.category == "Local Vegetables") {
          orderAnalytics.catagory[0].LocalVegetables += 1;
        } else if (items?.category == "Local & Imported Fruits") {
          orderAnalytics.catagory[1].LocalImportedFruits += 1;
        } else if (items?.category == "Local & Exotic Fruits") {
          orderAnalytics.catagory[2].LocalExoticFruits += 1;
        } else {
        }
      }
    }
    res.status(200).json(orderAnalytics);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderPriceAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.hotel._id;
    const { duration } = req.body;

    if (!duration) {
      throw new Error("duration is required fields.");
    }

    if (duration === "sixmonths") {
      const monthsArray = [];
      const today = new Date();
      today.setMonth(today.getMonth() - 6);
      let currentDate = new Date(today);

      while (currentDate < new Date()) {
        const monthName = new Date(currentDate).toLocaleDateString("en-US", {
          month: "short",
        });
        monthsArray.push({
          month: monthName, // Months are zero-based in JavaScript
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const orders = await UserOrder.find({
        createdAt: { $gte: today },
        UserId: UserId,
      }).toArray();

      const monthlyTotal = new Map(
        monthsArray.map((month) => [month.month, 0])
      );

      // Calculate the total price for each month
      orders.forEach((order) => {
        // const month = order.createdAt.getMonth() + 1; // Months are zero-based in JavaScript
        const monthName = order.createdAt.toLocaleDateString("en-US", {
          month: "short",
        });
        monthlyTotal.set(
          monthName,
          monthlyTotal.get(monthName) + order.totalPrice
        );
      });

      // Convert the map to an array of objects
      const result = Array.from(monthlyTotal, ([month, totalPrice]) => ({
        day: month,
        totalPrice: totalPrice,
      }));
      res.status(200).json(result);
    } else if (duration === "month") {
      const today = new Date();
      today.setDate(today.getDate() - 30);
      // Calculate the sum of totalPrice field for orders created in the last 6 months
      const daysArray = [];

      let currentDate = new Date(today);
      while (currentDate <= new Date()) {
        daysArray.push({
          day: currentDate.getDate(),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const orders = await UserOrder.find({
        createdAt: { $gte: today },
        UserId: UserId,
      }).toArray();

      const dailyTotal = new Map(daysArray.map((day) => [day.day, 0]));

      // Calculate the total price for each day
      orders.forEach((order) => {
        const day = order.createdAt.getDate();
        dailyTotal.set(day, dailyTotal.get(day) + order.totalPrice);
      });

      // Convert the map to an array of objects
      const result = Array.from(dailyTotal, ([day, totalPrice]) => ({
        day: parseInt(day),
        totalPrice: totalPrice,
      }));

      res.status(200).json(result);
    } else if (duration === "week") {
      const today = new Date();
      today.setDate(today.getDate() - 7);
      // Calculate the sum of totalPrice field for orders created in the last 6 months

      const daysArray = [];

      let currentDate = new Date(today);
      while (currentDate <= new Date()) {
        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        daysArray.push({
          day: dayName,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const orders = await UserOrder.find({
        createdAt: { $gte: today },
        UserId: UserId,
      }).toArray();

      const dailyTotal = new Map(daysArray.map((day) => [day.day, 0]));

      // Calculate the total price for each day
      orders.forEach((order) => {
        const dayName = order.createdAt.toLocaleDateString("en-US", {
          weekday: "short",
        });
        dailyTotal.set(dayName, dailyTotal.get(dayName) + order.totalPrice);
      });

      // Convert the map to an array of objects
      const result = Array.from(dailyTotal, ([day, totalPrice]) => ({
        day: day,
        totalPrice: totalPrice,
      }));

      res.status(200).json(result);
    } else {
      throw new Error("Invalid Input");
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const itemAnalyticsForHotel = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.hotel._id;
    const { itemId } = req.body;

    if (!itemId) {
      throw new Error("itemId is required fields.");
    }

    // const data =null;
    async function callApi(UserId, itemId, callback) {
      const reqBody = {
        UserId: UserId,
        itemId: itemId,
      };
      fetch(
        `https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/itemAnalyticsForHotel?secret=alwaysShine`,
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

    callApi(UserId, itemId, function (error, data) {
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
    console.log(orderId);
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
        $unwind: "$orderedItems.itemDetails.images",
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
        },
      },
      {
        $unwind: "$address",
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
  orderAnalytics,
  orderPriceAnalytics,
  itemAnalyticsForHotel,
  compiledOrderForHotel,
  orderDetails,
  allHotelOrders,
};
