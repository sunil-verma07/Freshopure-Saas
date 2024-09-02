const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const collectionItems = require("../models/item.js");
const collectionImages = require("../models/image.js");
const db = getDatabase();
const hotels = db.collection("HotelItems");
const HotelItemPrice = require("../models/hotelItemPrice.js");
const category = require("../models/category.js");
const item = require("../models/item.js");
const OrderStatus = require("../models/orderStatus.js");
const VendorItems = require("../models/VendorItems.js");
const UserOrder = require("../models/order.js");
const Image = require("../models/image.js");

const getAllItemsForHotel = catchAsyncError(async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    const HotelId = req.user._id;

    const data = await HotelItemPrice.aggregate([
      {
        $match: { hotelId: HotelId, categoryId: new ObjectId(categoryId) },
      },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: `$itemDetails`,
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
        $unwind: `$vendorDetails`,
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorId",
          foreignField: "userId",
          as: "vendorNameDetails",
        },
      },
      {
        $unwind: `$vendorNameDetails`,
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemId",
          foreignField: "itemId",
          as: "itemDetails.image",
        },
      },
      {
        $unwind: `$itemDetails.image`,
      },
      {
        $lookup: {
          from: "HotelVendorLink", // The name of the collection
          let: { vendorId: "$vendorId", hotelId: "$hotelId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$vendorId", "$$vendorId"] },
                    { $eq: ["$hotelId", "$$hotelId"] },
                  ],
                },
              },
            },
            {
              $project: { isPriceFixed: 1 },
            },
          ],
          as: "hotelVendorLinkDetails",
        },
      },
      {
        $unwind: "$hotelVendorLinkDetails",
      },
      {
        $match: { todayCostPrice: { $gt: 0 } }, // Filter out documents where todayCostPrice is 0 or NaN
      },
      {
        $addFields: {
          isPriceFixed: "$hotelVendorLinkDetails.isPriceFixed",
        },
      },
      {
        $project: {
          hotelVendorLinkDetails: 0, // Optionally remove the hotelVendorLinkDetails field
        },
      },
      {
        // Group items under a single vendor
        $group: {
          _id: "$vendorId",
          vendorDetails: { $first: "$vendorDetails" },
          vendorNameDetails: { $first: "$vendorNameDetails" },
          items: {
            $push: {
              itemId: "$itemId",
              itemDetails: "$itemDetails",
              todayCostPrice: "$todayCostPrice",
              isPriceFixed: "$isPriceFixed",
            },
          },
        },
      },
      {
        $project: {
          _id: 0, // Hide the _id field in the final output
        },
      },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


const myHotelProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findOne({ _id: userId }).populate("roleId");
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthenticated User" });
  } else {
    return res.status(200).json({ success: true, user: user });
  }
});

const getAllCategories = catchAsyncError(async (req, res, next) => {
  try {
    // console.log("reached");
    const categories = await category.find();

    // console.log(categories, "categories");

    return res.json({ categories });
  } catch (error) {
    return res.json({ message: "Internal Error" });
  }
});

const getHotelOrderAnalytics = catchAsyncError(async (req, res, next) => {
  const hotelId = req.user._id;

  const { duration } = req.body;

  const status = await OrderStatus.findOne({ status: "Cancelled" });
  const today = new Date();
  async function getLastWeekData() {
    const result = [];
    const weekEnd = new Date(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const orders = await UserOrder.find({
      hotelId: hotelId,
      createdAt: { $gte: weekStart, $lte: weekEnd },
      orderStatus: { $ne: status._id },
    });

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const day = daysOfWeek[(today.getDay() + 7 - i) % 7];
      const dayData = { day, price: 0, quantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 } };

      const dayOrders = orders.filter((order) => {
        const orderDay = order.createdAt.toLocaleDateString("en-US", {
          weekday: "short",
        });
        return orderDay === day;
      });

      dayOrders.forEach((order) => {
        dayData.price += order.totalPrice;

        const quantity = order.orderedItems.reduce(
          (acc, item) => {
            acc.kg += item.quantity.kg;
            acc.gram += item.quantity.gram;
            acc.piece += item.quantity.piece;
            acc.packet += item.quantity.packet;
            acc.litre += item.quantity.litre;
            return acc;
          },
          { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 }
        );

        dayData.quantity.kg += quantity.kg;
        dayData.quantity.gram += quantity.gram;
        dayData.quantity.piece += quantity.piece;
        dayData.quantity.packet += quantity.packet;
        dayData.quantity.litre += quantity.litre;
      });

      result.push(dayData);
    }

    return result;
  }

  async function getLastMonthData() {
    const result = [];
    const monthEnd = new Date(today); // Month end is today
    const monthStart = new Date(today); // Month start is 30 days before today
    monthStart.setDate(today.getDate() - 30);

    // Find orders within the last month
    const orders = await UserOrder.find({
      hotelId: hotelId,
      createdAt: { $gte: monthStart, $lte: monthEnd },
      orderStatus: { $ne: status._id },
    });

    // Loop through each day of the month starting from today and going back 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dayData = {
        day: currentDate.getDate(),
        price: 0,
        quantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 },
      };

      // Find orders for the current day
      const dayOrders = orders.filter((order) => {
        return order.createdAt.toDateString() === currentDate.toDateString();
      });

      // Aggregate data for the current day
      dayOrders.forEach((order) => {
        dayData.price += order.totalPrice;

        order.orderedItems.forEach((item) => {
          // Add kg directly to the total quantity for the day
          dayData.quantity.kg += item.quantity.kg;

          // Add grams to the total grams for the day
          dayData.quantity.gram += item.quantity.gram;
          dayData.quantity.piece += item.quantity.piece;
          dayData.quantity.packet += item.quantity.packet;
          dayData.quantity.litre += item.quantity.litre;

          // Adjust kg and gram if gram value exceeds 1000
          if (dayData.quantity.gram >= 1000) {
            dayData.quantity.kg += Math.floor(dayData.quantity.gram / 1000);
            dayData.quantity.gram %= 1000;
          }
        });
      });

      // Insert current day's data at the beginning of the result array
      result.unshift(dayData);
    }

    // Return the result
    return result.reverse();
  }

  async function getLastSixMonthsData() {
    const result = [];

    // Loop through the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        0
      ); // End of the current month
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1); // Start of the current month

      // Find orders within the current month
      const orders = await UserOrder.find({
        hotelId: hotelId,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        orderStatus: { $ne: status._id },
      });

      // Aggregate data for the current month
      const monthData = {
        month: monthStart.toLocaleString("default", { month: "long" }),
        year: monthStart.getFullYear(),
        price: 0,
        quantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 },
      };

      orders.forEach((order) => {
        monthData.price += order.totalPrice;

        order.orderedItems.forEach((item) => {
          // Add kg directly to the total quantity for the day
          monthData.quantity.kg += item.quantity.kg;

          // Add grams to the total grams for the day
          monthData.quantity.gram += item.quantity.gram;
          monthData.quantity.piece += item.quantity.piece;
          monthData.quantity.packet += item.quantity.packet;
          monthData.quantity.litre += item.quantity.litre;

          // Adjust kg and gram if gram value exceeds 1000
          if (monthData.quantity.gram >= 1000) {
            monthData.quantity.kg += Math.floor(monthData.quantity.gram / 1000);
            monthData.quantity.gram %= 1000;
          }
        });
      });

      result.unshift(monthData); // Add the month's data to the beginning of the result array
    }

    return result.reverse();
  }

  if (duration === "week") {
    return getLastWeekData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else if (duration === "month") {
    return getLastMonthData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else if (duration === "sixMonths") {
    return getLastSixMonthsData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else {
    return res.status(404).json({ error: "Incorrect duration selected" });
  }
});

const getItemAnalytics = catchAsyncError(async (req, res, next) => {
  const hotelId = req.user._id;

  const { duration } = req.body;

  const status = await OrderStatus.findOne({ status: "Cancelled" });
  let itemDetailsArray = [];

  const getItemName = async (itemId) => {
    // console.log(itemId, "ii");
    const items = await item.findOne({ _id: itemId });
    const image = await Image.findOne({ itemId: itemId });
    // console.log(items, image);
    const itemObj = {
      name: items?.name,
      image: image?.img,
    };

    return itemObj;
  };
  const today = new Date();
  const filterZeroQuantityItems = (itemsArray) => {
    return itemsArray.filter(
      (item) =>
        item.orderedItems.totalQuantity.kg > 0 ||
        item.orderedItems.totalQuantity.gram > 0 ||
        item.orderedItems.totalQuantity.piece > 0 ||
        item.orderedItems.totalQuantity.packet > 0 ||
        item.orderedItems.totalQuantity.litre > 0 
    );
  };
  async function getLastWeekData() {
    const result = [];
    const weekEnd = new Date(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const orders = await UserOrder.find({
      hotelId: hotelId,
      createdAt: { $gte: weekStart, $lte: weekEnd },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await HotelItemPrice.find({ hotelId: hotelId });

    const itemDetails = itemsList.reduce((acc, item) => {
      acc[item.itemId] = {
        itemId: item.itemId,
        todayCostPrice: item.todayCostPrice,
        orderedItems: [],
      };

      return acc;
    }, {});

    // Iterate through orders and add ordered items details to itemDetails
    orders.forEach((order) => {
      order.orderedItems.forEach(async (orderedItem) => {
        const itemId = orderedItem.itemId;
        if (itemDetails[itemId]) {
          // If the item exists in itemDetails, add ordered item details to it
          itemDetails[itemId].orderedItems.push(orderedItem);
        }
      });
    });

    itemDetailsArray = Object.values(itemDetails);

    for (const item of itemDetailsArray) {
      const obj = {
        totalQuantity: { kg: 0, gram: 0, piece:0, packet:0, litre:0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;
        obj.totalQuantity.packet += order.quantity.packet;
        obj.totalQuantity.piece += order.quantity.piece;
        obj.totalQuantity.litre += order.quantity.litre;

        
        if (obj.totalQuantity.gram >= 1000) {
          const extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms
          obj.totalQuantity.kg += extraKg; // Add extra kilograms
          obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
        }
        
        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price +
          order.quantity.piece * order.price +
          order.quantity.packet * order.price +
          order.quantity.litre * order.price;
      }
      item.orderedItems = obj;

      // console.log(item, "item");

      const info = await getItemName(item.itemId);

      item.name = info.name;
      item.image = info.image;
    }

    // console.log(JSON.stringify(itemDetailsArray, null, 2));
    return filterZeroQuantityItems(itemDetailsArray); // Returning reversed orders as before
  }

  async function getLastMonthData() {
    const result = [];
    const monthEnd = new Date(today); // Month end is today
    const monthStart = new Date(today); // Month start is 30 days before today
    monthStart.setDate(today.getDate() - 30);

    // Find orders within the last month
    const orders = await UserOrder.find({
      hotelId: hotelId,
      createdAt: { $gte: monthStart, $lte: monthEnd },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await HotelItemPrice.find({ hotelId: hotelId });

    const itemDetails = itemsList.reduce((acc, item) => {
      acc[item.itemId] = {
        itemId: item.itemId,
        todayCostPrice: item.todayCostPrice,
        orderedItems: [],
      };
      return acc;
    }, {});

    // Iterate through orders and add ordered items details to itemDetails
    orders.forEach((order) => {
      order.orderedItems.forEach(async (orderedItem) => {
        const itemId = orderedItem.itemId;
        if (itemDetails[itemId]) {
          // If the item exists in itemDetails, add ordered item details to it
          itemDetails[itemId].orderedItems.push(orderedItem);
        }
      });
    });

    itemDetailsArray = Object.values(itemDetails);

    for (const item of itemDetailsArray) {
      const obj = {
        totalQuantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;
        obj.totalQuantity.piece += order.quantity.piece;
        obj.totalQuantity.packet += order.quantity.packet;
        obj.totalQuantity.litre += order.quantity.litre;

        
        if (obj.totalQuantity.gram >= 1000) {
          const extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms
          obj.totalQuantity.kg += extraKg; // Add extra kilograms
          obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
        }

        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price +
          order.quantity.piece * order.price +
          order.quantity.packet * order.price +
          order.quantity.litre * order.price 
          ;
      }
      item.orderedItems = obj;

      const info = await getItemName(item.itemId);

      item.name = info.name;
      item.image = info.image;
    }

    return filterZeroQuantityItems(itemDetailsArray);
  }

  async function getLastSixMonthsData() {
    const result = [];

    // Loop through the last 6 months
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Six months ago from the current month

    // Calculate start and end dates for the six-month period
    const startDate = new Date(
      sixMonthsAgo.getFullYear(),
      sixMonthsAgo.getMonth(),
      1
    ); // Start of the first month
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of the last month

    // Find orders within the past six months
    const orders = await UserOrder.find({
      hotelId: hotelId,
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await HotelItemPrice.find({
      hotelId: hotelId,
    });

    const itemDetails = itemsList.reduce((acc, item) => {
      acc[item.itemId] = {
        itemId: item.itemId,
        todayCostPrice: item.todayCostPrice,
        orderedItems: [],
      };
      return acc;
    }, {});

    // Iterate through orders and add ordered items details to itemDetails
    orders.forEach((order) => {
      order.orderedItems.forEach(async (orderedItem) => {
        const itemId = orderedItem.itemId;
        if (itemDetails[itemId]) {
          // If the item exists in itemDetails, add ordered item details to it
          itemDetails[itemId].orderedItems.push(orderedItem);
        }
      });
    });

    itemDetailsArray = Object.values(itemDetails);

    // console.log(JSON.stringify(itemDetailsArray[0]))

    for (const item of itemDetailsArray) {
      const obj = {
        totalQuantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;
        obj.totalQuantity.piece += order.quantity.piece;
        obj.totalQuantity.packet += order.quantity.packet;
        obj.totalQuantity.litre += order.quantity.litre;

        if (obj.totalQuantity.gram >= 1000) {
          const extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms
          obj.totalQuantity.kg += extraKg; // Add extra kilograms
          obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
        }

        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price +
          order.quantity.piece * order.price +
          order.quantity.packet * order.price +
          order.quantity.litre * order.price 
          ;
      }
      item.orderedItems = obj;

      const info = await getItemName(item.itemId);

      item.name = info.name;
      item.image = info.image;
    }

    // console.log(JSON.stringify(itemDetailsArray, null));

    return filterZeroQuantityItems(itemDetailsArray);
  }

  if (duration === "week") {
    return getLastWeekData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else if (duration === "month") {
    return getLastMonthData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else if (duration === "sixMonths") {
    return getLastSixMonthsData(today)
      .then((data) => res.status(200).json({ data }))
      .catch((err) => console.log(err));
  } else {
    return res.status(404).json({ error: "Incorrect duration selected" });
  }
});

// const getItemAnalytics = catchAsyncError(async (req, res, next) => {
//   const hotelId = req.user._id;
//   const { duration } = req.body;

//   const status = await OrderStatus.findOne({ status: "Cancelled" });
//   let itemDetailsArray = [];

//   const getItemName = async (itemId) => {
//     const items = await item.findOne({ _id: itemId });
//     const image = await Image.findOne({ itemId: itemId });
//     return {
//       name: items?.name,
//       image: image?.img,
//     };
//   };

//   const today = new Date();

//   const filterZeroQuantityItems = (itemsArray) => {
//     return itemsArray.filter(
//       (item) =>
//         item.orderedItems.totalQuantity.kg > 0 ||
//         item.orderedItems.totalQuantity.gram > 0 ||
//         item.orderedItems.totalQuantity.piece > 0 ||
//         item.orderedItems.totalQuantity.packet > 0 ||
//         item.orderedItems.totalQuantity.litre > 0
//     );
//   };

//   const getItemDataForPeriod = async (startDate, endDate) => {
//     const orders = await UserOrder.find({
//       hotelId: hotelId,
//       createdAt: { $gte: startDate, $lte: endDate },
//       orderStatus: { $ne: status._id },
//     });

//     const itemsList = await HotelItemPrice.find({ hotelId: hotelId });

//     const itemDetails = itemsList.reduce((acc, item) => {
//       acc[item.itemId] = {
//         itemId: item.itemId,
//         todayCostPrice: item.todayCostPrice,
//         orderedItems: [],
//       };
//       return acc;
//     }, {});

//     // Iterate through orders and add ordered items details to itemDetails
//     for (const order of orders) {
//       for (const orderedItem of order.orderedItems) {
//         const itemId = orderedItem.itemId;
//         if (itemDetails[itemId]) {
//           itemDetails[itemId].orderedItems.push(orderedItem);
//         }
//       }
//     }

//     itemDetailsArray = Object.values(itemDetails);

//     for (const item of itemDetailsArray) {
//       const obj = {
//         totalQuantity: { kg: 0, gram: 0, piece: 0, packet: 0, litre: 0 },
//         totalPrice: 0,
//       };
//       for (const order of item.orderedItems) {
//         obj.totalQuantity.kg += order.quantity.kg;
//         obj.totalQuantity.gram += order.quantity.gram;
//         obj.totalQuantity.piece += order.quantity.piece;
//         obj.totalQuantity.packet += order.quantity.packet;
//         obj.totalQuantity.litre += order.quantity.litre;

//         if (obj.totalQuantity.gram >= 1000) {
//           const extraKg = Math.floor(obj.totalQuantity.gram / 1000);
//           obj.totalQuantity.kg += extraKg;
//           obj.totalQuantity.gram %= 1000;
//         }

//         obj.totalPrice +=
//           order.quantity.kg * order.price +
//           (order.quantity.gram / 1000) * order.price +
//           order.quantity.piece * order.price +
//           order.quantity.packet * order.price +
//           order.quantity.litre * order.price;
//       }
//       item.orderedItems = obj;

//       const info = await getItemName(item.itemId);
//       item.name = info.name;
//       item.image = info.image;
//     }

//     return filterZeroQuantityItems(itemDetailsArray);
//   };

//   const getLastWeekData = async () => {
//     const weekEnd = new Date(today);
//     const weekStart = new Date(today);
//     weekStart.setDate(today.getDate() - 6);
//     return getItemDataForPeriod(weekStart, weekEnd);
//   };

//   const getLastMonthData = async () => {
//     const monthEnd = new Date(today);
//     const monthStart = new Date(today);
//     monthStart.setDate(today.getDate() - 30);
//     return getItemDataForPeriod(monthStart, monthEnd);
//   };

//   const getLastSixMonthsData = async () => {
//     const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
//     const startDate = new Date(
//       sixMonthsAgo.getFullYear(),
//       sixMonthsAgo.getMonth(),
//       1
//     );
//     const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     return getItemDataForPeriod(startDate, endDate);
//   };

//   if (duration === "week") {
//     getLastWeekData()
//       .then((data) => res.status(200).json({ data }))
//       .catch((err) => next(err));
//   } else if (duration === "month") {
//     getLastMonthData()
//       .then((data) => res.status(200).json({ data }))
//       .catch((err) => next(err));
//   } else if (duration === "sixMonths") {
//     getLastSixMonthsData()
//       .then((data) => res.status(200).json({ data }))
//       .catch((err) => next(err));
//   } else {
//     res.status(400).json({ error: "Incorrect duration selected" });
//   }
// });


const totalSales = catchAsyncError(async (req, res, next) => {
  try {
    const hotel = req.user._id;

    const status = await OrderStatus.findOne({ status: "Delivered" });
    const orders = await UserOrder.find({
      hotelId: hotel,
      orderStatus: status._id,
    });
    // console.log(hotel);
    let total = 0;
    orders.map((order) => {
      // console.log(order, "orderr");

      total += order.totalPrice;
    });

    // console.log(total, "total");
    return res.json({
      sales: total,
    });
  } catch (error) {
    console.log(error, "errr");
    return res.status(500).json({ message: "Internal server error" });
  }
});

const deleteHotelOrders = catchAsyncError(async (req, res, next) => {
  const hotelIdString = req.body.hotelId; // Assuming the hotel ID is sent in the request body
  const hotelId = new mongoose.Types.ObjectId(hotelIdString); // Convert the string to ObjectId

  try {
    // Delete all orders for the specific hotel ID
    const result = await UserOrder.deleteMany({ hotelId: hotelId });

    if (result.deletedCount > 0) {
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} order(s) deleted successfully.`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No orders found for this hotel ID.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting orders.",
      error: error.message,
    });
  }
});


module.exports = {
  getAllItemsForHotel,
  myHotelProfile,
  getAllCategories,
  getHotelOrderAnalytics,
  getItemAnalytics,
  totalSales,
  deleteHotelOrders
};
