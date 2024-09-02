const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const category = require("../models/category");
const role = require("../models/role");
const user = require("../models/user");
const userDetails = require("../models/userDetails");

const getVendorsForCustomers = catchAsyncErrors(async function (
  req,
  res,
  next
) {
  const userId = req.user._id;
  const category = req.body;

  const roleId = await role.findOne({ name: "Vendor" });
  const vendors = await userDetails.find({ roleId: roleId?._id });
});

const getAllCategories = catchAsyncErrors(async (req, res, next) => {
  try {
    const categories = await category.find();

    return res.json({ categories });
  } catch (error) {
    return res.json({ message: "Internal Error" });
  }
});

const getAllItemsForHotel = catchAsyncErrors(async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user._id;

    const data = await HotelItemPrice.aggregate([
      {
        $match: { customerId: userId, categoryId: new ObjectId(categoryId) },
      },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: `$itemDetails`,
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
        $unwind: `$vendorDetails`,
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemId",
          foreignField: "itemId",
          as: "itemDetails.image",
        },
      },
      {
        $unwind: `$itemDetails.image`,
      },
    ]);
    res.status(200).json({ data: data });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  getAllItemsForHotel,
  getAllCategories,
};
