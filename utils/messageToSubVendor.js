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
const user = require("../models/userDetails.js");
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
const role = require("../models/role.js");

const messageToSubvendor = async () => {
  try {
    const vendorRoleId = await role.findOne({ name: "Vendor" });

    const vendors = await user.find({ roleId: vendorRoleId });


    const compiledOrders = await todayCompiledOrders(vendors);



    return compiledOrders;
  } catch (error) {
    console.log(error, "error");
  }
};

const todayCompiledOrders = async (vendors) => {
  // Get the start of today
  const today = new Date();
  today.setHours(3, 0, 0, 0);

  // Get the start of yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  try {
    let compiledOrders = [];
    for (let vendor of vendors) {
      const vendorId = vendor.userId;

      const subVendors = await SubVendor.find({ vendorId: vendorId });

      const orderData = await UserOrder.aggregate([
        {
          $match: {
            vendorId: vendorId,
            createdAt: { $gte: yesterday, $lt:today },
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
          $group: {
            _id: "$orderedItems.itemId",
            totalQuantityOrderedGrams: {
              $sum: {
                $cond: [
                  { $eq: ["$itemDetails.unit", "kg"] },
                  {
                    $add: [
                      { $multiply: ["$orderedItems.quantity.kg", 1000] },
                      "$orderedItems.quantity.gram",
                    ],
                  },
                  0,
                ],
              },
            },
            totalQuantityOrderedPieces: {
              $sum: {
                $cond: [
                  { $eq: ["$itemDetails.unit", "piece"] },
                  "$orderedItems.quantity.piece",
                  0,
                ],
              },
            },
            totalQuantityOrderedPackets: {
              $sum: {
                $cond: [
                  { $eq: ["$itemDetails.unit", "packet"] },
                  "$orderedItems.quantity.packet",
                  0,
                ],
              },
            },
            itemDetails: { $first: "$itemDetails" },
            vendorDetails: { $first: "$vendorDetails" },
          },
        },
        {
          $project: {
            _id: 0,
            totalQuantityOrdered: {
              $cond: [
                { $eq: ["$itemDetails.unit", "kg"] },
                {
                  kg: {
                    $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] },
                  }, // Convert total grams to kg
                  gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
                },
                {
                  $cond: [
                    { $eq: ["$itemDetails.unit", "piece"] },
                    { piece: "$totalQuantityOrderedPieces" },
                    { packet: "$totalQuantityOrderedPackets" },
                  ],
                },
              ],
            },
            itemName: "$itemDetails.name",
            vendorName: "$vendorDetails.fullName",
            itemDetails: "$itemDetails",
            vendorDetails: "$vendorDetails",
          },
        },
      ]);
      
      


      for (const order of orderData) {
        const subVendor = await SubVendor.findOne({
          vendorId: vendorId, // Match the vendorId
          assignedItems: {
            $elemMatch: { itemId: order?.itemDetails?._id },
          }, // Match the itemId within assignedItems array
        });

        if (subVendor) {
          const subVendorCode = subVendor.subVendorCode;
          order["subVendorCode"] = subVendorCode;
          order["subVendorName"] = subVendor.fullName;
          order["subVendorPhone"] = subVendor.phone;
        } else {
          order["subVendorCode"] = "Not Assigned.";
        }
      }
      //   console.log(orderData, "orders");

      let vendorArr = [];
      let obj = {};
      for (let subVendor of subVendors) {
        let subVendorArr = orderData.filter(
          (order) => order.subVendorCode === subVendor.subVendorCode
        );
        // console.log(subVendorArr.length, "subVe");
        if (subVendorArr.length === 1) {
          // vendorArr.push(subVendorArr[0]);
          let object = {
            vendorName: vendor.fullName,
            items: [
              {
                itemName: subVendorArr[0].itemName,
                quantity: subVendorArr[0].totalQuantityOrdered,
              },
            ],
            subVendorCode: subVendorArr[0].subVendorCode,
            subVendorName: subVendorArr[0].subVendorName,
            subVendorPhone: subVendorArr[0].subVendorPhone,
          };
          vendorArr.push(object);
        } else if (subVendorArr.length > 1) {
          let object = {
            vendorName: vendor.fullName,
            items: [],
            subVendorCode: subVendorArr[0].subVendorCode,
            subVendorName: subVendorArr[0].subVendorName,
            subVendorPhone: subVendorArr[0].subVendorPhone,
          };
          for (let i = 0; i < subVendorArr.length; i++) {
            let obj = {
              itemName: subVendorArr[i].itemName,
              quantity: subVendorArr[i].totalQuantityOrdered,
            };
            // console.log(object, "object");
            object.items.push(obj);
          }
          //   console.log(object, "object");
          vendorArr.push(object);
        }
      }

      //   console.log(vendorArr, "arr");
      compiledOrders.push(...vendorArr);
    }

    // console.log(compiledOrders);
    return compiledOrders;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { messageToSubvendor };
