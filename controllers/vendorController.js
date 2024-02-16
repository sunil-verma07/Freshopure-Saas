const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require('../dbClient.js');
const { ObjectId } = require('mongodb');
const Wishlist = require('../models/wishlist.js');
const HotelItemPrice = require('../models/hotelItemPrice.js');
const VendorItems = require('../models/VendorItems.js');
const db = getDatabase();
const HotelVendorLink = require('../models/hotelVendorLink.js');


const setHotelItemPrice = catchAsyncError(async (req, res, next) => {
    try {

        const {itemId, hotelId,categoryId,price} = req.body;

        const vendorId = req.user._id;

        if(!itemId || !hotelId || !price || !categoryId){
            throw new Error('All fields are required.');
        }

        const linkPresent = await HotelVendorLink.findOne({ vendorId:  new ObjectId(vendorId),hotelId: new Object(hotelId)})

        if(!linkPresent){
           return res.status(500).json({ message: 'Hotel is not linked to vendor' });

        }

        const itemPresent = await HotelItemPrice.findOne({
            $and: [
              { vendorId: new ObjectId(vendorId) },
              { hotelId: new ObjectId(hotelId) },
              { itemId: new ObjectId(itemId) },
            ]
          });

          if(!itemPresent){

            await HotelItemPrice.create({
                vendorId: vendorId,  
                hotelId: hotelId,
                itemId: itemId,
                categoryId:categoryId,
                todayCostPrice:price,
                });

            res.status(200).json({ message: 'Price updated successfully.'});


          }else{

            itemPresent.yesterdayCostPrice=itemPresent.todayCostPrice;
            itemPresent.todayCostPrice=price;

              await itemPresent.save();


            res.status(200).json({ message: 'Price updated successfully.' });

          }

    } catch (error) {
      console.log(error)
        res.status(500).json({ error: 'Internal server error' });  
    }
    
})


const orderHistoryForVendors = catchAsyncError(async (req, res, next) => {
  try {
      const vendorId = req.user._id;

      const orderData = await HotelVendorLink.aggregate([
          {
              $match: { "vendorId": vendorId }
          },
          {
            $lookup: {
                from: "Users",
                localField: "hotelId",
                foreignField: "_id",
                as: "hotelDetails"
            }
        },
        {
            $unwind: "$hotelDetails"
        },
          {
              $lookup: {
                  from: "orders",
                  localField: "hotelId",
                  foreignField: "hotelId",
                  as: "hotelOrders"
              }
          },
          {
              $unwind: "$hotelOrders"
          },
          {
              $lookup: {
                  from: "orderstatuses",
                  localField: "hotelOrders.orderStatus",
                  foreignField: "_id",
                  as: "hotelOrders.orderStatuses"
              }
          },
          {
              $unwind: "$hotelOrders.orderStatuses"
          },
          {
              $lookup: {
                  from: "Items",
                  localField: "hotelOrders.orderedItems.itemId",
                  foreignField: "_id",
                  as: "items"
              }
          },
          {
              $unwind: "$items"
          },
          {
              $lookup: {
                  from: "Images",
                  localField: "items._id",
                  foreignField: "itemId",
                  as: "images"
              }
          },
          {
              $group: {
                  _id: "$hotelOrders._id",
                  hotelId: { $first: "$hotelId" },
                  hotelDetails: { $first: "$hotelDetails" },
                  orderData: { $first: "$hotelOrders" },
                  orderedItems: {
                      $push: {
                          $mergeObjects: [
                              "$items",
                              { images: "$images" }
                          ]
                      }
                  }
              }
          },
          {
              $project: {
                  _id: 0,
                  hotelId: 1,
                  hotelDetails:1,
                  orderData: 1,
                  orderedItems: 2
              }
          }
      ]);

      res.status(200).json({
          status: 'success',
          data: orderData
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
              $match: { "vendorId": vendorId }
          },
          {
              $lookup: {
                  from: "orders",
                  localField: "hotelId",
                  foreignField: "hotelId",
                  as: "hotelOrders"
              }
          },
          {
              $unwind: "$hotelOrders"
          },
          {
            $lookup: {
                from: "Users",
                localField: "hotelId",
                foreignField: "_id",
                as: "hotelDetails"
            }
        },
        {
            $unwind: "$hotelDetails"
        },
         
          {
              $group: {
                  _id: "$hotelOrders._id",
                  hotelId: { $first: "$hotelId" },
                  hotelDetails: { $first: "$hotelDetails" },
                  orderData: { $first: "$hotelOrders" },
                  
              }
          },
          // {
          //     $project: {
          //         _id: 0,
          //         hotelId: 1,
          //         hotelDetails: 1,
          //         orderData: 1,
          //         orderedItems: 2
          //     }
          // }
      ]);

      res.status(200).json({
          status: 'success',
          data: orderData
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
              $match: { "vendorId": vendorId }
          },
          {
              $lookup: {
                  from: "Users",
                  localField: "hotelId",
                  foreignField: "_id",
                  as: "hotelDetails"
              }
          },
          {
              $unwind: "$hotelDetails"
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
                                      { $gte: ["$createdAt", today] } // Filter orders for today
                                  ]
                              }
                          }
                      }
                  ],
                  as: "hotelOrders"
              }
          },
          {
              $unwind: "$hotelOrders"
          },
          {
              $unwind: "$hotelOrders.orderedItems" // Unwind orderedItems array
          },
          {
              $group: {
                  _id: "$hotelOrders.orderedItems.itemId",
                  totalQuantityOrderedGrams: {
                      $sum: {
                          $add: [
                              { $multiply: ["$hotelOrders.orderedItems.quantity.kg", 1000] }, // Convert kg to grams
                              "$hotelOrders.orderedItems.quantity.gram" // Add grams
                          ]
                      }
                  }, // Total quantity ordered in grams
                  itemDetails: { $first: "$hotelOrders.orderedItems" } // Take item details from the first document
              }
          },
          {
              $lookup: {
                  from: "Items",
                  localField: "_id",
                  foreignField: "_id",
                  as: "itemDetails"
              }
          },
          {
              $lookup: {
                  from: "Images",
                  localField: "_id",
                  foreignField: "itemId",
                  as: "itemImages"
              }
          },
          {
              $project: {
                  _id: 0,
                  totalQuantityOrdered: {
                      kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
                      gram: { $mod: ["$totalQuantityOrderedGrams", 1000] } // Calculate remaining grams
                  }, // Total quantity ordered in kg and grams
                  itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
                  itemImages: { $arrayElemAt: ["$itemImages", 0] } // Get the item images
              }
          }
      ]);

      res.status(200).json({
          status: 'success',
          data: orderData
      });
  } catch (error) {
      next(error);
  }
});


module.exports = {  setHotelItemPrice,orderHistoryForVendors,hotelsLinkedWithVendor,todayCompiledOrders }