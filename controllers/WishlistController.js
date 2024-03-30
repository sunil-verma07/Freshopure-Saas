const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const Wishlist = require("../models/wishlist.js");
const db = getDatabase();
// const Wishlist = db.collection('hotelwishlists');
// const Items = db.collection('DefaultItems');
// const collectionImages = db.collection('Images');

const addItemToWishlist = catchAsyncError(async (req, res, next) => {
  try {
    const { wishlistItem } = req.body;
    const hotelId = req.user._id;
    const wishlistPresent = await Wishlist.find({
      hotelId: new ObjectId(hotelId),
    });
    const elementFound = await Wishlist.findOne({
      hotelId: new ObjectId(hotelId),
      wishlistItem: {
        $elemMatch: {
          itemId: wishlistItem[0].itemId,
        },
      },
    });
    if (!elementFound) {
      if (wishlistPresent.length > 0) {
        const items = [...wishlistPresent[0].wishlistItem, ...wishlistItem];
        await Wishlist.updateOne(
          { hotelId: new ObjectId(hotelId) },
          { $set: { wishlistItem: items } }
        );
        res.status(200).json({ message: "Items added to Wishist" });
      } else {
        try {
          const wishlist = new Wishlist({
            hotelId,
            wishlistItem,
          });
          await wishlist.save();

          const wishlistData = await getWishlistItemFunc(hotelId)

          res.status(200).json({ message: "Items added to Wishist" ,wishlistData: wishlistData});
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    } else {
      res.status(400).json({ error: "Item already added" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeItemFormWishlist = catchAsyncError(async (req, res, next) => {
  try {
    const { Itemid } = req.body;
    const hotelId = req.user._id;
    const wishlistPresent = await Wishlist.find({
      hotelId: new ObjectId(hotelId),
    });

    if (wishlistPresent.length > 0) {
      const indexToRemove = wishlistPresent[0].wishlistItem.findIndex(
        (item) => item.itemId == Itemid
      );
      if (indexToRemove != -1) {
        wishlistPresent[0].wishlistItem.splice(indexToRemove, 1);
        await Wishlist.updateOne(
          { hotelId: new ObjectId(hotelId) },
          { $set: { wishlistItem: wishlistPresent[0].wishlistItem } }
        );

        const wishlistData = await getWishlistItemFunc(hotelId)

        return res.status(200).json({ message: "item Removed From WishList",wishlistData:wishlistData });
      }
      return res.status(400).json({ error: "No item found" });
    } else {
      return res.status(400).json({ error: "No items Found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const getWishlistItems = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.user._id;

    const wishlistData = await getWishlistItemFunc(hotelId)

    res.status(200).json({ wishlistData });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getWishlistItemFunc = async(hotelId)=>{

  const pipeline = [
    {
      $match: {
        hotelId: hotelId,
      },
    },
    {
      $unwind: "$wishlistItem",
    },
    {
      $lookup: {
        from: "Items",
        localField: "wishlistItem.itemId",
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
        localField: "wishlistItem.itemId",
        foreignField: "itemId",
        as: "items.image",
      },
    },
    {
      $unwind: "$items.image",
    }
  ];

  const wishlistData = await Wishlist.aggregate(pipeline);

  return wishlistData

}

module.exports = {
  addItemToWishlist,
  removeItemFormWishlist,
  getWishlistItems,
};
