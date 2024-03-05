const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const Category = require("../models/category.js");
const Item = require("../models/item.js");
const Image = require("../models/image.js");
const itemImageS3 = require("../services/itemImageS3.js");
const HotelVendorLink = require("../models/hotelVendorLink.js");
const { encrypt, decrypt } = require("../services/encryptionServices");
const db = getDatabase();
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const OrderStatus = require("../models/orderStatus.js");
const UserOrder = require("../models/order.js");
const Cart = require("../models/cart.js");
const User = require("../models/user.js");
const Role = require("../models/role.js");

const addNewCategory = catchAsyncError(async (req, res, next) => {
  try {
    const { name } = req.body;
    const createdBy = req.user._id;
    const isActive = true;

    if (!name) {
      throw new Error("Category Name is required.");
    }

    const category = new Category({
      name,
      createdBy,
      isActive,
    });

    await category.save();
    res.status(200).json({ message: "Category Added" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const linkHoteltoVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId, hotelId } = req.body;
    const isActive = true;

    if (!vendorId || !hotelId) {
      throw new Error("HotelId and VendorId required.");
    }

    const linkPresent = await HotelVendorLink.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new Object(hotelId),
    });

    if (linkPresent) {
      return res
        .status(500)
        .json({ message: "Hotel already linked to vendor" });
    } else {
      const newLink = new HotelVendorLink({
        vendorId: vendorId,
        hotelId: hotelId,
        isActive: isActive,
      });
      await newLink.save();

      res.status(200).json({ message: "Hotel linked to vendor successfully." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const addNewItem = catchAsyncError(async function (req, res, next) {
  const images = req.files;

  try {
    // Create a new item in MongoDB
    const newItem = new Item({
      name: req.body.name,
      description: req.body.description,
      unit: req.body.unit,
      categoryId: req.body.categoryId,
    });
    await newItem.save();

    // Create a new image metadata entry in MongoDB

    let imagesReqBody = [];
    for (let i = 0; i < images.length; ++i) {
      const image = images[i];
      const result = await itemImageS3.uploadFile(image);
      // console.log(result)
      await unlinkFile(image.path);
      if (image.fieldname == "image") isDisplayImage = true;
      const imageReqBody = {
        imageLink: `/items/image/${result.Key}`,
      };
      // console.log(imageReqBody,result);
      imagesReqBody.push(imageReqBody);
    }

    const itemImageReqBody = {
      img: imagesReqBody[0].imageLink,
      itemId: newItem._id,
    };

    const newImage = new Image(itemImageReqBody);
    await newImage.save();

    res
      .status(201)
      .json({ message: "Item created successfully", item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const orderDetailById = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.body;

    console.log(req.body);

    const orderData = await UserOrder.aggregate([
      {
        $match: { _id: new ObjectId(orderId) },
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatuses",
        },
      },
      {
        $unwind: "$orderStatuses",
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "orderedItems.itemDetails",
        },
      },
      {
        $unwind: "$orderedItems.itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "orderedItems.itemDetails._id",
          foreignField: "itemId",
          as: "orderedItems.itemDetails.images",
        },
      },
      {
        $unwind: "$orderedItems.itemDetails.images",
      },
      {
        $group: {
          _id: "$_id",
          hotelId: { $first: "$hotelId" },
          hotelDetails: { $first: "$hotelDetails" },
          orderNumber: { $first: "$orderNumber" },
          isReviewed: { $first: "$isReviewed" },
          orderStatuses: { $first: "$orderStatuses" },
          orderedItems: { $push: "$orderedItems" },
          isItemAdded: { $first: "$isItemAdded" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);
    res.status(200).json({ orderData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAllOrders = catchAsyncError(async (req, res, next) => {
  try {
    const orderData = await UserOrder.aggregate([
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatuses",
        },
      },
      {
        $unwind: "$orderStatuses",
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
    ]);
    res.status(200).json({ orderData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAllHotels = catchAsyncError(async (req, res, next) => {
  try {
    const hotelRoleId = await Role.findOne({ name: "Hotel" });

    if (!hotelRoleId) {
      return res.status(404).json({ error: "Role does not exist" });
    }

    const hotelData = await User.aggregate([
      {
        $match: { roleId: new ObjectId(hotelRoleId) },
      },
    ]);
    res.status(200).json({ hotelData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAllVendors = catchAsyncError(async (req, res, next) => {
  try {
    const vendorRoleId = await Role.findOne({ name: "Vendor" });

    if (!vendorRoleId) {
      return res.status(404).json({ error: "Role does not exist" });
    }

    const vendorData = await User.aggregate([
      {
        $match: { roleId: new ObjectId(vendorRoleId) },
      },
    ]);
    res.status(200).json({ vendorData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAllItems = catchAsyncError(async (req, res, next) => {
  try {
    const itemData = await Item.aggregate([
      {
        $lookup: {
          from: "Images",
          localField: "_id",
          foreignField: "itemId",
          as: "images",
        },
      },
      {
        $unwind: "$images",
      },
      {
        $lookup: {
          from: "Category",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
    ]);
    res.status(200).json({ itemData });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const getHotelOrdersById = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId } = req.body;

    const orderData = await UserOrder.aggregate([
      {
        $match: { hotelId: new ObjectId(hotelId) },
      },

      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatuses",
        },
      },
      {
        $unwind: "$orderStatuses",
      },
    ]);
    res.status(200).json({ orderData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const addUser = catchAsyncError(async (req, res, next) => {
  try {
    const { organization, fullName, email, phone, role } = req.body;

    if (!organization || !fullName || !email || !phone || !role) {
      return res.status(404).json({ error: "All the Fields are Required" });
    }

    const user = await User.findOne({ email: email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists!" });
    } else {
      const hashedPassword = encrypt("Freshopure123@");

      const userRole = await Role.findOne({ name: role });

      const newUser = new User({
        organization: organization,
        email: email,
        phone: phone,
        password: hashedPassword,
        fullName: fullName,
        roleId: userRole._id,
        isReviewed: true,
        reviewStatus: "approved",
      });

      await newUser.save();

      res.status(200).json({ success: true, user: newUser });
    }
  } catch (error) {
    res.send(error);
  }
});

const reviewUser = catchAsyncError(async (req, res, next) => {
  try {
    const { userId, status } = req.body;

    if (!status || !userId) {
      return res.status(404).json({ error: "Status or userId not received" });
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let editedUser;

    if (status.toLowerCase() === "approved") {
      editedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { isApproved: "approved" } },
        { returnDocument: "after" }
      );
    } else if (status.toLowerCase() === "rejected") {
      editedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { isApproved: "rejected" } },
        { returnDocument: "after" }
      );
    }

    res.status(201).json({ editedUser });
  } catch (error) {
    res.send(error);
  }
});

const placeOrderByAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { HotelId, addressId, orderedItems, vendorId } = req.body;
    if (!HotelId || !addressId || !orderedItems || !vendorId) {
      return res
        .status(404)
        .json({ error: "Please Enter all the required details" });
    }

    const orderStatusdoc = await OrderStatus.find({ status: "Order Placed" });
    const orderStatus = orderStatusdoc.map((status) => status._id);

    const currentDate = new Date();
    const formattedDate = currentDate
      .toISOString()
      .substring(0, 10)
      .replace(/-/g, "");
    const randomNumber = Math.floor(Math.random() * 10000);
    const orderNumber = `${formattedDate}-${randomNumber}`;

    const order = new UserOrder({
      vendorId,
      hotelId: HotelId,
      orderNumber,
      orderStatus,
      addressId,
      orderedItems,
    });

    await order.save();

    res.send({ order });
  } catch (error) {
    res.send(error);
  }
});

module.exports = {
  linkHoteltoVendor,
  addNewCategory,
  addNewItem,
  orderDetailById,
  getAllOrders,
  getAllHotels,
  getAllVendors,
  getAllItems,
  getHotelOrdersById,
  addUser,
  reviewUser,
  placeOrderByAdmin,
};
