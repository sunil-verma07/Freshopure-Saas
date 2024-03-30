const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require('../dbClient.js');
const { ObjectId } = require('mongodb');
const Cart = require('../models/cart.js');
const db = getDatabase();
// const Cart = db.collection('Carts');
const Items = require('../models/item.js');
const Images = require('../models/image.js');


const addItemToCart = catchAsyncError(async (req, res, next) => {
    try {
        const { orderedItem } = req.body;
        const UserId = req.user._id
        // const hotelPresent = await Cart.findOne({ UserId });

        const itemIdString = orderedItem[0]?.itemId;
        const itemIdObjectId = new ObjectId(itemIdString);
        // if (hotelPresent) { 
            const existingItem = await Cart.findOne({
                hotelId: new ObjectId(UserId),
                'cartItems.itemId': itemIdObjectId,
            });


            if (existingItem) {
                // Item already exists, update the quantity
                await Cart.updateOne(
                    {
                        hotelId: new ObjectId(UserId),
                        'cartItems.itemId': itemIdObjectId,
                    },
                    {
                        $set: {
                            'cartItems.$.quantity': orderedItem[0].quantity,
                        },
                    }
                );
            } else {
                // Item doesn't exist, add a new item
                await Cart.updateOne(
                    { hotelId: new ObjectId(UserId) },
                    {
                        $addToSet: {
                            cartItems: { itemId: itemIdObjectId, quantity: orderedItem[0].quantity },
                        },
                    },
                    { upsert: true }
                );
            }

            const cartData = await getCartDataFunc(UserId)

            
            res.status(200).json({ message: 'Items added to cart',data: cartData});
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal server error' });
    }
})

const removeItemFromCart = catchAsyncError(async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const UserId = req.user._id;
        const hotelPresent = await Cart.find({ hotelId: new ObjectId(UserId) });

        if (hotelPresent.length > 0) {
            const indexToRemove = hotelPresent[0].cartItems.findIndex(item => item.itemId == itemId);
            if (indexToRemove != -1) {
                hotelPresent[0].cartItems.splice(indexToRemove, 1);
                await Cart.updateOne({ hotelId: new ObjectId(UserId) }, { $set: { cartItems: hotelPresent[0].cartItems } })

                const cartData = await getCartDataFunc(UserId)
                res.status(200).json({ message: 'Item Removed From Cart',data:cartData });
            } else {
                res.status(400).json({ error: 'No items Found' });
            }
        } else {
            res.status(400).json({ error: 'No items Found' });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal server error' });
    }
})

const getCartItems = catchAsyncError(async (req, res, next) => {
    try {
        const hotelId = req.user._id;

        const cartData = await getCartDataFunc(hotelId)
      
        res.status(200).json({ cartData });
        
       
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})

const getCartDataFunc = async(hotelId)=>{
    const cartData = await Cart.aggregate([
        {
            $match: { "hotelId": hotelId }
        },
        {
            $unwind: "$cartItems" // Unwind the cartItems array
        },
        {
            $lookup: {
                from: "Items", // Assuming the name of the Items collection is "Items"
                localField: "cartItems.itemId",
                foreignField: "_id",
                as: "itemDetails" // Store the matched item details in itemDetails array
            }
        },
        {
            $unwind: "$itemDetails" // Unwind the itemDetails array
        },
        {
            $lookup: {
                from: "Images", // Assuming the name of the Items collection is "Items"
                localField: "cartItems.itemId",
                foreignField: "itemId",
                as: "itemDetails.image" // Store the matched item details in itemDetails array
            }
        },
        {
            $unwind: "$itemDetails.image" // Unwind the itemDetails array
        },
      
        
    ])

    return cartData;
}


module.exports = { addItemToCart, removeItemFromCart, getCartItems }