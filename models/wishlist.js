const mongoose = require('mongoose');
const Items = require("./item");
const User = require("./user");

const wishlistSchema = new mongoose.Schema(
    {
        wishlistItem: [{
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Items' }
        }],
        hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
);

const Wishist = mongoose.model('wishlists', wishlistSchema);

module.exports = Wishist;
