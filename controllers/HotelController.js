const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require('../dbClient.js');
const { ObjectId } = require('mongodb');
const collectionItems = require('../models/item.js');
const collectionImages = require('../models/image.js');
const db = getDatabase();
const hotels = db.collection('HotelItems');
const HotelItemPrice = require('../models/hotelItemPrice.js');


const getAllItemsForHotel = catchAsyncError(async (req, res, next) => {
    try {
        const {categoryId,vendorId} = req.body;
        const HotelId = req.user._id;

        const data = await HotelItemPrice.aggregate([
            {
                $match: { "hotelId": HotelId , 
                "categoryId": new ObjectId(categoryId)},
            },
            {
                $lookup:
                  {
                 from: "Items",
                 localField: "itemId",
                 foreignField: "_id",
                 as: "itemDetails",
                   }
                },
                 {
                  $unwind: `$itemDetails`
            },
            {
                $lookup:
                  {
                 from: "Users",
                 localField: "vendorId",
                 foreignField: "_id",
                 as: "vendorDetails",
                   }
                },
                 {
                  $unwind: `$vendorDetails`
            },
            {
                $lookup:
                  {
                 from: "Images",
                 localField: "itemId",
                 foreignField: "itemId",
                 as: "itemDetails.image",
                   }
                },
                 {
                  $unwind: `$itemDetails.image`
            },
            
        ])
        res.status(200).json({ data:data });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const myHotelProfile = catchAsyncError(async(req,res,next)=>{
    const userId = req.user._id;
    const user = await User.findOne({_id:userId}).populate('roleId')
    if(!user){
        return res.status(401).json({success:false,error:'Unauthenticated User'})
    }else{
        return res.status(200).json({success:true,user:user})
    }
});

module.exports = { getAllItemsForHotel ,myHotelProfile}