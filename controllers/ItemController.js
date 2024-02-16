const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require('../dbClient.js');
const { ObjectId } = require('mongodb');
const collectionItems = require('../models/item.js');
const collectionImages = require('../models/image.js');
const db = getDatabase();
const hotels = db.collection('HotelItems');
const HotelVendorLink = require('../models/hotelVendorLink.js');


// const getAllItemsForHotel = catchAsyncError(async (req, res, next) => {
//     try {
        
//         const userId = req.user._id;
        
//         const currentHotel = await hotels.find({ userId: new ObjectId(userId) }).toArray();
//         if (currentHotel.length > 0) {
            
//             let hotelItems = {};
//             hotelItems.items = [];
//             for (let hotel of currentHotel) {
//                 const items = await collectionItems.find({ _id: new ObjectId(hotel.itemId) },{costPrice:0}).toArray()
//                 const itemsimages = await collectionImages.find({ itemId: new ObjectId(hotel.itemId) }).toArray()
//                 if (items.length > 0 && itemsimages.length > 0) {
//                     let itemPrice =null;
//                     itemPrice = items[0].costPrice + ((hotel?.margin/100)*items[0].costPrice)
//                     items[0].image = itemsimages[0]?.img
//                     items[0].costPrice = itemPrice;
//                     hotelItems.items.push({ ...items[0] });
//                 }
//             }
//             if (hotelItems) {
//                 res.status(200).json({ hotelItems });
//             } else {
//                 res.status(400).json({ error: 'No items Found' });
//             }
//         } else {
//             res.status(400).json({ error: 'No Hotel Found' })
//         }

//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })

const getAllItemsForHotel = catchAsyncError(async (req, res, next) => {
    try {
        const {categoryId} = req.body;
        const HotelId = req.hotel._id;


        const pipeline = [
            {
                $match: {
                    hotelId: new ObjectId(HotelId),
                    // categoryId: new ObjectId(categoryId)

                }
            },
            // {
            //     $unwind: '$HotelVendorLink'
            // },
            // {
            //     $lookup: {
            //         from: 'DefaultItems',
            //         localField: 'wishlistItem.itemId',
            //         foreignField: '_id',
            //         as: 'items'
            //     }
            // },
            // {
            //     $lookup: {
            //         from: 'Images',
            //         localField: 'wishlistItem.itemId',
            //         foreignField: 'itemId',
            //         as: 'itemImages'
            //     }
            // },
            // {
            //     $unwind: '$items'
            // },
            // {
            //     $unwind: '$itemImages'
            // },
            // {
            //     $set: {
            //         item: {
            //             $mergeObjects: [
            //                 '$items',
            //                 { image: '$itemImages.img' }
            //             ]
            //         }
            //     }
            // },
            // {
            //     $group: {
            //         _id: null,
            //         data: { $push: '$item' }
            //     }
            // }
        ];

        const data = await HotelVendorLink.aggregate(pipeline).toArray();
        // const wishlistData = data[0]?.data
        res.status(200).json({ data:data });
        // if (data && data.length > 0) {
            
        // } else {
        //     res.status(400).json({ error: 'No Item' })
        // }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = { getAllItemsForHotel }