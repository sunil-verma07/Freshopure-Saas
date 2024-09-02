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
const CompiledOrder = require("../models/compiledOrder.js");
const VendorItemsAndStock = require("../models/VendorItems")


const placeOrder = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;
    const { notes } = req.body;

    // Utility function to sanitize quantity values
    const sanitizeQuantity = (quantity) => {
      return isNaN(quantity) ? 0 : quantity;
    };

    // Get the selected address
    const address = await Addresses.findOne({
      UserId: hotelId,
      selected: true,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    const orderStatus = "65cef0c27ebbb69ab54c55f4"; // Order status

    const cart_doc = await Cart.findOne({ hotelId: hotelId });
    const orders = {};

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
        quantity: {
          kg: sanitizeQuantity(item.quantity.kg || 0),
          gram: sanitizeQuantity(item.quantity.gram || 0),
          piece: sanitizeQuantity(item.quantity.piece || 0),
          packet: sanitizeQuantity(item.quantity.packet || 0),
          litre: sanitizeQuantity(item.quantity.litre || 0),
        },
        price: itemPrice.todayCostPrice,
        unit: item.unit,
      };
      
      // Logic to adjust kg and gram if gram exceeds 999
      if (updatedItem.quantity.gram > 999) {
        const extraKg = Math.floor(updatedItem.quantity.gram / 1000);
        updatedItem.quantity.kg += extraKg;
        updatedItem.quantity.gram = updatedItem.quantity.gram % 1000;
      }

      if (!orders[item.vendorId]) {
        orders[item.vendorId] = [];
      }
      orders[item.vendorId].push(updatedItem);
    }

    let newOrder;
    for (const vendorId in orders) {
      if (Object.hasOwnProperty.call(orders, vendorId)) {
        const items = orders[vendorId];

        const currentDate = new Date();
        const startOfDay = new Date(currentDate.setHours(3, 0, 0, 0));
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

        const generateOrderNumber = () => {
          const currentDate = new Date();
          const formattedDate = currentDate
            .toISOString()
            .substring(0, 10)
            .replace(/-/g, ""); // YYYYMMDD format
          const randomNumber = Math.floor(Math.random() * 10000); // 4-digit random number
          return `${formattedDate}-${randomNumber}`;
        };

        const calculateTotalPrice = (items) => {
          return items.reduce((totalPrice, item) => {
            let itemTotalPrice = 0;


            // Calculate total price based on the unit
            if (item.unit === "kg") {
              const totalGrams = item.quantity.kg * 1000 + item.quantity.gram; // Convert kg to grams and add the gram value
              itemTotalPrice = (totalGrams * item.price) / 1000; // Multiply total grams with price
            } else if (item.unit === "packet") {
              itemTotalPrice = item.price * item.quantity.packet; // Price per packet
            } else if (item.unit === "litre") {
              itemTotalPrice = item.price * item.quantity.litre; // Price per litre
            } else if (item.unit === "piece") {
              itemTotalPrice = item.price * item.quantity.piece; // Price per piece
            }

            // Accumulate the total price
            return totalPrice + itemTotalPrice;
          }, 0);
        };



        const existingCompiledOrder = await CompiledOrder.findOne({
          vendorId,
          date: { $gte: startOfDay, $lt: endOfDay },
        });

        if (existingCompiledOrder) {
          // Update existing compiled order
          items.forEach((item) => {
            const existingItem = existingCompiledOrder.items.find(
              (i) => i.itemId.toString() === item.itemId.toString()
            );

            if (existingItem) {
              const existingHotel = existingItem.hotels.find(
                (h) => h.hotelId.toString() === hotelId.toString()
              );

              if (existingHotel) {
                existingHotel.quantity.kg += sanitizeQuantity(item.quantity.kg || 0);
                existingHotel.quantity.gram += sanitizeQuantity(item.quantity.gram || 0);

                // Convert grams to kilograms if greater than 999 grams
                if (existingHotel.quantity.gram >= 1000) {
                  const additionalKg = Math.floor(existingHotel.quantity.gram / 1000);
                  existingHotel.quantity.kg += additionalKg;
                  existingHotel.quantity.gram %= 1000;
                }

                existingHotel.quantity.piece += sanitizeQuantity(item.quantity.piece || 0);
                existingHotel.quantity.packet += sanitizeQuantity(item.quantity.packet || 0);
                existingHotel.quantity.litre += sanitizeQuantity(item.quantity.litre || 0);
              } else {
                existingItem.hotels.push({
                  hotelId,
                  quantity: {
                    kg: sanitizeQuantity(item.quantity.kg || 0),
                    gram: sanitizeQuantity(item.quantity.gram || 0),
                    piece: sanitizeQuantity(item.quantity.piece || 0),
                    packet: sanitizeQuantity(item.quantity.packet || 0),
                    litre: sanitizeQuantity(item.quantity.litre || 0),
                  },
                });
              }

              // Update total quantity
              existingItem.totalQuantity.kg = sanitizeQuantity(existingItem.hotels
                .reduce((sum, h) => sum + sanitizeQuantity(h.quantity.kg), 0)).toFixed(2);
              existingItem.totalQuantity.gram = sanitizeQuantity(existingItem.hotels
                .reduce((sum, h) => sum + sanitizeQuantity(h.quantity.gram), 0)).toFixed(2);
              existingItem.totalQuantity.piece = sanitizeQuantity(existingItem.hotels
                .reduce((sum, h) => sum + sanitizeQuantity(h.quantity.piece), 0)).toFixed(2);
              existingItem.totalQuantity.packet = sanitizeQuantity(existingItem.hotels
                .reduce((sum, h) => sum + sanitizeQuantity(h.quantity.packet), 0)).toFixed(2);
              existingItem.totalQuantity.litre = sanitizeQuantity(existingItem.hotels
                .reduce((sum, h) => sum + sanitizeQuantity(h.quantity.litre), 0)).toFixed(2);

              // Convert total grams to kilograms if greater than 999 grams
              if (existingItem.totalQuantity.gram >= 1000) {
                const additionalKg = Math.floor(existingItem.totalQuantity.gram / 1000);
                existingItem.totalQuantity.kg = (
                  parseFloat(existingItem.totalQuantity.kg) + additionalKg
                ).toFixed(2);
                existingItem.totalQuantity.gram = (
                  existingItem.totalQuantity.gram % 1000
                ).toFixed(2);
              }
            } else {
              existingCompiledOrder.items.push({
                itemId: item.itemId,
                totalQuantity: {
                  kg: sanitizeQuantity(item.quantity.kg || 0),
                  gram: sanitizeQuantity(item.quantity.gram || 0),
                  piece: sanitizeQuantity(item.quantity.piece || 0),
                  packet: sanitizeQuantity(item.quantity.packet || 0),
                  litre: sanitizeQuantity(item.quantity.litre || 0),
                },
                hotels: [
                  {
                    hotelId,
                    quantity: {
                      kg: sanitizeQuantity(item.quantity.kg || 0),
                      gram: sanitizeQuantity(item.quantity.gram || 0),
                      piece: sanitizeQuantity(item.quantity.piece || 0),
                      packet: sanitizeQuantity(item.quantity.packet || 0),
                      litre: sanitizeQuantity(item.quantity.litre || 0),
                    },
                  },
                ],
              });
            }
          });
          await existingCompiledOrder.save();
        } else {
          // Create a new compiled order
          const newCompiledOrder = new CompiledOrder({
            vendorId,
            date: startOfDay,
            items: items.map((item) => ({
              itemId: item.itemId,
              totalQuantity: {
                kg: sanitizeQuantity(item.quantity.kg || 0),
                gram: sanitizeQuantity(item.quantity.gram || 0),
                piece: sanitizeQuantity(item.quantity.piece || 0),
                packet: sanitizeQuantity(item.quantity.packet || 0),
                litre: sanitizeQuantity(item.quantity.litre || 0),
              },
              hotels: [
                {
                  hotelId,
                  quantity: {
                    kg: sanitizeQuantity(item.quantity.kg || 0),
                    gram: sanitizeQuantity(item.quantity.gram || 0),
                    piece: sanitizeQuantity(item.quantity.piece || 0),
                    packet: sanitizeQuantity(item.quantity.packet || 0),
                    litre: sanitizeQuantity(item.quantity.litre || 0),
                  },
                },
              ],
            })),
          });
          await newCompiledOrder.save();
        }

        // Save the new user order
        const order = new UserOrder({
          vendorId,
          hotelId,
          orderNumber: generateOrderNumber(), // Assume this function generates a unique order number
          orderStatus,
          totalPrice: calculateTotalPrice(items), // Assume this function calculates the total price
          address,
          notes,
          orderedItems: items,
        });

        newOrder = order;
        await order.save();
      }
    }

    await Cart.deleteOne({ hotelId: new ObjectId(hotelId) });

    res.status(200).json({ message: "Order Placed", success: true, newOrder });
  } catch (error) {
    next(error);
  }
});


const orderHistory = catchAsyncError(async (req, res, next) => {
  try {
    console.log("i m reaching");
    const hotelId = req.user._id;
    const pageSize = 7;
    const { offset, status, date } = req.query; // Read from query parameters

    console.log(date, "date");

    const statusId = await OrderStatus.findOne({ status: status });

    const pipeline = [
      {
        $match: {
          hotelId: new ObjectId(hotelId),
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

    // console.log(typeof filterDate, typeof currentDate, "date read outside");
    // if (filterDate !== currentDate) {
    //   console.log(filterDate, currentDate, "date read");

    //   let startDate = new Date(new Date(date).setHours(0, 0, 0, 0));
    //   let endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

    //   pipeline.push({
    //     $match: {
    //       createdAt: {
    //         $gte: new Date(startDate),
    //         $lte: new Date(endDate),
    //       },
    //     },
    //   });
    // }

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
    orderData.map((order) => {
      // console.log(order.orderNumber, "orderNumber");
    });

    // console.log(orderData, "order");
    res.status(200).json({
      status: "success",
      data: orderData,
      status: status,
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
      const orderedItems = findOrder.orderedItems[0];
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
        `https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/compiledOrderForHotelsecret=alwaysShine`,
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
        $unwind: "$orderedItems",
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
        $group: {
          _id: "$_id",
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          totalPrice: { $first: "$totalPrice" },
          address: { $first: "$address" },
          createdAt: { $first: "$createdAt" },
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

const cancelOrder = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId } = req.user._id;
    const { orderNumber } = req.body;


    // Check if the order can be canceled
    const order = await UserOrder.findOne({ orderNumber: orderNumber }).populate("orderedItems");
    const createdAtDate = new Date(order.createdAt);
    const currentDate = new Date();

    // Check if the order was placed on the same day as the current date
    const isSameDay =
      createdAtDate.getDate() === currentDate.getDate() &&
      createdAtDate.getMonth() === currentDate.getMonth() &&
      createdAtDate.getFullYear() === currentDate.getFullYear();

    // If the conditions are not met, return an error response
    if (!isSameDay) {
      return res
        .status(400)
        .json({ error: "Cannot cancel order after midnight." });
    }

    // Proceed with order cancellation
    const status = await OrderStatus.findOne({ status: "Cancelled" });
    const updatedOrder = await UserOrder.findOneAndUpdate(
      { orderNumber: orderNumber },
      { $set: { orderStatus: status._id } },
      { new: true } // Return the updated document
    );


    const { orderedItems } = order;


      const startTime = new Date(currentDate);
      startTime.setHours(3, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(26, 59, 59, 999);

      // Find the compiled order for the vendor and the specific time range
      const compiledOrder = await CompiledOrder.findOne({
        vendorId: order?.vendorId,
        date: { $gte: startTime, $lt: endTime },
      });

      if (!compiledOrder) {
        throw new Error("Compiled order not found");
      }

      // Iterate over each item in the canceled order
      orderedItems.forEach((orderedItem) => {
        const compiledItem = compiledOrder.items.find(
          (item) => item.itemId.toString() === orderedItem.itemId.toString()
        );

        if (compiledItem) {
          // Find the hotel entry in the compiled item's hotels array
          const hotelEntry = compiledItem.hotels.find(
            (hotel) => hotel.hotelId.toString() === order?.hotelId.toString()
          );

          if (hotelEntry) {
            // Deduct the quantity
            hotelEntry.quantity.kg -= orderedItem.quantity.kg || 0;
            hotelEntry.quantity.gram -= orderedItem.quantity.gram || 0;
            hotelEntry.quantity.piece -= orderedItem.quantity.piece || 0;
            hotelEntry.quantity.packet -= orderedItem.quantity.packet || 0;
            hotelEntry.quantity.litre -= orderedItem.quantity.litre || 0;

            // Adjust kg and gram if grams become negative
            if (hotelEntry.quantity.gram < 0) {
              hotelEntry.quantity.kg -= 1;
              hotelEntry.quantity.gram += 1000; // Adjust grams to a positive value by adding 1000
            }

            // If the hotel's quantity is zero, remove the hotel entry from the array
            if (
              hotelEntry.quantity.kg <= 0 &&
              hotelEntry.quantity.gram <= 0 &&
              hotelEntry.quantity.piece <= 0 &&
              hotelEntry.quantity.litre <= 0 &&
              hotelEntry.quantity.packet <= 0
            ) {
              compiledItem.hotels = compiledItem.hotels.filter(
                (hotel) => hotel.hotelId.toString() !== order?.hotelId.toString()
              );
            }
          }

          // Deduct the quantity from the compiled item's totalQuantity
          compiledItem.totalQuantity.kg -= orderedItem.quantity.kg || 0;
          compiledItem.totalQuantity.gram -= orderedItem.quantity.gram || 0;
          compiledItem.totalQuantity.piece -= orderedItem.quantity.piece || 0;
          compiledItem.totalQuantity.packet -= orderedItem.quantity.packet || 0;
          compiledItem.totalQuantity.litre -= orderedItem.quantity.litre || 0;

          // Adjust kg and gram if grams become negative for the total quantity
          if (compiledItem.totalQuantity.gram < 0) {
            compiledItem.totalQuantity.kg -= 1;
            compiledItem.totalQuantity.gram += 1000; // Adjust grams to a positive value by adding 1000
          }

          // Check if totalQuantity is zero
          const isTotalQuantityZero =
            compiledItem.totalQuantity.kg <= 0 &&
            compiledItem.totalQuantity.gram <= 0 &&
            compiledItem.totalQuantity.piece <= 0 &&
            compiledItem.totalQuantity.litre <= 0 &&
            compiledItem.totalQuantity.packet <= 0;

          // Check if hotels array is empty
          const isHotelsArrayEmpty = compiledItem.hotels.length === 0;

          // If totalQuantity is zero or hotels array is empty, remove the item
          if (isTotalQuantityZero || isHotelsArrayEmpty) {
            compiledOrder.items = compiledOrder.items.filter(
              (item) =>
                item.itemId.toString() !== compiledItem.itemId.toString()
            );
          }
        }
      });

      // Save the updated compiled order
      await compiledOrder.save();
  


    // Check if the order was found and updated
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found." });
    }
    // const data = await orderHistoryForHotel(hotelId);
    const orderData = await UserOrder.aggregate([
      {
        $match: { orderNumber: orderNumber },
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

    return res
      .status(200)
      .json({ success: true, message: "Order Cancelled!", data: orderData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function orderHistoryForHotel(hotelId) {
  try {
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

    // console.log(orderData);
    return orderData;
  } catch (error) {
    console.log(error);
  }
}


const updatePurchasePriceOfCompiledOrder = catchAsyncError(async (req, res, next) => {
  const { items, date } = req.body;
  const vendorId = req.user._id;

  try {
    const compiledOrderPresent = await CompiledOrder.findOne({
      vendorId: new ObjectId(vendorId),
      date: date,
    });

    if (!compiledOrderPresent) {
      return res.status(400).json({ error: "Compiled Order not present." });
    }

    compiledOrderPresent.items = items;
    await compiledOrderPresent.save();

    res.status(200).json({
      message: "Items updated",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

  const getAllCompiledOrders = catchAsyncError(async (req, res, next) => {
    const vendorId = req.user._id;
    try {
    const compiledOrders = await CompiledOrder.aggregate([
      {
        $match: {
          vendorId: new ObjectId(vendorId),
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

    res.status(200).json({data:compiledOrders})
  } catch (error) {
      res.status(500).json({ error: "Internal server error" });
  }
  })


module.exports = {
  placeOrder,
  orderHistory,
  orderAgain,
  getAllCompiledOrders,
  compiledOrderForHotel,
  orderDetails,
  allHotelOrders,
  cancelOrder,
  updatePurchasePriceOfCompiledOrder,
};
