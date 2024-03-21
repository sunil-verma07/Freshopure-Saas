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

      res.status(200).json({ message: "Price updated successfully." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderHistoryForVendors = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

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
          from: "orders",
          localField: "hotelId",
          foreignField: "hotelId",
          as: "hotelOrders",
        },
      },
      {
        $unwind: "$hotelOrders",
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "hotelOrders.orderStatus",
          foreignField: "_id",
          as: "hotelOrders.orderStatuses",
        },
      },
      {
        $unwind: "$hotelOrders.orderStatuses",
      },
      {
        $lookup: {
          from: "Items",
          localField: "hotelOrders.orderedItems.itemId",
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
          localField: "items._id",
          foreignField: "itemId",
          as: "images",
        },
      },
      {
        $group: {
          _id: "$hotelOrders._id",
          hotelId: { $first: "$hotelId" },
          hotelDetails: { $first: "$hotelDetails" },
          orderData: { $first: "$hotelOrders" },
          orderedItems: {
            $push: {
              $mergeObjects: ["$items", { images: "$images" }],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: 1,
          hotelDetails: 1,
          orderData: 1,
          orderedItems: 2,
        },
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

const hotelsLinkedWithVendor = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: vendorId },
      },
      {
        $lookup: {
          from: "orders",
          localField: "hotelId",
          foreignField: "hotelId",
          as: "hotelOrders",
        },
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
        $group: {
          _id: "$hotelOrders._id",
          hotelId: { $first: "$hotelId" },
          hotelDetails: { $first: "$hotelDetails" },
          orderData: { $first: "$hotelOrders" },
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: 1,
          hotelDetails: 1,
          // orderData: 1,
          // orderedItems: 2,
        },
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
  try {
    const vendorId = req.user._id;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: vendorId },
      },
      // {
      //   $lookup: {
      //     from: "Users",
      //     localField: "hotelId",
      //     foreignField: "_id",
      //     as: "hotelDetails",
      //   },
      // },
      // {
      //   $unwind: "$hotelDetails", // Unwind hotel details (optional, if hotelDetails is usually a single document)
      // },
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
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelOrders.hotelDetails",
        },
      },
      {
        $unwind: "$hotelOrders.hotelDetails", // Unwind hotel details (optional, if hotelDetails is usually a single document)
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

          hotelOrders: { $push: "$hotelOrders" },
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

          hotelOrders: "$hotelOrders",
        },
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
    console.log(error);
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
    console.log(vendorId, HotelId);

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

    return res.json({ itemList });
  } catch (error) {
    throw error;
  }
});

const getAllOrdersbyHotel = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { HotelId } = req.body;

    console.log(vendorId, HotelId);

    const hotelOrders = await Orders.find({
      hotelId: HotelId,
      vendorId,
    }).populate("orderStatus");
    // .populate("addressId");
    // .populate({
    //   path: "orderedItems.itemId",
    //   populate: { path: "itemId" }, // Populate the associated item details
    // });

    res.json({ hotelOrders });
  } catch (error) {
    next(error);
  }
});

const updateStock = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    const vendorId = req.user._id;

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
            kg: quantity.kg || stock.quantity.kg,
            gram: quantity.gram || stock.quantity.gram,
            piece: quantity.piece || stock.quantity.piece,
          },
        };
      }
      return stock;
    });

    item.stocks = stocks;
    await item.save();

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    next(error);
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

    res.json({ message: "Stock created successfully" });
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
        $addFields: {
          "stocks.itemDetails": "$itemDetails",
          "stocks.images": "$images",
        },
      },
      {
        $group: {
          _id: "$_id",
          vendorId: { $first: "$vendorId" },
          stocks: { $push: "$stocks" },
        },
      },
    ]);

    if (stocks.length > 0) {
      return res.json(stocks[0]); // Assuming each vendor has only one stock entry
    } else {
      return res.status(404).json({ message: "Vendor stock not found!" });
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

    if (!stock) {
      return res
        .status(404)
        .json({ message: "Stock not found for the vendor." });
    }

    // Find the index of the item to be deleted
    const itemIndex = stock.stocks.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the stock." });
    }

    // Remove the item from the stock
    stock.stocks.splice(itemIndex, 1);

    // Save the changes to the database
    await stock.save();

    // Return success response
    return res
      .status(200)
      .json({ message: "Item removed from stock successfully." });
  } catch (error) {
    // Handle errors
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
    await HotelItemPrice.findOneAndDelete({ vendorId, hotelId, itemId });

    // Send success response
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const addHotelItem = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId, itemId, categoryId } = req.body;

    const vendorId = req.user._id;

    // Validate required fields
    if (!vendorId || !hotelId || !itemId || !categoryId) {
      return res.status(400).json({
        message:
          "vendorId, hotelId, itemId, categoryId, and todayCostPrice are required fields",
      });
    }

    // Create new HotelItemPrice document
    const hotelItemPrice = new HotelItemPrice({
      vendorId,
      hotelId,
      itemId,
      categoryId,
      todayCostPrice: 0,
      showPrice: true, // Default to true if not provided
    });

    // Save the new document to the database
    await hotelItemPrice.save();

    // Send success response
    res.json({ message: "Document added successfully", hotelItemPrice });
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
  updateStock,
  addItemToStock,
  addItemToStock,
  getVendorStocks,
  deleteItemFromStock,
  deleteHotelItem,
  addHotelItem,
};
