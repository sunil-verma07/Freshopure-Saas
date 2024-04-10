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
const role = require("../models/role.js");

const messageToSubvendor = async () => {
  try {
    const vendorRoleId = await role.findOne({ name: "Vendor" });

    const vendors = await user.find({ roleId: vendorRoleId });

    // console.log(vendors, "vendors");
    const compiledOrders = await todayCompiledOrders(vendors);
    console.log(compiledOrders, "Compiled");
  } catch (error) {
    console.log(error, "error");
  }
};

// const todayCompiledOrders = async (vendors) => {
//   const today = new Date(); // Assuming you have today's date
//   today.setHours(0, 0, 0, 0); // Set time to the start of the day

//   try {
//     let vendorIdArr = [];
//     vendors.map((vendor) => {
//       const id = vendor._id;
//       vendorIdArr.push(id);
//     });

//     // console.log(vendorIdArr, "idArray");

//     let compiledOrders = [];
//     for (let x = 0; x <= vendorIdArr.length; x++) {
//       let vendorOrdersArr = [];
//       let vendorId = vendorIdArr[x];
//       const subVendors = await SubVendor.find({ vendorId: vendorId });

//       let subVendorIdArr = [];
//       subVendors.map((vendor) => {
//         const id = vendor.subVendorCode;
//         subVendorIdArr.push(id);
//       });

//     //   console.log(subVendorIdArr, "vi");
//       const orderData = await UserOrder.aggregate([
// {
//   $match: {
//     vendorId: vendorId,
//     createdAt: { $gte: today }, // Filter orders for today
//   },
// },
// {
//   $lookup: {
//     from: "Users",
//     localField: "vendorId",
//     foreignField: "_id",
//     as: "vendorDetails",
//   },
// },
// {
//   $unwind: "$vendorDetails",
// },
// {
//   $unwind: "$orderedItems", // Unwind orderedItems array
// },
// {
//   $group: {
//     _id: "$orderedItems.itemId",
//     totalQuantityOrderedGrams: {
//       $sum: {
//         $add: [
//           { $multiply: ["$orderedItems.quantity.kg", 1000] }, // Convert kg to grams
//           "$orderedItems.quantity.gram", // Add grams
//         ],
//       },
//     }, // Total quantity ordered in grams
//     itemDetails: { $first: "$orderedItems" }, // Take item details from the first document
//     hotelOrders: { $push: "$$ROOT" },
//   },
// },
// {
//   $lookup: {
//     from: "Items",
//     localField: "_id",
//     foreignField: "_id",
//     as: "itemDetails",
//   },
// },
// {
//   $project: {
//     totalQuantityOrdered: {
//       kg: {
//         $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] },
//       }, // Convert total grams to kg
//       gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
//     }, // Total quantity ordered in kg and grams
//     itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
//   },
// },
//       ]);

//       for (const order of orderData) {
//         const subVendor = await SubVendor.findOne({
//           vendorId: vendorId, // Match the vendorId
//           assignedItems: {
//             $elemMatch: { itemId: order?.itemDetails?._id },
//           }, // Match the itemId within assignedItems array
//         });

//         if (subVendor) {
//           const subVendorCode = subVendor.subVendorCode;
//           order.itemDetails["subVendorCode"] = subVendorCode;
//         } else {
//           order.itemDetails["subVendorCode"] = "Not Assigned.";
//         }
//       }

//       //   console.log(orderData, "od");

//       //   const obj = {
//       //     vendorName: vendors.fullName,
//       //     items: [],
//       //     subVendorName: subVendors.fullName,
//       //     subVendorPhone: subVendors.phone,
//       //   };

//       for (x = 0; x <= subVendors.length; x++) {
//         let tempArr = [];
//         orderData.forEach((order) => {
//           if (order.subVendorCode === subVendorIdArr[x]) {
//             tempArr.push(order);
//           }
//         });
//         console.log(tempArr, "item array for s1");
//         vendorOrdersArr.push(tempArr);
//       }

//       //   console.log(vendorOrdersArr, "subvendors array for v1");

//       if (orderData.length > 0) {
//         compiledOrders.push(orderData);
//       }
//     }

//     // console.log(compiledOrders, "co");
//   } catch (error) {
//     console.log(error);
//   }
// };

const todayCompiledOrders = async (vendors) => {
  const today = new Date(); // Assuming you have today's date
  today.setHours(0, 0, 0, 0); // Set time to the start of the day

  try {
    let compiledOrders = [];

    for (let vendor of vendors) {
      const vendorId = vendor._id;

      const subVendors = await SubVendor.find({ vendorId: vendorId });

      const orderData = await UserOrder.aggregate([
        {
          $match: {
            vendorId: vendorId,
            createdAt: { $gte: today }, // Filter orders for today
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
          $project: {
            _id: 0,
            totalQuantityOrdered: {
              kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
              gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
            }, // Total quantity ordered in kg and grams
            itemName: { $arrayElemAt: ["$itemDetails.name", 0] },
            vendorName: "$vendorDetails.fullName",
            itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
            vendorDetails: "$vendorDetails", // Get the item details
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
          console.log(subVendorCode, "svc");
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
          vendorArr.push(subVendorArr[0]);
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

    console.log(compiledOrders);
    return compiledOrders;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { messageToSubvendor };
