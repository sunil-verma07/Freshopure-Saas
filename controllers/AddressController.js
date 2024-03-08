const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const db = getDatabase();
const Address = require("../models/address.js");

const addAddress = catchAsyncError(async (req, res, next) => {
  try {
    const HotelId = req.user._id;

    const { addressLine1, addressLine2, state, city, pinCode } = req.body;

    await Address.updateMany(
      { HotelId: new ObjectId(HotelId), selected: true },
      { $set: { selected: false } }
    );

    const address = new Address({
      HotelId,
      addressLine1,
      addressLine2,
      state,
      city,
      pinCode,
    });
    await address.save();
    res.status(200).json({ message: "Address Added" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeAddress = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.user._id;
    const { addressId } = req.body;
    const currentAddress = await Address.findOne({
      _id: new ObjectId(addressId),
    });

    //to Check if currentAddress exists
    if (!currentAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    console.log(currentAddress);
    if (currentAddress.selected == true) {
      throw new Error("Selected Address Cannot be removed");
    } else {
      await Address.deleteOne({ _id: new ObjectId(addressId) });
      res.status(200).json({ message: "Address removed" });
    }
  } catch (error) {
    if (error.message == "Selected Address Cannot be removed") {
      res.status(400).json({ error: error.message });
    } else {
      console.log(error);
      res.status(500).json({ error: "Internal server" });
    }
  }
});

const getAllAddress = catchAsyncError(async (req, res, next) => {
  try {
    // console.log("controller");
    const UserId = req.user._id;
    // console.log(UserId);
    // const { addressId } = req.body;
    let hotelAddresses = await Address.find({
      HotelId: new ObjectId(UserId),
      selected: false,
    });

    // console.log(hotelAddresses);
    res.status(200).json({ hotelAddresses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getSelectedAddress = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.user._id;
    let address = await Address.findOne({
      HotelId: new ObjectId(UserId),
      selected: true,
    });
    console.log(UserId);
    res.status(200).json({ address });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const updateSelectedAddress = catchAsyncError(async (req, res, next) => {
  try {
    const UserId = req.user._id;
    const { addressId } = req.body;
    await Address.updateMany(
      { UserId: new ObjectId(UserId), selected: true },
      { $set: { selected: false } }
    );
    await Address.updateOne(
      { _id: new ObjectId(addressId) },
      { $set: { selected: true } }
    );
    res.status(200).json({ message: "Updated selected address" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  addAddress,
  removeAddress,
  getAllAddress,
  getSelectedAddress,
  updateSelectedAddress,
};
