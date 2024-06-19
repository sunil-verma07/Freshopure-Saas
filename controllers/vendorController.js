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
const item = require("../models/item");
const { messageToSubvendor } = require("../utils/messageToSubVendor.js");
const image = require("../models/image.js");
const OrderStatus = require("../models/orderStatus.js");
const PaymentPlan = require("../models/paymentPlan.js");
const hotelItemPrice = require("../models/hotelItemPrice.js");
const { generatePaymentToken } = require("../utils/jwtToken.js");
const hotelVendorLink = require("../models/hotelVendorLink.js");
const { isPrimitive } = require("util");
const userDetails = require("../models/userDetails.js");

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
    const { offset, status } = req.query;

    const statusId = await OrderStatus.findOne({ status: status });
    const orderData = await UserOrder.aggregate([
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
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: parseInt(offset),
      },
      {
        $limit: pageSize,
      },
    ]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: vendorId },
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
          from: "UserDetails", // Name of the UserDetails collection
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
        $sort: { "hotelOrders.createdAt": -1 },
      },
      {
        $addFields: {
          orderPlacedToday: {
            $cond: [
              {
                $and: [
                  { $ne: ["$orderData", null] },
                  {
                    $gte: ["$orderData.createdAt", today],
                  },
                ],
              },
              true,
              false,
            ],
          },
        },
      },
      {
        $project: {
          hotelId: 1,
          hotelDetails: 1,
          orderData: 1,
          orderedItems: 1,
          isPriceFixed: 1,
          orderPlacedToday: 1,
        },
      },
      {
        $sort: { "orderData.createdAt": -1 },
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
  const today = new Date(); // Assuming you have today's date
  today.setHours(0, 0, 0, 0); // Set time to the start of the day

  try {
    const status = await OrderStatus.findOne({ status: "Cancelled" });

    const orderData = await UserOrder.aggregate([
      {
        $match: {
          vendorId: vendorId,
          createdAt: { $gte: today }, // Filter orders for today
          orderStatus: { $ne: status._id },
        },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
      {
        $unwind: "$orderedItems", // Unwind orderedItems array
      },
      {
        $group: {
          _id: "$orderedItems.itemId",
          totalQuantityOrderedGrams: {
            $sum: {
              $add: [
                { $multiply: ["$orderedItems.quantity.kg", 1000] }, // Convert kg to grams
                "$orderedItems.quantity.gram", // Add grams
              ],
            },
          }, // Total quantity ordered in grams
          itemDetails: { $first: "$orderedItems" }, // Take item details from the first document
          hotelOrders: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "Items",
          localField: "_id",
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
          localField: "_id",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $unwind: "$itemImages",
      },
      // {
      //   $project: {
      //     _id: 0,
      //     totalQuantityOrdered: {
      //       kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
      //       gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
      //     }, // Total quantity ordered in kg and grams
      //     itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
      //     itemImages: { $arrayElemAt: ["$itemImages", 0] }, // Get the item images
      //     hotelDetails: { $arrayElemAt: ["$hotelDetails", 0] },
      //   },
      // },
    ]);

    for (const order of orderData) {
      const subVendor = await SubVendor.findOne({
        vendorId: vendorId, // Match the vendorId
        assignedItems: { $elemMatch: { itemId: order.itemDetails._id } }, // Match the itemId within assignedItems array
      });

      if (subVendor) {
        const subVendorCode = subVendor.subVendorCode;
        order.itemDetails["subVendorCode"] = subVendorCode;
      } else {
        order.itemDetails["subVendorCode"] = "Not Assigned.";
      }
    }

    // console.log(orderData, "od");
    res.status(200).json({
      status: "success",
      data: orderData,
    });
  } catch (error) {
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

const sendCompiledOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id; // Destructure the user object directly

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) }, // Convert vendorId to ObjectId
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
          from: "orders",
          let: { hotelId: "$hotelId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$hotelId", "$$hotelId"] },
                    { $gte: ["$createdAt", today] }, // Filter orders for today
                  ],
                },
              },
            },
          ],
          as: "hotelOrders",
        },
      },
      {
        $unwind: "$hotelOrders",
      },
      {
        $unwind: "$hotelOrders.orderedItems", // Unwind orderedItems array
      },
      {
        $group: {
          _id: "$hotelOrders.orderedItems.itemId",
          totalQuantityOrderedGrams: {
            $sum: {
              $add: [
                { $multiply: ["$hotelOrders.orderedItems.quantity.kg", 1000] }, // Convert kg to grams
                "$hotelOrders.orderedItems.quantity.gram", // Add grams
              ],
            },
          }, // Total quantity ordered in grams
          itemDetails: { $first: "$hotelOrders.orderedItems" }, // Take item details from the first document
        },
      },
      {
        $lookup: {
          from: "Items",
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $lookup: {
          from: "Images",
          localField: "_id",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $project: {
          _id: 0,
          totalQuantityOrdered: {
            kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
            gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
          }, // Total quantity ordered in kg and grams
          itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
          itemImages: { $arrayElemAt: ["$itemImages", 0] }, // Get the item images
        },
      },
    ]);

    const SubVendorsArray = await SubVendor.aggregate([
      {
        $match: {
          vendorId: vendorId,
          "assignedItems.itemId": {
            $in: orderData.map((order) => order.itemDetails._id),
          },
        }, // Match documents with the specified vendorId and matching assigned itemIds
      },
      {
        $unwind: "$assignedItems", // Deconstruct the assignedItems array
      },
      {
        $match: {
          "assignedItems.itemId": {
            $in: orderData.map((order) => order.itemDetails._id),
          },
        }, // Match assignedItems with the itemIds from orderData
      },
      {
        $lookup: {
          from: "Items",
          localField: "assignedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails", // Deconstruct the itemDetails array
      },
      {
        $lookup: {
          from: "Category",
          localField: "itemDetails.categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo", // Deconstruct the categoryInfo array
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $project: {
          _id: "$_id",
          vendorId: 1,
          subVendorPhone: "$phone", // Include the phone number of the subvendor
          itemId: "$assignedItems.itemId",
          itemName: "$itemDetails.name",
          itemDescription: "$itemDetails.description",
          category: "$categoryInfo.name",
          itemImages: "$itemImages.img",
        },
      },
    ]);

    //   sendWhatsappmessge();
    res.json({
      success: true,
      SubVendorsArray,
    });
    // Handle the fetched data as needed
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

    return res.json({ data: itemList });
  } catch (error) {
    throw error;
  }
});

const getAllOrdersbyHotel = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { HotelId } = req.body;

    const orderData = await UserOrder.aggregate([
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
          createdAt: 1,
          updatedAt: 1,
          orderStatusDetails: 1,
          orderedItems: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

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

  // console.log(orderId, "orderId");
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
          pipeline: [{ $limit: 1 }], // Limit to ensure only one document is returned
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
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $addFields: {
          "orderedItems.itemDetails": { $arrayElemAt: ["$itemDetails", 0] },
        },
      },
      {
        $lookup: {
          from: "Category",
          localField: "orderedItems.itemDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $addFields: {
          "orderedItems.itemDetails.category": {
            $arrayElemAt: ["$categoryDetails", 0],
          },
        },
      },
      {
        $unset: ["itemDetails", "categoryDetails"], // Remove temporary fields
      },
    ]);

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
        fontSize: "10px",
      },
      td: {
        border: "1px solid #ddd",
        padding: "4px",
        fontSize: "8px",
      },
      total: {
        textAlign: "right",
        fontSize: "12px",
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
          item.price * (item.quantity?.gram / 1000);
      }

      return totalPrice;
    };

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
          <div>
            <h1 style="font-weight:600;font-size:24px;">INVOICE</h1>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;">Hello, ${
            data?.hotelDetails?.fullName
          }.<br/>Thank you for shopping from ${
      data?.vendorDetails?.fullName
    }.</p>
          <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;text-align:right">Order #${
            data?.orderNumber
          } <br/> </p>
        </div>
        <div style="display:flex;margin-bottom:10px">
          <div style="border:1px solid #ddd ;flex:1;margin-right:5px;padding:10px">
            <p style="font-weight:600;font-size:12px;">${
              data?.vendorDetails?.fullName
            }</p>
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
            Rajasthan
            302017
            </p>
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
            GSTIN/UIN: 08ABFCS1307P1Z2
            </p> 
            
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
            State Name : Rajasthan, Code : 08
            
            </p>
          </div>
          <div style="border:1px solid #ddd ;flex:1;margin-left:5px;padding:10px">
            <p style="font-weight:600;font-size:12px;">${
              data?.hotelDetails?.fullName
            }</p>
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
            ${data?.address?.addressLine1},${data?.address?.addressLine2},${
      data?.address?.city
    }
            ,${data?.address?.pinCode} 
            </p>
            
            
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
            State Name : ${data?.address?.state}, Code : 08
            </p>
          </div>
        </div>
        <table style="${generateInlineStyles(styles.table)}">
          <thead>
            <tr>
              <th style="${generateInlineStyles(styles.th)}">Item Name</th>
              <th style="${generateInlineStyles(styles.th)}">Category</th>
              <th style="${generateInlineStyles(styles.th)}">Quantity</th>
              <th style="${generateInlineStyles(styles.th)}">Unit Price</th>
              <th style="${generateInlineStyles(styles.th)}">Price</th>
            </tr>
          </thead>
          <tbody>
            ${data?.orderedItems
              ?.map(
                (item, index) => `
              <tr key=${index}>
                <td style="${generateInlineStyles(styles.td)}">${
                  item?.itemDetails?.name
                }</td>
                <td style="${generateInlineStyles(styles.td)}">${
                  item?.itemDetails?.category?.name
                }</td>
                <td style="${generateInlineStyles(styles.td)}">${
                  item.quantity?.kg
                } Kg   ${item?.quantity?.gram} Grams</td>
                <td style="${generateInlineStyles(styles.td)}">${
                  item.price
                }</td>
                <td style="${generateInlineStyles(styles.td)}">${
                  item.price * item.quantity?.kg +
                  item.price * (item.quantity?.gram / 1000)
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div style="${generateInlineStyles(styles.total)}">
          <p>Total:₹${totalPrice(data?.orderedItems)}</p>
        </div>
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
            <p style="font-weight:600;font-size:10px;">for Shvaas Sustainable Solutions Private Limited</p>
            
            <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:30px;text-align:right">
            Authorised Signatory
            </p>
          </div>
        </div>
      </div>
    `;

    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    // Send the PDF as a stream in the response
    res.status(200).send(data);

    // Close the Puppeteer browser
    await browser.close();
  } catch (error) {
    // console.error("Error creating PDF:", error);
    res.status(500).send("Error creating PDF");
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

      const category = await Items.findOne({ _id: itemId });
      // console.log(category, "category");
      // Create new HotelItemPrice document
      const hotelItemPrice = new HotelItemPrice({
        vendorId,
        hotelId,
        itemId,
        categoryId: category.categoryId,
        todayCostPrice: item.todayCostPrice,
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

    const items = await VendorItems.findOne({ vendorId: vendorId }).select(
      "items"
    );

    items.items.map((item) => {
      if (item.todayCostPrice !== 0) {
        allItemsIds.push(item.itemId);
      }
    });

    // console.log(allItemsIds, "all");

    const hotelItems = await HotelItemPrice.find({
      vendorId: new ObjectId(vendorId),
      hotelId: new ObjectId(hotelId),
    }).select("itemId");

    const assignedItemIds = hotelItems.map((item) => item.itemId.toString());

    // Filter out items from allItemsIds that are not present in assignedItemIds
    const notAssignedItemIds = allItemsIds.filter(
      (item) => item._id && !assignedItemIds.includes(item._id.toString())
    );

    // console.log(hotelItems);

    let assignItems = [];

    // Retrieve item details for not assigned items
    for (let item of notAssignedItemIds) {
      let newItem = {
        itemDetails: null,
      };

      const itemDetails = await Items.findOne({
        _id: new ObjectId(item._id),
      });

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
        });
      });
    } else {
      // Create a new vendor object with the array of itemIds
      vendor = new VendorItems({
        vendorId,
        items: itemIds.map((itemId) => ({
          itemId: itemId,
          todayCostPrice: 0,
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
    // console.log(offset, "offset");
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
            console.log("here1");

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

async function freshoCalculator(lastTenDaysProfitPercentage) {
  try {
    if (!Array.isArray(lastTenDaysProfitPercentage)) {
      throw new Error(
        "Invalid input: lastTenDaysProfitPercentage must be an array."
      );
    }

    // Pad the input array with zeros if it has less than 10 elements
    const paddedInput = lastTenDaysProfitPercentage.concat(
      Array(10 - lastTenDaysProfitPercentage.length).fill(0)
    );

    const model = await initModel(); // Initialize model
    const prediction = await model.predict(tf.tensor2d([paddedInput])); // Predict using padded input
    const predictionValue = (await prediction.array())[0][0];
    return predictionValue;
  } catch (error) {
    console.error("Error:", error.message);
    return null; // Return null if prediction fails
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
  model.add(tf.layers.dense({ units: 50, inputShape: [10] }));
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
    today.setHours(0, 0, 0, 0);

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
    console.log(orders, "orders");
    res.status(200).json({ data: response });
  } catch (error) {
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

    const { quantity, itemId, orderNumber } = req.body;

    if (!quantity || !itemId || !orderNumber) {
      return res.json({ message: "All Fields are required!" });
    }

    const order = await UserOrder.findOne({ orderNumber: orderNumber });

    if (!order) {
      return res.json({ message: "Order not found!" });
    }

    const orderStatus = await OrderStatus.findOne({ _id: order.orderStatus });

    if (orderStatus.status !== "Order Placed") {
      return res.json({
        message: "Not Authorized to change Quantity of orders in process!",
      });
    }

    // Find the index of the ordered item in the orderedItems array
    const orderedItemIndex = order.orderedItems.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (orderedItemIndex === -1) {
      return res.json({ message: "Item not found in order!" });
    }

    // Update the quantity of the ordered item
    order.orderedItems[orderedItemIndex].quantity = quantity;

    // Save the updated order back to the database
    await order.save();

    const orderData = await UserOrder.aggregate([
      {
        $match: { orderNumber: orderNumber },
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
    const { vendorId } = req.user._id;
    const { orderNumber } = req.body;

    const order = await UserOrder.findOne({ orderNumber: orderNumber });

    const status = await OrderStatus.findOne({ status: "Delivered" });
    const updatedOrder = await UserOrder.findOneAndUpdate(
      { orderNumber: orderNumber },
      { $set: { orderStatus: status._id } },
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
      return res.status(400).json({ message: "HotelId not received!" });
    }

    // Find all items assigned to hotelFrom
    const hotelLink = await hotelVendorLink.find({
      vendorId: vendorId,
      hotelId: hotelId,
    });

    const vendor = await VendorItems.find({ vendorId: vendorId }).select(
      "items"
    );

    const vendorPrice = vendor[0]?.items?.filter(
      (item) => item?.itemId.toString() === itemId?.toString()
    );

    // console.log(vendorPrice[0], "vp");

    const item = await hotelItemPrice.findOne({
      vendorId: vendorId,
      hotelId: hotelId,
      itemId: itemId,
    });

    item.todayCostPrice = newPrice;

    const profit = newPrice - vendorPrice[0].todayCostPrice;
    const percen = (profit / vendorPrice[0].todayCostPrice) * 100;
    item.todayPercentageProfit = parseFloat(percen).toFixed(2);

    await item.save();

    return res.json({ message: "Price Updated successfully!" });
  } catch (error) {
    // Pass any errors to the error handling middleware
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

module.exports = {
  setHotelItemPrice,
  orderHistoryForVendors,
  hotelsLinkedWithVendor,
  todayCompiledOrders,
  vendorItem,
  getAllSubVendors,
  sendCompiledOrders,
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
};
