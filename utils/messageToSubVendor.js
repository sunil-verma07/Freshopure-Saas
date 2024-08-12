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
const CompiledOrder = require("../models/compiledOrder");

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
  const today = new Date();
  today.setHours(3, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  try {
    let compiledOrders = [];

    for (let vendor of vendors) {
      const vendorId = vendor.userId;

      const orderData = await CompiledOrder.find({
        vendorId: vendorId,
        date: { $gte: yesterday, $lt: today }
      }).populate({
        path: 'items.itemId',
        model: 'Item'
      }).populate({
        path: 'items.hotels.hotelId',
        model: 'User'
      }).populate('vendorId');

      // console.log(JSON.stringify(orderData, null, 2));

      for (const order of orderData) {
        for (const item of order.items) {
          const subVendor = await SubVendor.findOne({
            vendorId: vendorId,
            assignedItems: {
              $elemMatch: { itemId: item.itemId._id },
            },
          });

          if (subVendor) {
            const subVendorCode = subVendor.subVendorCode;
            item["subVendorCode"] = subVendorCode;
            item["subVendorName"] = subVendor.fullName;
            item["subVendorPhone"] = subVendor.phone;
          } else {
            item["subVendorCode"] = "Not Assigned.";
          }

          if (item.quantityToBeOrdered) {
            const stock = await vendorStock.findOne({  vendorId: vendorId,
              items: { $elemMatch: { itemId: item.itemId._id } } });
            if (stock) {
              if (item.totalQuantity) {
                const newQuantity = stock.quantity - Math.min(item.totalQuantity, item.quantityToBeOrdered);
                stock.quantity = newQuantity;
                await stock.save();
              } else {
                stock.quantity = item.quantityToBeOrdered;
                await stock.save();
              }
            }
          }

          if (item.totalQuantity) {
            const vendorItem = await VendorItems.findOne({
              vendorId: vendorId,
              items: { $elemMatch: { itemId: item.itemId._id } }
            });
            if (vendorItem) {
              // Update the quantity for the specific item in the array
              for (let itemEntry of vendorItem.items) {
                if (itemEntry.itemId.equals(item.itemId._id)) {
                  itemEntry.quantity = item.totalQuantity;
                  break;
                }
              }
              await vendorItem.save();
            }
          }
        }
      }

      let vendorArr = [];
      for (let subVendor of await SubVendor.find({ vendorId: vendorId })) {
        let subVendorArr = orderData.flatMap(order =>
          order.items.filter(item => item.subVendorCode === subVendor.subVendorCode)
        );
        // console.log(JSON.stringify(subVendorArr, null,2))

        if (subVendorArr.length === 1) {
          let hotelsQuantity = subVendorArr[0].hotels.map(hotel => hotel.quantity);
          let object = {
            vendorId: vendor.userId,
            vendorName: vendor.fullName,
            subVendorCode: subVendorArr[0].subVendorCode,
            subVendorName: subVendorArr[0].subVendorName,
            subVendorPhone: subVendorArr[0].subVendorPhone,
            items: [
              {
                itemName: subVendorArr[0].itemId.name,
                quantity: subVendorArr[0].quantityToBeOrdered || subVendorArr[0].totalQuantity,
                hotelQuantity: hotelsQuantity,
              }
            ],
          };
          vendorArr.push(object);
        } else if (subVendorArr.length > 1) {
          let items = subVendorArr.map(subItem => {
            let hotelsQuantity = subItem.hotels.map(hotel => hotel.quantity);
            return {
              itemName: subItem.itemId.name,
              quantity: subItem.quantityToBeOrdered || subItem.totalQuantity,
              hotelQuantity: hotelsQuantity,
            };
          });

          let object = {
            vendorId: vendor.userId,
            vendorName: vendor.fullName,
            subVendorCode: subVendorArr[0].subVendorCode,
            subVendorName: subVendorArr[0].subVendorName,
            subVendorPhone: subVendorArr[0].subVendorPhone,
            items: items,
          };
          vendorArr.push(object);
        }
      }

      compiledOrders.push(...vendorArr);
    }

    return compiledOrders;

  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { messageToSubvendor };