const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const Wishlist = require("../models/wishlist.js");
const HotelItemPrice = require("../models/hotelItemPrice.js");
const VendorItems = require("../models/VendorItems.js");
const db = getDatabase();
const HotelVendorLink = require("../models/hotelVendorLink.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const SubVendor = require("../models/subVendor.js");
const { sendWhatsappmessge } = require("../utils/sendWhatsappNotification.js");
const user = require("../models/user.js");
const Image = require("../models/image.js");
const Orders = require("../models/order.js");
const vendorStock = require("../models/vendorStock.js");
const puppeteer = require("puppeteer");
const UserOrder = require("../models/order.js");
const Items = require("../models/item");
const { isObjectIdOrHexString, trusted } = require("mongoose");
const vendorCategories = require("../models/vendorCategories.js");
const tf = require("@tensorflow/tfjs");
const { messageToSubvendor } = require("../utils/messageToSubVendor.js");
const image = require("../models/image.js");
const OrderStatus = require("../models/orderStatus.js");
const PaymentPlan = require("../models/paymentPlan.js");
const hotelItemPrice = require("../models/hotelItemPrice.js");
const { generatePaymentToken } = require("../utils/jwtToken.js");
const hotelVendorLink = require("../models/hotelVendorLink.js");
const { isPrimitive } = require("util");
const userDetails = require("../models/userDetails.js");
const CompiledOrder = require("../models/compiledOrder.js");

const setHotelItemPrice = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, hotelId, categoryId, price } = req.body;

    const vendorId = req.user._id;

    if (!itemId || !hotelId || !price || !categoryId) {
      throw new Error("All fields are required.");
    }

    const linkPresent = await HotelVendorLink.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new Object(hotelId),
    });

    if (!linkPresent) {
      return res.status(500).json({ message: "Hotel is not linked to vendor" });
    }

    const itemPresent = await HotelItemPrice.findOne({
      $and: [
        { vendorId: new ObjectId(vendorId) },
        { hotelId: new ObjectId(hotelId) },
        { itemId: new ObjectId(itemId) },
      ],
    });

    if (!itemPresent) {
      await HotelItemPrice.create({
        vendorId: vendorId,
        hotelId: hotelId,
        itemId: itemId,
        categoryId: categoryId,
        todayCostPrice: price,
      });

      res.status(200).json({ message: "Price updated successfully." });
    } else {
      itemPresent.yesterdayCostPrice = itemPresent.todayCostPrice;
      itemPresent.todayCostPrice = price;

      await itemPresent.save();

      const items = await getHotelItemsFunc(hotelId, vendorId);

      res
        .status(200)
        .json({ message: "Price updated successfully.", data: items });
    }
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderHistoryForVendors = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const pageSize = 7;
    const { offset, status, date } = req.query;

    const statusId = await OrderStatus.findOne({ status: status });

    const pipeline = [
      {
        $match: {
          vendorId: vendorId,
          orderStatus: new ObjectId(statusId._id),
        },
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
        $unwind: "$orderedItems",
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "images",
        },
      },
      { $unwind: "$images" },
      {
        $group: {
          _id: "$_id",
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          totalPrice: { $first: "$totalPrice" },
          address: { $first: "$address" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          hotelId: { $first: "$hotelId" },
          vendorDetails: { $first: "$vendorDetails" },
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
          _id: 1,
          hotelId: 1,
          vendorDetails: 1,
          orderNumber: 1,
          isReviewed: 1,
          totalPrice: 1,
          address: 1,
          createdAt: 1,
          updatedAt: 1,
          orderStatusDetails: 1,
          orderedItems: 1,
        },
      },
      // {
      //   $sort: {
      //     createdAt: -1,
      //   },
      // },
      // {
      //   $skip: parseInt(offset),
      // },
      // {
      //   $limit: pageSize,
      // },
    ];

    let filterDate = `${
      new Date(date).getFullYear() +
      "-" +
      new Date(date).getMonth() +
      "-" +
      new Date(date).getDate()
    }`;

    let currentDate = `${
      new Date().getFullYear() +
      "-" +
      new Date().getMonth() +
      "-" +
      new Date().getDate()
    }`;

    console.log(filterDate, currentDate, "date read outside");
    if (filterDate !== currentDate) {
      console.log(filterDate, currentDate, "date read");
      // console log: Fri Jun 21 2024 13:08:56 GMT 0530 2024-06-21T07:38:56.603Z date read
      let startDate = new Date(new Date(date).setHours(0, 0, 0, 0));
      let endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

      pipeline.push({
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      });
    }

    // Add sorting, skipping, and limiting after potential date filtering
    pipeline.push(
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $skip: parseInt(offset) },
      { $limit: pageSize }
    );

    const orderData = await UserOrder.aggregate(pipeline);
    // console.log(
    //   "data:" + orderData.length,
    //   "offset:" + offset,
    //   "page size: " + pageSize
    // );
    orderData.map((order) => {
      // console.log(order._id);
    });

    res.status(200).json({
      status: "success",
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
});

const hotelsLinkedWithVendor = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    console.log(vendorId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          hotelDetails: {
            $mergeObjects: ["$hotelDetails", "$userDetails"],
          },
        },
      },
      {
        $lookup: {
          from: "orders", // Assuming Orders is the collection that stores order data
          localField: "hotelId",
          foreignField: "hotelId",
          as: "orderData",
        },
      },
      {
        $addFields: {
          // Ensure sorting by order creation date to get the most recent order
          mostRecentOrder: {
            $arrayElemAt: [
              {
                $filter: {
                  input: {
                    $map: {
                      input: "$orderData",
                      as: "order",
                      in: {
                        createdAt: "$$order.createdAt",
                      },
                    },
                  },
                  as: "order",
                  cond: { $ne: ["$$order.createdAt", null] },
                },
              },
              -1,
            ],
          },
        },
      },
      {
        $addFields: {
          orderPlacedToday: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$mostRecentOrder", null] },
                  { $gte: ["$mostRecentOrder.createdAt", today] },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $project: {
          hotelId: 1,
          hotelDetails: 1,
          orderData: 1,
          mostRecentOrder: 1,
          orderPlacedToday: 1,
          isPriceFixed: 1,
          debugOrderCreatedAt: 1,
          debugToday: 1,
        },
      },
      {
        $sort: { orderPlacedToday: -1, "mostRecentOrder.createdAt": -1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
});

const todayCompiledOrders = catchAsyncError(async (req, res, next) => { 
  const vendorId = req.user._id;
  const today = new Date(); 
  today.setHours(3, 0, 0, 0); 

  try {
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(3, 0, 0, 0);

    const compiledOrders = await CompiledOrder.aggregate([
      {
        $match: {
          vendorId: new ObjectId(vendorId),
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "Items",
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: {
          path: "$itemDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Images",
          localField: "items.itemId",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $unwind: {
          path: "$itemImages",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "items.hotels.hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },

      {
        $group: {
          _id: "$_id",
          vendorId: { $first: "$vendorId" },
          date: { $first: "$date" },
          items: {
            $push: {
              itemId: "$items.itemId",
              totalQuantity: "$items.totalQuantity",
              quantityToBeOrder: "$items.quantityToBeOrder",
              hotels: {
                $map: {
                  input: "$items.hotels",
                  as: "hotel",
                  in: {
                    hotelId: "$$hotel.hotelId",
                    quantity: "$$hotel.quantity",
                    hotelDetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$hotelDetails",
                            as: "detail",
                            cond: { $eq: ["$$detail._id", "$$hotel.hotelId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              itemDetails: "$itemDetails",
              itemImages: "$itemImages",
            },
          },
        },
      },
    ]);

    // Populate subVendorCode for each item
    for (const order of compiledOrders) {
      for (const item of order.items) {
        const subVendor = await SubVendor.findOne({
          vendorId: vendorId,
          assignedItems: { $elemMatch: { itemId: item.itemId } },
        });

        item.subVendorCode = subVendor
          ? subVendor.subVendorCode
          : "Not Assigned";
      }
    }

    for (const order of compiledOrders) {
      for (const item of order.items) {
        const vendorItem = await VendorItems.findOne({
          vendorId: vendorId,
          items: { $elemMatch: { itemId: item.itemId } },
        });

        if (vendorItem) {
          const matchedItem = vendorItem.items.find(
            (i) => i.itemId.toString() === item.itemId.toString()
          );
          item.stockQuantity = matchedItem
            ? matchedItem.totalQuantity
            : "Not found in stock";
        } else {
          item.stockQuantity = "Not found in stock";
        }
      }
    }

    // Send the response with compiled orders
    res.status(200).json({
      status: "success",
      data: compiledOrders[0] || {},
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

const vendorItem = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const AllItems = await HotelItemPrice.find({ vendorId }).select("itemId");
    const AssignedItems = await SubVendor.find({ vendorId }).select(
      "assignedItems"
    );

    let assignedItemsArray = [];
    for (let item of AssignedItems) {
      assignedItemsArray.push(...item.assignedItems);
    }

    const Items = AllItems.filter(
      (obj1) =>
        !assignedItemsArray.some((obj2) => obj1.itemId.equals(obj2.itemId))
    );

    res.status(200).json({ success: true, Items }); // Sending the items back to the client
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getAllSubVendors = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const data = await SubVendor.find({ vendorId: vendorId });

    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    next(error);
  }
});


const getHotelItemList = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { HotelId } = req.body;
    // console.log(vendorId, HotelId, "yes");

    const pipeline = [
      {
        $match: {
          vendorId: new ObjectId(vendorId),
          hotelId: new ObjectId(HotelId),
        },
      },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
          foreignField: "_id",
          as: "items",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemId",
          foreignField: "itemId",
          as: "items.image",
        },
      },
      {
        $unwind: "$items.image",
      },
      {
        $lookup: {
          from: "Category",
          localField: "categoryId",
          foreignField: "_id",
          as: "items.category",
        },
      },
      {
        $unwind: "$items.category",
      },
    ];
    // Fetch items associated with the vendor and hotelId, populating the associated item's fields
    const itemList = await HotelItemPrice.aggregate(pipeline);

    return res.json({ data: itemList});
  } catch (error) {
    throw error;
  }
});

const getAllOrdersbyHotel = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { date, HotelId } = req.query;

    const pipeline = [
      {
        $match: {
          vendorId: vendorId,
          hotelId: new ObjectId(HotelId),
        },
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
        $unwind: "$orderedItems",
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "images",
        },
      },
      { $unwind: "$images" },
      {
        $group: {
          _id: "$_id",
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          totalPrice: { $first: "$totalPrice" },
          notes:{ $first: "$notes"},
          address: { $first: "$address" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          hotelId: { $first: "$hotelId" },
          vendorDetails: { $first: "$vendorDetails" },
          orderStatusDetails: { $first: "$orderStatusDetails" },
          orderedItems: {
            $push: {
              itemId: "$orderedItems.itemId",
              price: "$orderedItems.price",
              quantity: "$orderedItems.quantity",
              itemDetails: "$itemDetails",
              image: "$images",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          hotelId: 1,
          vendorDetails: 1,
          orderNumber: 1,
          isReviewed: 1,
          totalPrice: 1,
          address: 1,
          notes:1,
          createdAt: 1,
          updatedAt: 1,
          orderStatusDetails: 1,
          orderedItems: 1,
        },
      },
    ];

    let filterDate = `${
      new Date(date).getFullYear() +
      "-" +
      new Date(date).getMonth() +
      "-" +
      new Date(date).getDate()
    }`;

    let currentDate = `${
      new Date().getFullYear() +
      "-" +
      new Date().getMonth() +
      "-" +
      new Date().getDate()
    }`;

    console.log(typeof filterDate, typeof currentDate, "date read outside");
    if (filterDate !== currentDate) {
      console.log(filterDate, currentDate, "date read");

      let startDate = new Date(new Date(date).setHours(0, 0, 0, 0));
      let endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      });
    }

    // Add sorting, skipping, and limiting after potential date filtering
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });

    const orderData = await UserOrder.aggregate(pipeline);

    res.json({ hotelOrders: orderData });
  } catch (error) {
    next(error);
  }
});

const updateStock = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    const vendorId = req.user._id;

    // console.log(quantity, "quantity");
    if (!itemId || !quantity) {
      return res.status(400).json({ message: "All the fields are required!" });
    }

    let item = await vendorStock.findOne({ vendorId });
    if (!item) {
      // Create a new stock entry if it doesn't exist
      item = new vendorStock({
        vendorId: vendorId,
        stocks: [
          {
            itemId: itemId,
            quantity: {
              kg: 0,
              gram: 0,
              piece: 0,
              packet: 0,
            },
          },
        ],
      });
    }

    // Update the quantity of the item in the stock
    const stocks = item.stocks.map((stock) => {
      if (stock.itemId.toString() === itemId) {
        return {
          itemId: itemId,
          quantity: {
            kg: quantity.kg,
            gram: quantity.gram,
            piece: quantity?.piece || stock?.quantity?.piece,
            packet: quantity?.packet || stock?.quantity?.packet,
          },
        };
      }
      return stock;
    });

    item.stocks = stocks;
    await item.save();

    const vendorStocks = await getVendorStockFunc(vendorId);

    const updatedStock = vendorStocks.find(
      (item) => item.itemId.toString() === itemId.toString()
    );
    // console.log(updatedStock, "updated");
    if (vendorStocks.length > 0) {
      res.json({
        message: "Stock updated successfully",
        data: updatedStock,
      });
    }
  } catch (error) {
    next(error);
  }
});

const generateInvoice = catchAsyncError(async (req, res, next) => {
  const { orderId } = req.body;

  try {
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
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$orderStatus",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$hotelDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorDetails",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$vendorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$orderedItems",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$orderedItems.itemDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Category",
          localField: "orderedItems.itemDetails.categoryId",
          foreignField: "_id",
          as: "orderedItems.itemDetails.category",
        },
      },
      {
        $unwind: {
          path: "$orderedItems.itemDetails.category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          orderStatus: { $first: "$orderStatus" },
          hotelDetails: { $first: "$hotelDetails" },
          vendorDetails: { $first: "$vendorDetails" },
          orderedItems: { $push: "$orderedItems" },
          address: { $first: "$address" },
          orderNumber: { $first: "$orderNumber" },
          createdAt:{ $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelDetails._id",
          foreignField: "userId",
          as: "hotelDetails.userDetails",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $addFields: {
          "hotelDetails.userDetails": {
            $arrayElemAt: ["$hotelDetails.userDetails", 0],
          },
        },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorDetails._id",
          foreignField: "userId",
          as: "vendorDetails.userDetails",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $addFields: {
          "vendorDetails.userDetails": {
            $arrayElemAt: ["$vendorDetails.userDetails", 0],
          },
        },
      },
    ]).allowDiskUse(true);

    const data = orderData[0];


    const styles = {
      container: {
        fontFamily: "Arial, sans-serif",
        marginBottom: "30px",
        width: "520px",
        margin: "auto",
        paddingRight: "10px",
        borderRadius: "8px",
        background: "#fff",
        position:"relative",
      },
      header: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px",
      },
      logo: {
        maxWidth: "50px",
        maxHeight: "50px",
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "10px",
      },
      th: {
        border: "1px solid #ddd",
        padding: "4px",
        textAlign: "left",
        background: "#f2f2f2",
        fontSize: "6px",
      },
      td: {
        border: "1px solid #ddd",
        padding: "4px",
        fontSize: "6px",
      },
      total: {
        border: "1px solid #ddd",
        padding: "4px",
        fontSize: "6px",
        fontWeight: "600",
      },

    };

    const date = (createdOnString) => {
      const createdOn = new Date(createdOnString);

      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };

      const formattedDateTime = new Intl.DateTimeFormat(
        "en-US",
        options
      ).format(createdOn);

      return `${formattedDateTime}`;
    };

    const totalPrice = (items) => {
      let totalPrice = 0;
      for (let item of items) {
        totalPrice +=
          item.price * item.quantity?.kg +
          item.price * (item.quantity?.gram / 1000)+
          item.price * item.quantity?.piece +
          item.price * item.quantity?.packet;

      }

      return totalPrice;
    };


    function extractDate(dateString) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(date.getDate()).padStart(2, '0');
    
      return `${year}-${month}-${day}`;
    }

    const currentDate = Date.now()

    const generateInlineStyles = (styles) => {
      return Object.keys(styles)
        .map((key) => `${key}:${styles[key]}`)
        .join(";");
    };

    let html = `
    <div style="${generateInlineStyles(styles.container)}">
      <div style="${generateInlineStyles(styles.header)}">
        
        <!-- <img src={Logo} alt="Logo" style=${generateInlineStyles(
          styles.logo
        )} /> -->
        <div style="display:flex;justify-content:"space-between"">
          <h1 style="font-weight:600;font-size:24px;">INVOICE</h1>
        </div>

         <div style="margin-left:auto">
          <p style="line-height:1.4em;font-size:12px;text-align:right">Date of Order: ${
          extractDate(data?.createdAt)
        } <br/> </p>

        <p style="line-height:1.4em;font-size:12px;text-align:right">Date of Billing: ${
          extractDate(currentDate)
        } <br/> </p>
         </div>


      </div>
      <div style="display:flex;justify-content:space-between">
        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;">Hello, ${
          data?.hotelDetails?.userDetails?.fullName
        }.<br/>Thank you for shopping from ${
      data?.vendorDetails?.userDetails?.organization
    }.</p>
        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;text-align:right">Order Number #${
          data?.orderNumber
        } <br/> </p>

         

      </div>
      <div style="display:flex;margin-bottom:10px">
        <div style="border:1px solid #ddd ;flex:1;margin-right:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">${
            data?.vendorDetails?.userDetails?.organization
          }</p>

           <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;">
           ${data?.vendorDetails?.userDetails?.fullName}
          </p>

          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          Rajasthan
          302017
          </p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          GSTIN/UIN: ${data?.vendorDetails?.userDetails?.GSTnumber}
          </p> 
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : Rajasthan, Code : 08
          
          </p>
        </div>
        <div style="border:1px solid #ddd ;flex:1;margin-left:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">${
            data?.hotelDetails?.userDetails?.organization
          }</p>

           <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;">
           ${data?.hotelDetails?.userDetails?.fullName}
          </p>

          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          ${data?.address?.addressLine1},${data?.address?.addressLine2},${
      data?.address?.city
    }
          ,${data?.address?.pinCode} 
          </p>

          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          GSTIN/UIN: ${data?.hotelDetails?.userDetails?.GSTnumber}
          </p> 
          
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : ${data?.address?.state}, Code : 08
          </p>
        </div>
      </div>
      <table style="${generateInlineStyles(styles.table)}">
        <thead>
          <tr>
          <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">S. No.</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">Item Name</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">Category</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">HSN Code</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">Quantity</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">Unit Price</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">Price</th>
            <th style="${generateInlineStyles(
              styles.th
            )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">GST</th>
          </tr>
        </thead>
        <tbody>
          ${data?.orderedItems
            ?.map(
              (item, index) => `
            <tr key=${index}>
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${
                index
              }</td>
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${
                item?.itemDetails?.name
              }</td>
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${
                item?.itemDetails?.category?.name
              }</td>

               <td style="${generateInlineStyles(
                 styles.td
               )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${
                item?.itemDetails?.HSNcode
              }</td>

              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
              ${
                item?.unit === "kg"
                  ? item?.quantity?.kg +
                    " kg   " +
                    item?.quantity?.gram +
                    " grams"
                  : item?.unit === "piece"
                  ? item?.quantity?.piece + " Pieces"
                  : item?.quantity?.packet + " Packets"
              }
              </td>

              
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${item.price.toFixed(
                2
              )}</td>
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
                

                ${
                  item?.unit === "kg"
                    ? (
                        item.price * item.quantity?.kg +
                        item.price * (item.quantity?.gram / 1000)
                      ).toFixed(2)
                    : item?.unit === "piece"
                    ? (item?.quantity?.piece * item.price).toFixed(2)
                    : (item?.quantity?.packet * item.price).toFixed(2)
                }
              </td>
              <td style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">${
                item?.itemDetails?.GST
              }%</td>
            </tr>
          `
            )

            .join("")}
        </tbody>
        <tfoot>
           <tr>
             <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px"></td>
              
               <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px"></td>

               <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px"></td>

             
               <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px"></td>

               <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px"></td>

             
               <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
              ₹ ${totalPrice(data?.orderedItems).toFixed(2)}</td>

             
              
              <td  style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">₹ 0</td>
    </tr>
    <tr>
     <td colspan="7" style="${generateInlineStyles(
                styles.td
              )} line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px;text-align:right">
              Total : ₹ ${totalPrice(data?.orderedItems).toFixed(2)}</td>
              </tr>
  </tfoot>
      </table>
     
      <div style="display:flex;margin-bottom:10px;margin-top:20px">
        <div style="flex:1;margin-right:5px">
          <p style="font-weight:600;font-size:10px;">Declaration</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:10px">
          We declare that this invoice shows the actual price of the 
          goods described and that all particulars are true and 
          correct
          </p>
         
        </div>
        <div style="flex:1;margin-right:5px;text-align:right">
          <p style="font-weight:600;font-size:10px;">for ${
            data?.vendorDetails?.userDetails?.organization
          }</p>
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:30px;text-align:right">
          Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  `;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: '/usr/bin/chromium-browser'
    });
    const page = await browser.newPage();

    // Set the content of the page to the provided HTML
    await page.setContent(html);

    // Generate the PDF stream
    const pdfBuffer = await page.pdf({ format: "A4" });

    // Set response headers for PDF download
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="generated.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");

    // Send the PDF buffer as a stream in the response
    res.status(200).send(pdfBuffer);
    // Close the Puppeteer browser
    await browser.close();
  } catch (error) {
    console.error("Error creating PDF:", error);
    res.status(500).send("Error creating PDF:");
  }
});

const addItemToStock = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const vendorId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ message: "itemId is required!" });
    }

    // Check if the item already exists in the stock for the vendor
    const stock = await vendorStock.findOne({ vendorId });
    if (stock) {
      const itemExists = stock.stocks.some(
        (item) => item.itemId.toString() === itemId
      );
      if (itemExists) {
        return res
          .status(400)
          .json({ message: "Item already exists in the stock" });
      }
      // Add the new item to the stock
      stock.stocks.push({ itemId, quantity: { kg: 0, gram: 0, piece: 0 } });
      await stock.save();
    } else {
      // Create a new stock entry if the vendor doesn't have any existing stock
      await vendorStock.create({
        vendorId,
        stocks: [{ itemId, quantity: { kg: 0, gram: 0, piece: 0 } }],
      });
    }

    const vendorStocks = await getVendorStockFunc(vendorId);

    const addedStock = vendorStocks.find(
      (item) => item.itemId.toString() === itemId.toString()
    );

    // console.log(addedStock, "added");

    if (vendorStocks.length > 0) {
      res.json({
        message: "Stock added successfully",
        data: addedStock,
      });
    }
  } catch (error) {
    next(error);
  }
});

const getVendorStocks = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id; // Assuming req.user._id contains the vendorId

    // Aggregate pipeline to fetch vendor stocks with item details and images
    const stocks = await vendorStock.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
      },
      {
        $unwind: "$stocks",
      },
      {
        $lookup: {
          from: "Items",
          localField: "stocks.itemId",
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
          localField: "stocks.itemId",
          foreignField: "itemId",
          as: "images",
        },
      },
      {
        $unwind: "$images",
      },
      {
        $group: {
          _id: "$_id",
          vendorId: { $first: "$vendorId" },
          stocks: {
            $push: {
              itemId: "$stocks.itemId",
              quantity: "$stocks.quantity",
              itemDetails: "$itemDetails",
              images: "$images",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          vendorId: 1,
          "stocks.itemId": 1,
          "stocks.quantity": 1,
          "stocks.itemDetails": 1,
          "stocks.images": 1,
        },
      },
    ]);

    if (stocks?.length > 0) {
      return res.status(200).json({ data: stocks[0]?.stocks }); // Assuming each vendor has only one stock entry
    } else {
      return res.status(200).json({ data: [] });
    }
  } catch (error) {
    next(error);
  }
});

const deleteItemFromStock = catchAsyncError(async (req, res, next) => {
  try {
    // Extract necessary parameters from the request
    const { itemId } = req.body;
    const vendorId = req.user._id;

    // Query the database to find the item in the stock
    const stock = await vendorStock.findOne({ vendorId: vendorId });

    // console.log(stock, "stock");
    if (!stock) {
      return res
        .status(404)
        .json({ message: "Stock not found for the vendor." });
    }

    // Find the index of the item to be deleted
    const itemIndex = stock.stocks.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    // console.log(itemIndex, "itemIndex");

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the stock." });
    }

    // Remove the item from the stock
    stock.stocks.splice(itemIndex, 1);

    // Save the changes to the database
    await stock.save();

    return res.status(200).json({ message: "Stck removed successfully" });
  } catch (error) {
    next(error);
  }
});

const deleteHotelItem = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId, itemId } = req.body;
    const vendorId = req.user._id;

    // Check if vendorId, hotelId, and itemId are provided
    if (!vendorId || !hotelId || !itemId) {
      return res
        .status(400)
        .json({ message: "vendorId, hotelId, and itemId are required!" });
    }

    // Find and delete the document based on vendorId, hotelId, and itemId
    const item = await HotelItemPrice.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new ObjectId(hotelId),
      itemId: new ObjectId(itemId),
    });

    if (!item) {
      return res.json({ message: "Item Not Found" });
    }

    await HotelItemPrice.deleteOne({ _id: item._id });

    const itemList = await getHotelItemsFunc(hotelId, vendorId);
    // Send success response
    res.json({ message: "Document deleted successfully", data: itemList });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const addHotelItem = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId, itemIds } = req.body;
    const vendorId = req.user._id;

    // Validate required fields
    if (
      !vendorId ||
      !hotelId ||
      !itemIds ||
      !Array.isArray(itemIds) ||
      itemIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "vendorId, hotelId, and itemIds are required fields and must be provided as a non-empty array.",
      });
    }

    const items = await VendorItems.findOne({ vendorId: vendorId }).select(
      "items"
    );
    const hotelItems = [];

    for (const itemId of itemIds) {
      const item = items.items.find((item) => item.itemId.equals(itemId));
      if (!item) {
        continue; // Skip if item not found
      }

      console.log(item,'item')

      let vendorAvgPrice = item.totalPrice/(item.totalQuantity.kg + (item.totalQuantity.gram/1000) + item.totalQuantity.piece + item.totalQuantity.packet)

      console.log(vendorAvgPrice,'avg price')


      const category = await Items.findOne({ _id: itemId });
      // console.log(category, "category");
      // Create new HotelItemPrice document
      const hotelItemPrice = new HotelItemPrice({
        vendorId,
        hotelId,
        itemId,
        categoryId: category.categoryId,
        todayCostPrice: (vendorAvgPrice ? vendorAvgPrice : 0),
        todayPercentageProfit: 0,
        showPrice: true, // Default to true if not provided
      });

      // Save the new document to the database
      // console.log(hotelItemPrice, "hotelItem");
      await hotelItemPrice.save();
      hotelItems.push(hotelItemPrice);
    }

    const itemList = await getHotelItemsFunc({
      HotelId: hotelId,
      vendorId: vendorId,
    });

    // Send success response
    res.json({ message: "Documents added successfully", data: itemList });

    // const category = new ObjectId("65c093bb6b33fbcf67fb2784");

    // const items = await item.updateMany(
    //   { categoryId: category },
    //   { $set: { categoryId: new ObjectId("65cc61c193a94ee59d679497") } }
    // );

    // return res.json({ Message: "done", items });
  } catch (error) {
    // Pass any errors to the error handling middleware
    // console.log(error, "err");
    next(error);
  }
});

const getHotelAssignableItems = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId } = req.body;
    const vendorId = req.user._id;

    if (!hotelId) {
      return res.status(400).json({ message: " Hotel ID not provided" });
    }

    let allItemsIds = [];

    const items = await VendorItems.findOne({ vendorId: vendorId })


    items?.items?.map((item) => {
        allItemsIds.push(item.itemId);
    });

    // console.log(allItemsIds)


    // console.log(allItemsIds, "all");

    const hotelItems = await HotelItemPrice.find({
      vendorId: new ObjectId(vendorId),
      hotelId: new ObjectId(hotelId),
    }).select("itemId");

    const assignedItemIds = hotelItems.map((item) => item.itemId.toString());


    // Filter out items from allItemsIds that are not present in assignedItemIds
    const notAssignedItemIds = allItemsIds.filter(
      (item) => item && !assignedItemIds.includes(item.toString())
    );

    let assignItems = [];

    // Retrieve item details for not assigned items
    for (let item of notAssignedItemIds) {
      let newItem = {
        itemDetails: null,
      };


      const itemDetails = await Items.findOne({_id:item});


      newItem.itemDetails = itemDetails;

      assignItems.push(newItem);
    }

    res.status(200).json({
      assignItems,
      message: "filtered",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const addStockItemOptions = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const vendor = await VendorItems.findOne({
      vendorId: new ObjectId(vendorId),
    }).select("items");

    let vendorItems = [];

    vendor.items.forEach((item) => {
      vendorItems.push(item.itemId);
    });

    // console.log(vendorItems, "vendorItems");

    const allItemsIds = vendorItems.map((item) => item.toString());

    let item = await vendorStock.findOne({ vendorId });

    if (item) {
      let assignedItemIds = [];
      item.stocks.map((stock) => {
        assignedItemIds.push(stock.itemId.toString());
      });
      // Filter out items from allItemsIds that are not present in assignedItemIds
      const notAssignedItemIds = allItemsIds.filter(
        (item) => item && !assignedItemIds.includes(item.toString())
      );

      // console.log(allItemsIds, assignedItemIds, notAssignedItemIds);

      let assignItems = [];

      // Retrieve item details for not assigned items
      for (let item of notAssignedItemIds) {
        let newItem = {
          itemDetails: null,
        };

        const itemDetails = await Items.findOne({
          _id: new ObjectId(item),
        });

        newItem.itemDetails = itemDetails;

        assignItems.push(newItem);
      }

      res.status(200).json({
        assignItems,
        message: "filtered",
      });
    } else {
      let assignedItemIds = [];
      // Filter out items from allItemsIds that are not present in assignedItemIds
      const notAssignedItemIds = allItemsIds.filter(
        (item) => item && !assignedItemIds.includes(item.toString())
      );

      // console.log(allItemsIds, assignedItemIds, notAssignedItemIds);

      let assignItems = [];

      // Retrieve item details for not assigned items
      for (let item of notAssignedItemIds) {
        let newItem = {
          itemDetails: null,
        };

        const itemDetails = await Items.findOne({
          _id: new ObjectId(item),
        });

        newItem.itemDetails = itemDetails;

        assignItems.push(newItem);
      }

      res.status(200).json({
        assignItems,
        message: "filtered",
      });
    }

    // Update the quantity of the item in the stock
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getVendorCategories = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const vendor = await vendorCategories.findOne({ vendorId: vendorId });

    // console.log(vendor);

    if (!vendor) {
      return res.json({ message: "vendor not found!" });
    }

    return res.json({ message: "successful", vendor });
  } catch (error) {
    return res.json({ message: "internal error!" });
  }
});

const getVendorStockFunc = async (vendorId) => {
  const pipeline = [
    {
      $match: { vendorId: new ObjectId(vendorId) },
    },
    {
      $unwind: "$stocks",
    },
    {
      $lookup: {
        from: "Items",
        localField: "stocks.itemId",
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
        localField: "stocks.itemId",
        foreignField: "itemId",
        as: "images",
      },
    },
    {
      $unwind: "$images",
    },
    {
      $group: {
        _id: "$_id",
        vendorId: { $first: "$vendorId" },
        stocks: {
          $push: {
            itemId: "$stocks.itemId",
            quantity: "$stocks.quantity",
            itemDetails: "$itemDetails",
            images: "$images",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        vendorId: 1,
        "stocks.itemId": 1,
        "stocks.quantity": 1,
        "stocks.itemDetails": 1,
        "stocks.images": 1,
      },
    },
  ];

  const stocks = await vendorStock.aggregate(pipeline);

  return stocks[0]?.stocks;
};

const getHotelItemsFunc = async ({ HotelId, vendorId }) => {
  const pipeline = [
    {
      $match: {
        vendorId: new ObjectId(vendorId),
        hotelId: new ObjectId(HotelId),
      },
    },
    {
      $lookup: {
        from: "Items",
        localField: "itemId",
        foreignField: "_id",
        as: "items",
      },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "Images",
        localField: "itemId",
        foreignField: "itemId",
        as: "items.image",
      },
    },
    {
      $unwind: "$items.image",
    },
    {
      $lookup: {
        from: "Category",
        localField: "categoryId",
        foreignField: "_id",
        as: "items.category",
      },
    },
    {
      $unwind: "$items.category",
    },
  ];

  const itemList = await HotelItemPrice.aggregate(pipeline);

  return itemList;
};

const addVendorItem = catchAsyncError(async (req, res, next) => {
  try {
    const { itemIds } = req.body;
    const vendorId = req.user._id;

    // Validate required fields
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of itemIds.",
      });
    }

    let vendor;
    try {
      vendor = await VendorItems.findOne({ vendorId: vendorId });
    } catch (error) {
      // Handle errors while fetching vendor
      return next(error);
    }

    if (vendor) {
      // Add each itemId from the array to the vendor's items
      itemIds.forEach((itemId) => {
        vendor.items.push({
          itemId: itemId,
          todayCostPrice: 0,
          history: [],
        });
      });
    } else {
      // Create a new vendor object with the array of itemIds
      vendor = new VendorItems({
        vendorId,
        items: itemIds.map((itemId) => ({
          itemId: itemId,
          todayCostPrice: 0,
          history: [],
        })),
      });
    }

    // Save the vendor object (either existing or new)
    await vendor.save();

    const item = await getVendorItemsFunc(vendorId);

    const addedItems = item.filter((item1) =>
      itemIds.includes(item1.itemId.toString())
    );

    // Send success response only after successful save
    res.json({ message: "Items added successfully", data: addedItems });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const getAllVendorItems = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const pageSize = 7;
    const offset = parseInt(req.query.offset);

    const vendorItems = await VendorItems.aggregate([
      {
        $match: { vendorId: vendorId },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "Items",
          localField: "items.itemId",
          foreignField: "_id",
          as: "items.itemDetails",
        },
      },
      {
        $unwind: "$items.itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "items.itemId",
          foreignField: "itemId",
          as: "items.images",
        },
      },
      {
        $unwind: "$items.images",
      },
      {
        $skip: offset,
      },
      {
        $limit: parseInt(pageSize),
      },
      {
        $group: {
          _id: "$_id",
          items: { $push: "$items" },
        },
      },
    ]);

    if (vendorItems[0]?.items > 0) {
      res.status(200).json({
        message: "Vendor items not found",
        data: [],
      });
    }
    // console.log(offset, "offset");
    // vendorItems[0].items.map((item) => {
    //   console.log(item.itemId, "itemID");
    // });

    // Send success response with vendor items
    res.status(200).json({
      message: "Vendor items retrieved successfully",
      data: vendorItems[0]?.items,
    });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const itemsForVendor = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const AllItems = await Items.find({});

    const vendorItems = await VendorItems.findOne({
      vendorId: vendorId,
    }).select("items");

    // console.log(vendorItems, "vi");
    if (!vendorItems) {
      return res.json({
        message: "Vendor items retrieved successfully",
        data: AllItems,
      });
    }

    let assignedItemsArray = [];
    for (let item of vendorItems.items) {
      assignedItemsArray.push(item);
    }

    // console.log(AllItems, assignedItemsArray, "aia");
    const ItemList = AllItems.filter(
      (obj1) => !assignedItemsArray.some((obj2) => obj1._id.equals(obj2.itemId))
    );

    // console.log(ItemList, "il");
    // Send success response with vendor items
    res.json({
      message: "Vendor items retrieved successfully",
      data: ItemList,
    });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const getVendorItemsFunc = async (vendorId, itemId) => {
  const vendorItems = await VendorItems.aggregate([
    {
      $match: { vendorId: vendorId },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "Items",
        localField: "items.itemId",
        foreignField: "_id",
        as: "items.itemDetails",
      },
    },
    {
      $unwind: "$items.itemDetails",
    },
    {
      $lookup: {
        from: "Images",
        localField: "items.itemId",
        foreignField: "itemId",
        as: "items.images",
      },
    },
    {
      $unwind: "$items.images",
    },
    {
      $group: {
        _id: "$_id",
        items: { $push: "$items" },
      },
    },
  ]);

  return vendorItems[0]?.items;
};

const setVendorItemPrice = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, price } = req.body;
    const vendorId = req.user._id;

    if (!itemId || !price) {
      throw new Error("All fields are required.");
    }

    // Update vendor item price
    const updated = await VendorItems.updateOne(
      { vendorId: vendorId, "items.itemId": itemId },
      { $set: { "items.$.todayCostPrice": price } }
    );

    const itemsToBeChange = await HotelItemPrice.find({
      itemId: itemId,
      vendorId: vendorId,
    });

    if (itemsToBeChange.length !== 0) {
      for (const item of itemsToBeChange) {
        const hotelLink = await hotelVendorLink.findOne({
          hotelId: item.hotelId,
        });
        if (hotelLink.isPriceFixed !== true) {
          if (item.pastPercentageProfits.length > 3) {
            let newProfitPercentage;

            // Ensure newProfitPercentage is not negative
            do {
              newProfitPercentage = await freshoCalculator(
                item.pastPercentageProfits
              );
            } while (newProfitPercentage < 0);

            const updatedCostPrice = price + newProfitPercentage * price;

            const doc = await HotelItemPrice.findOneAndUpdate(
              { itemId: item.itemId, vendorId: vendorId },
              {
                $set: {
                  todayCostPrice: parseFloat(updatedCostPrice).toFixed(2),
                  todayPercentageProfit:
                    parseFloat(newProfitPercentage).toFixed(2),
                },
                $push: {
                  pastPercentageProfits: {
                    $each: [parseFloat(newProfitPercentage).toFixed(2)],
                    $position: 0,
                    $slice: 10,
                  },
                },
              },
              { new: true }
            );

            // Trim pastPercentageProfits array if necessary
            if (doc.pastPercentageProfits.length > 10) {
              await HotelItemPrice.updateOne(
                { itemId: item.itemId, vendorId: vendorId },
                {
                  $set: {
                    pastPercentageProfits: doc.pastPercentageProfits.slice(
                      0,
                      10
                    ),
                  },
                }
              );
            }
          } else {
            console.log("here2");
            const updatedCostPrice = price + item.todayPercentageProfit * price;
            item.todayCostPrice = parseFloat(updatedCostPrice).toFixed(2);
            await item.save();
          }
        } else if (hotelLink.isPriceFixed === true) {
          const profit = item.todayCostPrice - price;
          const percen = (profit / item.todayCostPrice) * 100;
          item.todayPercentageProfit = parseFloat(percen).toFixed(2);
          await item.save();
        }
      }
    }

    const item = await getVendorItemsFunc(vendorId);

    const updatedItem = item.find(
      (item) => item.itemId.toString() === itemId.toString()
    );

    return res
      .status(200)
      .json({ message: "Price updated successfully.", data: updatedItem });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeVendorItem = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const vendorId = req.user._id;

    const updated = await VendorItems.updateOne(
      { vendorId: vendorId, "items.itemId": itemId }, // Find vendor and item
      { $pull: { items: { itemId: itemId } } } // Remove item from array
    );

    if (updated.matchedCount === 0) {
      return res.status(404).json({ message: "Vendor item not found" });
    }

    const isAssigned = await hotelItemPrice.find({
      vendorId: vendorId,
      itemId: itemId,
    });

    if (isAssigned) {
      const removed = await hotelItemPrice.deleteMany({
        vendorId: vendorId,
        itemId: itemId,
      });
    }

    res.json({ message: "Item removed successfully" });
  } catch (error) {
    next(error); // Pass errors to error handling middleware
  }
};

const getVendorOrderAnalytics = catchAsyncError(async (req, res, next) => {
  const vendorId = req.user._id;

  const { duration } = req.body;

  const status = await OrderStatus.findOne({ status: "Cancelled" });
  const today = new Date();
  async function getLastWeekData() {
    const result = [];
    const weekEnd = new Date(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const orders = await UserOrder.find({
      vendorId: vendorId,
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
      vendorId: vendorId,
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
        vendorId: vendorId,
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
  const vendorId = req.user._id;

  const { duration } = req.body;

  const status = await OrderStatus.findOne({ status: "Cancelled" });
  let itemDetailsArray = [];

  const getItemName = async (itemId) => {
    const items = await Items.findOne({ _id: itemId });
    const image = await Image.findOne({ itemId: itemId });
    const itemObj = {
      name: items?.name,
      image: image?.img,
    };

    return itemObj;
  };

  const filterZeroQuantityItems = (itemsArray) => {
    return itemsArray.filter(
      (item) =>
        item.orderedItems.totalQuantity.kg > 0 ||
        item.orderedItems.totalQuantity.gram > 0
    );
  };

  const today = new Date();
  async function getLastWeekData() {
    const result = [];
    const weekEnd = new Date(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const orders = await UserOrder.find({
      vendorId: vendorId,
      createdAt: { $gte: weekStart, $lte: weekEnd },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await VendorItems.findOne({ vendorId: vendorId }).select(
      "items"
    );

    const itemDetails = itemsList.items.reduce((acc, item) => {
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

    return filterZeroQuantityItems(itemDetailsArray); // Returning reversed orders as before
  }

  async function getLastMonthData() {
    const result = [];
    const monthEnd = new Date(today); // Month end is today
    const monthStart = new Date(today); // Month start is 30 days before today
    monthStart.setDate(today.getDate() - 30);

    // Find orders within the last month
    const orders = await UserOrder.find({
      vendorId: vendorId,
      createdAt: { $gte: monthStart, $lte: monthEnd },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await VendorItems.findOne({ vendorId: vendorId }).select(
      "items"
    );

    const itemDetails = itemsList.items.reduce((acc, item) => {
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
      vendorId: vendorId,
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: status._id },
    });

    const itemsList = await VendorItems.findOne({
      vendorId: vendorId,
    }).select("items");

    const itemDetails = itemsList.items.reduce((acc, item) => {
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

let model; // Define the model variable globally

function normalizeData(data) {
  const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
  const std = Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((acc, val) => acc + val, 0) / data.length);
  return data.map(x => (x - mean) / std);
}

async function freshoCalculator(lastTenDaysProfitPercentage) {
  try {
    if (!Array.isArray(lastTenDaysProfitPercentage)) {
      throw new Error(
        "Invalid input: lastTenDaysProfitPercentage must be an array."
      );
    }

    // Pad and normalize the input array
    const paddedInput = lastTenDaysProfitPercentage.concat(
      Array(10 - lastTenDaysProfitPercentage.length).fill(0)
    );
    const normalizedInput = normalizeData(paddedInput);

    // Initialize model if it hasn't been initialized yet
    if (!model) {
      model = await initModel();
    }

    const prediction = await model.predict(tf.tensor2d([normalizedInput]));
    const predictionValue = (await prediction.array())[0][0];
    return predictionValue;
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
}

async function initModel() {
  const X = [];
  const y = [];
  for (let i = 0; i < 100; i++) {
    const lastTenDaysProfitPercentage = Array.from({ length: 10 }, () =>
      Math.random()
    );
    const todayProfitPercentage = Math.random();
    X.push(lastTenDaysProfitPercentage);
    y.push([todayProfitPercentage]);
  }
  const X_train = tf.tensor2d(X);
  const y_train = tf.tensor2d(y);
  const model = createModel();
  await model.fit(X_train, y_train, { epochs: 100 });
  return model;
}

function createModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, inputShape: [10], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: "adam", loss: "meanSquaredError" });
  return model;
}


const updateHotelItemProfit = async (req, res, next) => {
  try {
    const { hotelId, itemId, newPercentage, newPrice } = req.body;
    const vendorId = req.user._id;

    const updatedDoc = await HotelItemPrice.findOne({ hotelId, itemId });

    if (!updatedDoc) {
      return res.json({ message: "Failed to fetch HotelItem" });
    }

    const itemPrice = await VendorItems.findOne({ vendorId: vendorId });

    // Find the item with the specified itemId
    const selectedItem = itemPrice.items.find((item) =>
      item.itemId.equals(new ObjectId(itemId))
    );

    if (!selectedItem) {
      // Handle case where item with specified itemId is not found
      return res.status(404).json({ message: "Item not found" });
    }

    // Calculate the new price based on the cost price and profit percentage
    // const costPrice = selectedItem.todayCostPrice;
    // const newPrice = costPrice + costPrice * newPercentage;

    const updatedPrice = await HotelItemPrice.findOneAndUpdate(
      {
        vendorId: vendorId,
        itemId: itemId,
        hotelId: hotelId,
      },
      {
        $set: { todayCostPrice: newPrice },
      },
      { new: true }
    );

    const newDoc = await HotelItemPrice.findOneAndUpdate(
      { hotelId, itemId },
      [
        {
          $set: {
            pastPercentageProfits: {
              $cond: {
                if: { $lt: [{ $size: "$pastPercentageProfits" }, 10] }, // Check if less than 10 elements
                then: {
                  $concatArrays: [[newPercentage], "$pastPercentageProfits"],
                }, // Add to the beginning if less than 10
                else: {
                  $concatArrays: [
                    [newPercentage],
                    { $slice: ["$pastPercentageProfits", 0, 9] },
                  ],
                }, // Add and slice if full
              },
            },
            todayPercentageProfit: newPercentage, // Set todayPercentageProfit to newPercentage
          },
        },
      ],
      { new: true } // Return the updated document
    );

    const itemList = await getHotelItemsFunc({ HotelId: hotelId, vendorId });

    res.json({
      message: "Profit percentage updated successfully",
      data: itemList,
    });
  } catch (error) {
    next(error);
  }
};

const msgToSubVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    // Get the start of today
    const today = new Date();
    today.setHours(3, 0, 0, 0);

    // Get the start of yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    

    const response = await messageToSubvendor();


    await sendWhatsappmessge(response);

    const statusId = await OrderStatus.findOne({ status: "In Process" });
    const orders = await UserOrder.updateMany(
      {
        createdAt: { $gte: yesterday, $lt: today },
      },
      {
        $set: { orderStatus: statusId._id },
      }
    );
    res.status(200).json({ response });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});

const getAllPaymentPlans = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = await PaymentPlan.find({});

    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    next(error);
  }
});

const selectedPaymentPlan = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = await PaymentPlan.find({});

    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    next(error);
  }
});

const orderStatusUpdate = async (req, res, next) => {
  try {
    const initialStatus = await OrderStatus.findOne({ status: "Order Placed" });
    const updatedStatus = await OrderStatus.findOne({ status: "In Process" });

    const updateResult = await UserOrder.updateMany(
      { orderStatus: initialStatus._id },
      { $set: { orderStatus: updatedStatus._id } }
    );

    res.json({
      success: true,
      message: "Order statuses updated successfully",
      updateResult,
    });
  } catch (error) {
    console.log(error);
  }
};

const generatePlanToken = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { duration } = req.body;

    const plan = await PaymentPlan.findOne({ duration: duration });

    const token = await generatePaymentToken({
      userId,
      planDuration: duration,
    });

    // console.log(token, "token");
    if (!token) {
      return res.json({ message: "Failed To Generate Token" });
    }

    const vendor = await user.findOne({ _id: userId });

    if (vendor.hasActiveSubscription) {
      return res.json({
        message: "Vendor already has an active Subscription!",
      });
    } else {
      vendor.hasActiveSubscription = true;
      vendor.activeSubscription = plan._id;
      vendor.paymentToken = token;
      vendor.dateOfActivation = new Date();

      await vendor.save();
    }

    return res.json({ message: "Plan Activated!" });
  } catch (error) {
    console.log(error, "errr");
  }
});

const changeOrderQuantity = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendor = req.user._id;

    const { quantity, itemId, orderId } = req.body;

    if (!quantity || !itemId || !orderHistoryForVendors) {
      return res.json({ message: "All Fields are required!" });
    }

    const order = await UserOrder.findOne({ _id: orderId });

    if (!order) {
      return res.json({ message: "Order not found!" });
    }

    const orderStatus = await OrderStatus.findOne({ _id: order.orderStatus });

  
    // Find the index of the ordered item in the orderedItems array
    const orderedItemIndex = order.orderedItems.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (orderedItemIndex === -1) {
      return res.json({ message: "Item not found in order!" });
    }

    let oldPrice = 0;
    let newPrice = 0;

    if (order.orderedItems[orderedItemIndex].unit === "kg") {
      const totalGrams =
        order.orderedItems[orderedItemIndex].quantity.kg * 1000 +
        order.orderedItems[orderedItemIndex].quantity.gram; // Convert kg to grams and add the gram value
      oldPrice =
        (totalGrams * order.orderedItems[orderedItemIndex].price) / 1000; // Multiply total grams with price and store in totalPrice field
    } else if (order.orderedItems[orderedItemIndex].unit === "packet") {
      oldPrice =
        order.orderedItems[orderedItemIndex].price *
        order.orderedItems[orderedItemIndex].quantity.packet; // Multiply total grams with price and store in totalPrice field
    } else if (order.orderedItems[orderedItemIndex].unit === "piece") {
      oldPrice =
        order.orderedItems[orderedItemIndex].price *
        order.orderedItems[orderedItemIndex].quantity.piece;
    }

    if (quantity.kg !== 0 || quantity.gram !== 0) {
      const totalGrams = quantity.kg * 1000 + quantity.gram;
      newPrice =
        (totalGrams * order.orderedItems[orderedItemIndex].price) / 1000;
    } else if (quantity.piece !== 0) {
      newPrice = order.orderedItems[orderedItemIndex].price * quantity.packet;
    } else if (quantity.packet !== 0) {
      newPrice = order.orderedItems[orderedItemIndex].price * quantity.piece;
    }

    const update = newPrice - oldPrice;

    // Update the quantity of the ordered item
    order.orderedItems[orderedItemIndex].quantity = quantity;
    order.totalPrice = order.totalPrice + update;

    // Save the updated order back to the database
    await order.save();

    const orderData = await UserOrder.aggregate([
      {
        $match: { _id: orderId },
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
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
          _id: { orderId: "$_id" },
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          totalPrice: { $first: "$totalPrice" },
          address: { $first: "$address" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          hotelId: { $first: "$hotelId" },
          vendorDetails: { $first: "$hotelDetails" },
          orderStatusDetails: { $first: "$orderStatusDetails" },
          orderedItems: {
            $push: {
              itemId: "$orderedItems.itemId",
              price: "$orderedItems.price",
              quantity: "$orderedItems.quantity",
              _id: "$orderedItems._id",
              itemDetails: "$itemDetails",
              image: "$images",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          isReviewed: 1,
          totalPrice: 1,
          address: 1,
          createdAt: 1,
          updatedAt: 1,
          hotelId: 1,
          vendorDetails: 1,
          orderStatusDetails: 1,
          orderedItems: 1,
        },
      },
    ]);

    orderData.map((orders) => {
      order.orderedItems.map((item) => {
        if (item.itemId.toString() === itemId.toString()) {
          return res.json({ data: item });
        }
      });
    });

    // return res.json({ message: "Order not found" });
  } catch (error) {
    console.log(error, "errr");
    return res.status(500).json({ message: "Internal server error" });
  }
});

const totalSales = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendor = req.user._id;

    const status = await OrderStatus.findOne({ status: "Delivered" });

    const orders = await UserOrder.find({
      vendorId: vendor,
      orderStatus: status._id,
    });

    let total = 0;
    orders.map((order) => {
      total += order.totalPrice;
    });

    return res.json(total);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const statusUpdateToDelivered = catchAsyncError(async (req, res, next) => {
  try {
    const  vendorId = req.user._id;

    const { orderNumber, status } = req.body;


    if (orderNumber === undefined || status === "") {
      return res.status(400).json({ message: "Invalid OrderNumber" });
    }

    const order = await UserOrder.findOne({ orderNumber: orderNumber }).populate('orderedItems');

    const statusId = await OrderStatus.findOne({ status: status });
   

    if(status === "Cancelled"){


      const { hotelId, orderedItems } = order;


       // Get the current date
    const currentDate = new Date();
    
    // Set the start time to 3 AM of the current day
    const startTime = new Date(currentDate);
    startTime.setHours(3, 0, 0, 0);

    // Set the end time to 2:59:59 AM of the following day
    const endTime = new Date(currentDate);
    endTime.setHours(26, 59, 59, 999);


    // Find the compiled order for the vendor and the specific time range
    const compiledOrder = await CompiledOrder.findOne({
      vendorId: vendorId,
      date: { $gte: startTime, $lt: endTime },
    });


    if (!compiledOrder) {
      throw new Error('Compiled order not found');
    }

    // Iterate over each item in the canceled order
    orderedItems.forEach((orderedItem) => {
      const compiledItem = compiledOrder.items.find(item => item.itemId.toString() === orderedItem.itemId.toString());
    
      if (compiledItem) {
        // Find the hotel entry in the compiled item's hotels array
        const hotelEntry = compiledItem.hotels.find(hotel => hotel.hotelId.toString() === hotelId.toString());
    
        if (hotelEntry) {
          // Deduct the quantity
          hotelEntry.quantity.kg -= orderedItem.quantity.kg || 0;
          hotelEntry.quantity.gram -= orderedItem.quantity.gram || 0;
          hotelEntry.quantity.piece -= orderedItem.quantity.piece || 0;
          hotelEntry.quantity.packet -= orderedItem.quantity.packet || 0;
    
          // Adjust kg and gram if grams become negative
          if (hotelEntry.quantity.gram < 0) {
            hotelEntry.quantity.kg -= 1;
            hotelEntry.quantity.gram += 1000;  // Adjust grams to a positive value by adding 1000
          }
    
          // If the hotel's quantity is zero, remove the hotel entry from the array
          if (hotelEntry.quantity.kg <= 0 && hotelEntry.quantity.gram <= 0 &&
              hotelEntry.quantity.piece <= 0 && hotelEntry.quantity.packet <= 0) {
            compiledItem.hotels = compiledItem.hotels.filter(hotel => hotel.hotelId.toString() !== hotelId.toString());
          }
        }
    
        // Deduct the quantity from the compiled item's totalQuantity
        compiledItem.totalQuantity.kg -= orderedItem.quantity.kg || 0;
        compiledItem.totalQuantity.gram -= orderedItem.quantity.gram || 0;
        compiledItem.totalQuantity.piece -= orderedItem.quantity.piece || 0;
        compiledItem.totalQuantity.packet -= orderedItem.quantity.packet || 0;
    
        // Adjust kg and gram if grams become negative for the total quantity
        if (compiledItem.totalQuantity.gram < 0) {
          compiledItem.totalQuantity.kg -= 1;
          compiledItem.totalQuantity.gram += 1000;  // Adjust grams to a positive value by adding 1000
        }
    
        // Check if totalQuantity is zero
        const isTotalQuantityZero = compiledItem.totalQuantity.kg <= 0 &&
                                    compiledItem.totalQuantity.gram <= 0 &&
                                    compiledItem.totalQuantity.piece <= 0 &&
                                    compiledItem.totalQuantity.packet <= 0;
    
        // Check if hotels array is empty
        const isHotelsArrayEmpty = compiledItem.hotels.length === 0;
    
        // If totalQuantity is zero or hotels array is empty, remove the item
        if (isTotalQuantityZero || isHotelsArrayEmpty) {
          compiledOrder.items = compiledOrder.items.filter(item => item.itemId.toString() !== compiledItem.itemId.toString());
        }
      }
    });
    

    // Save the updated compiled order
    await compiledOrder.save();


    }

    const updatedOrder = await UserOrder.findOneAndUpdate(
      { orderNumber: orderNumber },
      { $set: { orderStatus: statusId?._id } },
      { new: true } // Return the updated document
    );

    // Check if the order was found and updated
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Status Updated!", data: updatedOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const importAssignedItems = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { hotelTo, hotelFrom } = req.body;

    if (!hotelTo || !hotelFrom) {
      return res.status(400).json({ message: "HotelId not received!" });
    }

    // Find all items assigned to hotelFrom
    const itemsFromHotel = await hotelItemPrice.find({
      vendorId: vendorId,
      hotelId: hotelFrom,
    });

    // Loop through each item
    for (const item of itemsFromHotel) {
      // Check if the item is already assigned to hotelTo
      const existingItem = await hotelItemPrice.findOne({
        vendorId: vendorId,
        hotelId: hotelTo,
        itemId: item.itemId,
      });

      // If the item is not assigned to hotelTo, clone it with the new hotelId
      if (!existingItem) {
        const newItem = new hotelItemPrice({
          hotelId: hotelTo,
          vendorId: item.vendorId,
          itemId: item.itemId,
          categoryId: item.categoryId,
          todayCostPrice: item.todayCostPrice,
          todayPercentageProfit: item.todayPercentageProfit,
          pastPercentageProfits: item.pastPercentageProfits,
          showPrice: true,
        });

        await newItem.save();
      }
    }

    return res.json({ message: "Items imported successfully!" });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const updatePrice = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { hotelId, itemId, newPrice } = req.body;

    if (!hotelId || !itemId || !newPrice) {
      return res.status(400).json({ message: "Required fields are missing!" });
    }

    // Find the vendor's item details
    const vendor = await VendorItems.findOne({ vendorId: vendorId }).select("items");
    const vendorPrice = vendor?.items?.find(
      (item) => item?.itemId.toString() === itemId?.toString()
    );

    let vendorAvgPrice = vendorPrice ? vendorPrice.totalPrice / 
      (vendorPrice.totalQuantity.kg + (vendorPrice.totalQuantity.gram / 1000) + 
      vendorPrice.totalQuantity.piece + vendorPrice.totalQuantity.packet) : 1;

    // Update today's price and profit margin
    const item = await hotelItemPrice.findOne({
      vendorId: vendorId,
      hotelId: hotelId,
      itemId: itemId,
    });

    item.todayCostPrice = newPrice;

    const profit = newPrice - vendorAvgPrice;
    const percent = (profit / newPrice) * 100;
    item.todayPercentageProfit = parseFloat(percent).toFixed(2);

    function pushProfitPercent(value) {
      if (item?.pastPercentageProfits.length >= 10) {
        item?.pastPercentageProfits.shift(); // Remove the first element if the array length is 10 or more
      }
      item?.pastPercentageProfits.push(value); // Push the new value
    }

    console.log(item?.todayPercentageProfit,'profit percentage')

    pushProfitPercent((item?.todayPercentageProfit/100).toFixed(3))

    await item.save();

    const deliveredOrderStatus = await OrderStatus.findOne({status:"Delivered"})
    // Fetch orders from the last two days that are not delivered
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const undeliveredOrders = await Orders.find({
      vendorId: vendorId,
      hotelId: hotelId,
      createdAt: { $gte: twoDaysAgo },
      orderStatus: { $ne: deliveredOrderStatus._id }
    });

    // Update price in orders and recalculate total price
    for (const order of undeliveredOrders) {
      let orderUpdated = false;

      order.orderedItems.forEach(orderedItem => {
        if (orderedItem.itemId.toString() === itemId.toString()) {
          orderedItem.price = newPrice;
          orderUpdated = true;
        }
      });

      if (orderUpdated) {
        order.totalPrice = order.orderedItems.reduce((total, orderedItem) => {
          const itemTotal = (orderedItem.quantity.kg || 0) * orderedItem.price +
                            (orderedItem.quantity.gram || 0) / 1000 * orderedItem.price +
                            (orderedItem.quantity.piece || 0) * orderedItem.price +
                            (orderedItem.quantity.packet || 0) * orderedItem.price;
          return total + itemTotal;
        }, 0);

        await order.save();
      }
    }

    return res.json({ message: "Price Updated successfully!",newProfitPercentage:percent });
  } catch (error) {
    next(error);
  }
});


const changeHotelType = catchAsyncError(async (req, res, next) => {
  try {
    console.log("abcd");
    const vendorId = req.user._id;
    const { hotelId, toggle } = req.body;

    console.log(hotelId, toggle);
    if (!hotelId) {
      return res.status(400).json({ message: "HotelId not received!" });
    }

    // Find all items assigned to hotelFrom
    const link = await hotelVendorLink.findOneAndUpdate(
      { vendorId: vendorId, hotelId: hotelId },
      {
        $set: { isPriceFixed: toggle },
      },
      { new: true }
    );

    console.log(link, "link");

    return res.json({ message: "Hotel Updated successfully!" });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const searchQueryForVendorItems = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const searchText = req.query.searchText || "";

    console.log(searchText, "here");
    // Return an empty array if searchText is empty or not provided
    if (!searchText || searchText.trim() === "") {
      return res.status(200).json({
        message: "Vendor items not found",
        data: [],
      });
    }

    // Match stage to filter items by vendor ID
    const matchStage = { $match: { vendorId: vendorId } };

    // Initial pipeline
    const pipeline = [
      matchStage,
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "Items",
          localField: "items.itemId",
          foreignField: "_id",
          as: "items.itemDetails",
        },
      },
      {
        $unwind: "$items.itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "items.itemId",
          foreignField: "itemId",
          as: "items.images",
        },
      },
      {
        $unwind: "$items.images",
      },
    ];

    // Add search filter
    pipeline.push({
      $match: {
        "items.itemDetails.name": { $regex: searchText, $options: "i" },
      },
    });

    // Add pagination and grouping stages
    pipeline.push({
      $group: {
        _id: "$_id",
        items: { $push: "$items" },
      },
    });

    // Execute aggregation pipeline
    const vendorItems = await VendorItems.aggregate(pipeline);

    // Check if no items were found
    if (!vendorItems.length || !vendorItems[0]?.items.length) {
      return res.status(200).json({
        message: "Vendor items not found",
        data: [],
      });
    }

    // Send success response with vendor items
    res.status(200).json({
      message: "Vendor items retrieved successfully",
      data: vendorItems[0].items,
    });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const updateVendorItemStock = catchAsyncError(async (req, res, next) => {
  try {
    const { price, quantity, historyId, itemId } = req.body;
    const vendorId = req.user._id;

    // Validate required fields
    if (!price || !quantity || !itemId) {
      return res.status(400).json({
        message: "Please provide all fields",
      });
    }

    // Normalize quantity to ensure grams do not exceed 999
    if (quantity.gram >= 1000) {
      const extraKg = Math.floor(quantity.gram / 1000);
      quantity.kg += extraKg;
      quantity.gram %= 1000;
    }

    // Find the vendor item
    let vendorItem = await VendorItems.findOne({ vendorId: vendorId });

    // Check if vendor item exists
    if (!vendorItem) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    // Find the specific item
    let itemToBeUpdated = vendorItem.items.find(
      (item) => item.itemId.toString() === itemId
    );

    // Check if item exists
    if (!itemToBeUpdated) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (historyId) {
      // Find the specific history entry
      let stockToBeUpdated = itemToBeUpdated.history.find(
        (stock) => stock.historyId.toString() === historyId
      );

      if (!stockToBeUpdated) {
        return res.status(404).json({
          message: "History entry not found",
        });
      }

      // Update the history entry
      stockToBeUpdated.price = price;
      stockToBeUpdated.quantity = quantity;
    } else {
      // Add new history entry
      itemToBeUpdated.history.push({
        historyId: new ObjectId(),
        date: Date.now(),
        price: price,
        quantity: quantity,
      });
    }

    // Calculate the total quantity for the specific item
    let totalItemQuantity = {
      kg: 0,
      gram: 0,
      piece: 0,
      packet: 0,
    };
    let totalItemPrice = 0;

    itemToBeUpdated.history.forEach((entry) => {
      totalItemQuantity.kg += entry.quantity.kg || 0;
      totalItemQuantity.gram += entry.quantity.gram || 0;
      totalItemQuantity.piece += entry.quantity.piece || 0;
      totalItemQuantity.packet += entry.quantity.packet || 0;
      // Calculate total price as price * total quantity
      totalItemPrice +=
        entry.price *
        (entry.quantity.kg +
          entry.quantity.gram / 1000 +
          entry.quantity.piece +
          entry.quantity.packet);
    });

    // Normalize total item quantity to ensure grams do not exceed 999
    if (totalItemQuantity.gram >= 1000) {
      const extraKg = Math.floor(totalItemQuantity.gram / 1000);
      totalItemQuantity.kg += extraKg;
      totalItemQuantity.gram %= 1000;
    }

    itemToBeUpdated.totalQuantity = totalItemQuantity;
    itemToBeUpdated.totalPrice = totalItemPrice;

    // Calculate the total quantity and price for the vendor
    let totalVendorQuantity = {
      kg: 0,
      gram: 0,
      piece: 0,
      packet: 0,
    };
    let totalVendorPrice = 0;

    vendorItem.items.forEach((item) => {
      totalVendorQuantity.kg += item.totalQuantity.kg || 0;
      totalVendorQuantity.gram += item.totalQuantity.gram || 0;
      totalVendorQuantity.piece += item.totalQuantity.piece || 0;
      totalVendorQuantity.packet += item.totalQuantity.packet || 0;
      totalVendorPrice += item.totalPrice;
    });

    // Normalize total vendor quantity to ensure grams do not exceed 999
    if (totalVendorQuantity.gram >= 1000) {
      const extraKg = Math.floor(totalVendorQuantity.gram / 1000);
      totalVendorQuantity.kg += extraKg;
      totalVendorQuantity.gram %= 1000;
    }

    // Save the changes
    await vendorItem.save();


    const avgPriceOfItem = itemToBeUpdated?.totalPrice/
    (itemToBeUpdated?.totalQuantity?.kg + itemToBeUpdated?.totalQuantity?.gram/1000 + itemToBeUpdated?.totalQuantity?.piece + itemToBeUpdated?.totalQuantity?.packet > 0 ?
      itemToBeUpdated?.totalQuantity?.kg + itemToBeUpdated?.totalQuantity?.gram/1000 + itemToBeUpdated?.totalQuantity?.piece + itemToBeUpdated?.totalQuantity?.packet : 1 
    )


    // const allVariableHotels = await HotelItemPrice.find({
    //   vendorId: vendorId,
    //   isPriceFixed:false
    // });

    // console.log(allVariableHotels,'all Variable Hotels')
    



    // if (itemsToBeChange.length > 0) {
    //   for (const item of itemsToBeChange) {

    //     const hotelLink = await hotelVendorLink.findOne({
    //       hotelId: item.hotelId,
    //       vendorId: vendorId,
    //       isPriceFixed:false
    //     });

    //     console.log(hotelLink)
      
    //       if(hotelLink){
    //         if (item.pastPercentageProfits.length >= 3) {
    //           let newProfitPercentage;
  
    //             newProfitPercentage = await freshoCalculator(
    //               item.pastPercentageProfits
    //             );
           
    //           const updatedCostPrice = avgPriceOfItem + newProfitPercentage * avgPriceOfItem;
  
    //           console.log(updatedCostPrice,'updatedCostPrice')
  
    //           const doc = await HotelItemPrice.findOneAndUpdate(
    //             { itemId: item.itemId, vendorId: vendorId },
    //             {
    //               $set: {
    //                 todayCostPrice: parseFloat(updatedCostPrice).toFixed(2),
    //                 todayPercentageProfit:
    //                   parseFloat(newProfitPercentage).toFixed(2),
    //               },
    //               $push: {
    //                 pastPercentageProfits: {
    //                   $each: [parseFloat(newProfitPercentage).toFixed(2)],
    //                   $position: 0,
    //                   $slice: 10,
    //                 },
    //               },
    //             },
    //             { new: true }
    //           );
  
    //           console.log(doc,'doc')
  
          
    //         } else {
  
    //           let newProfitPercentage;
  
    //             newProfitPercentage = await freshoCalculator(
    //               item.pastPercentageProfits
    //             );
  
    //           const doc = await HotelItemPrice.findOneAndUpdate(
    //             { itemId: item.itemId, vendorId: vendorId },
    //             {
    //               $push: {
    //                 pastPercentageProfits: {
    //                   $each: [parseFloat(newProfitPercentage).toFixed(2)],
    //                   $position: 0,
    //                   $slice: 10,
    //                 },
    //               },
    //             },
    //             { new: true }
    //           );
    //         }
    //       }
    //  }
    // }

    // Send success response
    res.json({ message: "Items updated successfully", data: vendorItem });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const updateVendorItemWaste = catchAsyncError(async (req, res, next) => {
  try {
    const { quantity, reason, wasteId, itemId } = req.body;
    const vendorId = req.user._id;

    // Validate required fields
    if (!quantity || !reason || !itemId) {
      return res.status(400).json({
        message: "Please provide all fields",
      });
    }

    let vendorItem = await VendorItems.findOne({ vendorId: vendorId });

    // Check if vendor item exists
    if (!vendorItem) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    // Find the specific item
    let itemToBeUpdated = vendorItem.items.find(
      (item) => item.itemId.toString() === itemId
    );

    // Check if item exists
    if (!itemToBeUpdated) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (wasteId) {
      // Find the specific waste entry
      let wasteToBeUpdated = itemToBeUpdated.waste.find(
        (waste) => waste.wasteId.toString() === wasteId
      );

      if (!wasteToBeUpdated) {
        return res.status(404).json({
          message: "Waste entry not found",
        });
      }

      // Update the waste entry
      wasteToBeUpdated.quantity = quantity; // Assuming quantity is an object with kg, gram, piece, and packet
      wasteToBeUpdated.reason = reason;
    } else {
      // Add new waste entry
      itemToBeUpdated.waste.push({
        wasteId: new ObjectId(),
        date: Date.now(),
        quantity: quantity, // Assuming quantity is an object with kg, gram, piece, and packet
        reason: reason,
      });
    }

    // Calculate the total quantity for the specific item (deducting waste quantities)
    let totalItemQuantity = 0;

    itemToBeUpdated.history.forEach((entry) => {
      totalItemQuantity += entry.quantity.kg || 0;
      totalItemQuantity += (entry.quantity.gram || 0) / 1000;
      totalItemQuantity += entry.quantity.piece || 0;
      totalItemQuantity += entry.quantity.packet || 0;
    });

    itemToBeUpdated.waste.forEach((entry) => {
      totalItemQuantity -= entry.quantity.kg || 0;
      totalItemQuantity -= (entry.quantity.gram || 0) / 1000;
      totalItemQuantity -= entry.quantity.piece || 0;
      totalItemQuantity -= entry.quantity.packet || 0;
    });

    itemToBeUpdated.totalQuantity = totalItemQuantity;

    // Calculate the total quantity for the vendor
    let totalVendorQuantity = 0;

    vendorItem.items.forEach((item) => {
      totalVendorQuantity += item.totalQuantity;
    });

    vendorItem.totalQuantity = totalVendorQuantity;

    // Save the changes
    await vendorItem.save();

    // Send success response
    res.json({ message: "Waste entry updated successfully", data: vendorItem });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const updateCompiledItemQuantity = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { itemId, quantity } = req.body;

    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    if (!itemId || !quantity) {
      return res.status(400).json({ message: "ItemId and quantity required" });
    }

    const order_doc = await CompiledOrder.findOne({
      vendorId: vendorId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });


    const quantityToBeUpdate = order_doc?.items?.find(
      (item) => item?.itemId.toString() === itemId?.toString()
    );
    console.log(quantityToBeUpdate)


    quantityToBeUpdate.quantityToBeOrder = quantity;

    await order_doc.save();

    const updated_doc = await CompiledOrder.findOne({
      vendorId: vendorId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });


    return res.json({data:updated_doc, message: "Quantity Updated successfully!" });
  } catch (error) {
    next(error);
  }
});


const compiledOrderHotelDetails = catchAsyncError(async (req, res, next) => {
  const vendorId = req.user._id;

  try {
    // Get today's date
    const today = new Date();
    today.setHours(3, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Step 1: Fetch compiled orders for today
    const ordersToday = await CompiledOrder.aggregate([
      {
        $match: {
          vendorId: vendorId,
          date: { $gte: today, $lt: tomorrow }, // Filter by today's date
        },
      },
      {
        $unwind: "$items", // Unwind items array to work with individual items
      },
      {
        $unwind: "$items.hotels", // Unwind hotels array to work with individual hotel entries
      },
      {
        $lookup: {
          from: "Users", // Collection containing hotel details
          localField: "items.hotels.hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails", // Unwind the hotelDetails array
      },
      {
        $lookup: {
          from: "UserDetails", // Collection containing additional user details
          localField: "hotelDetails._id",
          foreignField: "userId",
          as: "hotelDetails.userDetails",
        },
      },
      {
        $unwind: "$hotelDetails.userDetails", // Unwind the userDetails array
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            date: "$date",
            itemId: "$items.itemId",
            totalQuantity: "$items.totalQuantity",
            quantityToBeOrder: "$items.quantityToBeOrder",
            purchasePrice: "$items.purchasePrice",
          },
          hotels: {
            $push: {
              hotelName: "$hotelDetails.userDetails.organization", // Hotel name from UserDetails
              fullName: "$hotelDetails.userDetails.fullName", // Full name from UserDetails
              email: "$hotelDetails.userDetails.email", // Email from UserDetails
              GSTnumber: "$hotelDetails.userDetails.GSTnumber", // GST number from UserDetails
              quantity: "$items.hotels.quantity", // Quantity of the item for each hotel
            },
          },
        },
      },
      {
        $project: {
          _id: "$_id._id",
          date: "$_id.date",
          itemId: "$_id.itemId",
          totalQuantity: "$_id.totalQuantity",
          quantityToBeOrder: "$_id.quantityToBeOrder",
          purchasePrice: "$_id.purchasePrice",
          hotels: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).allowDiskUse(true);

    res.status(200).send(ordersToday);


  } catch (error) {
    console.error("Error getting hotel details:", error);
    res.status(500).send("Error getting hotel details");
  }
});


const compiledOrderHotelDetailsPdf = catchAsyncError(async (req, res, next) => {
  const vendorId = req.user._id;

  try {
    // Get today's date
    const today = new Date();
    today.setHours(3, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Step 1: Fetch compiled orders for today
    const ordersToday = await CompiledOrder.aggregate([
      {
        $match: {
          vendorId: vendorId,
          date: { $gte: today, $lt: tomorrow }, // Filter by today's date
        },
      },
      {
        $unwind: "$items", // Unwind items array to work with individual items
      },
      {
        $unwind: "$items.hotels", // Unwind hotels array to work with individual hotel entries
      },
      {
        $lookup: {
          from: "Items", // Collection containing item details
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails", // Unwind the itemDetails array
      },
      {
        $lookup: {
          from: "Users", // Collection containing hotel details
          localField: "items.hotels.hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails", // Unwind the hotelDetails array
      },
      {
        $lookup: {
          from: "UserDetails", // Collection containing additional user details
          localField: "hotelDetails._id",
          foreignField: "userId",
          as: "hotelDetails.userDetails",
        },
      },
      {
        $unwind: "$hotelDetails.userDetails", // Unwind the userDetails array
      },
      {
        $group: {
          _id: {
            itemId: "$items.itemId",
            itemName: "$itemDetails.name", // Include item name
          },
          totalQuantity: { $first: "$items.totalQuantity" }, // Use the totalQuantity from pipeline
          hotels: {
            $push: {
              organization: "$hotelDetails.userDetails.organization", // Hotel organization from UserDetails
              quantity: "$items.hotels.quantity", // Quantity for each hotel
            },
          },
        },
      },
      {
        $sort: { "_id.itemId": 1 },
      },
    ]).allowDiskUse(true);

    // Step 2: Extract unique hotel organizations
    const organizations = [
      ...new Set(ordersToday.flatMap((order) => order.hotels.map((hotel) => hotel.organization))),
    ];

    // Step 3: Construct HTML with dynamic columns and total quantity per item
    const styles = {
      container: {
        fontFamily: "Arial, sans-serif",
        marginBottom: "30px",
        width: "95%",
        margin: "auto",
        paddingRight: "20px",
        borderRadius: "8px",
        background: "#fff",
      },
      header: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px",
      },
      logo: {
        maxWidth: "50px",
        maxHeight: "50px",
      },
      table: {
        width: "calc(100% - 60px)",
        borderCollapse: "collapse",
        marginBottom: "10px",
        marginLeft: "20px",
        marginRight: "20px",
      },
      th: {
        border: "1px solid #ddd",
        padding: "4px",
        textAlign: "center",
        background: "#f2f2f2",
        fontSize: "10px",
      },
      td: {
        textAlign: "center",
        border: "1px solid #ddd",
        padding: "4px",
        fontSize: "10px",
      },
      total: {
        border: "1px solid #ddd",
        padding: "4px",
        fontSize: "10px",
        fontWeight: "600",
      },
    };

    const generateInlineStyles = (styles) => {
      return Object.keys(styles)
        .map((key) => `${key}:${styles[key]}`)
        .join(";");
    };

    // Function to format quantities
    const formatQuantity = (quantity) => {
      const parts = [];
      if (quantity.kg > 0) parts.push(`${quantity.kg} kg`);
      if (quantity.gram > 0) parts.push(`${quantity.gram} gram`);
      if (quantity.piece > 0) parts.push(`${quantity.piece} piece`);
      if (quantity.packet > 0) parts.push(`${quantity.packet} packet`);
      return parts.length > 0 ? parts.join(', ') : '0';
    };

    let html = `
      <div style="${generateInlineStyles(styles.container)}">
        <div style="${generateInlineStyles(styles.header)}">
          <div>
            <h1 style="font-weight:600;font-size:24px;">Compiled Order Hotel Details</h1>
          </div>
        </div>
        <table style="${generateInlineStyles(styles.table)}">
          <thead>
            <tr>
              <th style="${generateInlineStyles(styles.th)}">Item Name</th>
              ${organizations
                .map(
                  (org) => `<th style="${generateInlineStyles(styles.th)}">${org}</th>`
                )
                .join('')}
              <th style="${generateInlineStyles(styles.th)}">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${ordersToday.map(order => {
              const itemName = order._id.itemName;
              const totalQuantity = order.totalQuantity;

              const quantityRow = organizations
                .map((org) => {
                  const hotel = order.hotels.find(h => h.organization === org);
                  const quantity = hotel ? formatQuantity(hotel.quantity) : '0';
                  return `<td style="${generateInlineStyles(styles.td)}">${quantity}</td>`;
                })
                .join('');

              const totalQuantityStr = formatQuantity(totalQuantity);

              return `
                <tr>
                  <td style="${generateInlineStyles(styles.td)}">${itemName}</td>
                  ${quantityRow}
                  <td style="${generateInlineStyles(styles.td)}">${totalQuantityStr}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Step 4: Generate the PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: '/usr/bin/chromium-browser'
    });
    const page = await browser.newPage();

    // Set the content of the page to the generated HTML
    await page.setContent(html);

    // Generate the PDF stream
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
    });

    // Set response headers for PDF download
    res.setHeader("Content-Disposition", 'attachment; filename="compiled_order_hotel_details.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    // Send the PDF buffer as a stream in the response
    res.status(200).send(pdfBuffer);

    // Close the Puppeteer browser
    await browser.close();

  } catch (error) {
    console.error("Error generating PDF for compiled order hotel details:", error);
    res.status(500).send("Error generating PDF for compiled order hotel details");
  }
});


module.exports = {
  setHotelItemPrice,
  orderHistoryForVendors,
  hotelsLinkedWithVendor,
  todayCompiledOrders,
  vendorItem,
  getAllSubVendors,
  getHotelItemList,
  getAllOrdersbyHotel,
  generateInvoice,
  updateStock,
  addItemToStock,
  getVendorStocks,
  deleteItemFromStock,
  deleteHotelItem,
  addHotelItem,
  getHotelAssignableItems,
  getVendorCategories,
  addStockItemOptions,
  addVendorItem,
  getAllVendorItems,
  itemsForVendor,
  setVendorItemPrice,
  getVendorOrderAnalytics,
  getItemAnalytics,
  freshoCalculator,
  removeVendorItem,
  updateHotelItemProfit,
  msgToSubVendor,
  getAllPaymentPlans,
  generatePlanToken,
  orderStatusUpdate,
  changeOrderQuantity,
  totalSales,
  statusUpdateToDelivered,
  importAssignedItems,
  updatePrice,
  changeHotelType,
  searchQueryForVendorItems,
  updateVendorItemStock,
  updateVendorItemWaste,
  updateCompiledItemQuantity,
  compiledOrderHotelDetailsPdf,
  compiledOrderHotelDetails
};
