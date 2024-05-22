const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
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
          from: "Images",
          localField: "itemId",
          foreignField: "itemId",
          as: "itemDetails.image",
        },
      },
      {
        $unwind: `$itemDetails.image`,
      },
    ]);
    res.status(200).json({ data: data });
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
    const categories = await category.find();

    console.log(categories);

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
      const dayData = { day, price: 0, quantity: { kg: 0, gram: 0 } };

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
            return acc;
          },
          { kg: 0, gram: 0 }
        );

        dayData.quantity.kg += quantity.kg;
        dayData.quantity.gram += quantity.gram;
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
        quantity: { kg: 0, gram: 0 },
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
        quantity: { kg: 0, gram: 0 },
      };

      orders.forEach((order) => {
        monthData.price += order.totalPrice;

        order.orderedItems.forEach((item) => {
          // Add kg directly to the total quantity for the day
          monthData.quantity.kg += item.quantity.kg;

          // Add grams to the total grams for the day
          monthData.quantity.gram += item.quantity.gram;

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
    console.log(itemId, "ii");
    const items = await item.findOne({ _id: itemId });
    const image = await Image.findOne({ itemId: itemId });
    console.log(items, image);
    const itemObj = {
      name: items.name,
      image: image.img,
    };

    return itemObj;
  };
  const today = new Date();
  const filterZeroQuantityItems = (itemsArray) => {
    return itemsArray.filter(
      (item) =>
        item.orderedItems.totalQuantity.kg > 0 ||
        item.orderedItems.totalQuantity.gram > 0
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
        totalQuantity: { kg: 0, gram: 0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;
        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price;
      }
      item.orderedItems = obj;

      console.log(item, "item");

      const info = await getItemName(item.itemId);

      item.name = info.name;
      item.image = info.image;
    }

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
        totalQuantity: { kg: 0, gram: 0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;
        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price;
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

    for (const item of itemDetailsArray) {
      const obj = {
        totalQuantity: { kg: 0, gram: 0 },
        totalPrice: 0,
      };
      for (const order of item.orderedItems) {
        obj.totalQuantity.kg += order.quantity.kg;
        obj.totalQuantity.gram += order.quantity.gram;

        if (obj.totalQuantity.gram >= 1000) {
          const extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms
          obj.totalQuantity.kg += extraKg; // Add extra kilograms
          obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
        }

        obj.totalPrice +=
          order.quantity.kg * order.price +
          (order.quantity.gram / 1000) * order.price;
      }
      item.orderedItems = obj;

      const info = await getItemName(item.itemId);

      item.name = info.name;
      item.image = info.image;
    }

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

module.exports = {
  getAllItemsForHotel,
  myHotelProfile,
  getAllCategories,
  getHotelOrderAnalytics,
  getItemAnalytics,
};
