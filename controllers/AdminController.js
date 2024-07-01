const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const Category = require("../models/category.js");
const PaymentPlan = require("../models/paymentPlan.js");
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
const hotelItemPrice = require("../models/hotelItemPrice.js");
const UserDetails = require("../models/userDetails.js");
const { generateUniqueId } = require("../services/uniqueIdVerification.js");

const addNewCategory = catchAsyncError(async (req, res, next) => {
  try {
    const { name } = req.body;
    const images = req.files;
    const createdBy = req.user._id;
    const isActive = true;

    if (!name) {
      throw new Error("Category Name is required.");
    }
    if (!images) {
      throw new Error("Category Image is required.");
    }

    let imagesReqBody = [];
    for (let i = 0; i < images.length; ++i) {
      const image = images[i];
      const result = await itemImageS3.uploadFile(image);
      // console.log(result)
      await unlinkFile(image.path);
      if (image.fieldname == "image") isDisplayImage = true;
      const imageReqBody = {
        imageLink: `/category/image/${result.Key}`,
      };
      // console.log(imageReqBody,result);
      imagesReqBody.push(imageReqBody);
    }

    const category = new Category({
      name: name,
      img: imagesReqBody[0].imageLink,
      createdBy: createdBy,
      isActive: true,
    });

    await category.save();
    res.status(200).json({ message: "Category Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const linkHoteltoVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId, hotelId, fixed } = req.body;
    const isActive = true;

    console.log(vendorId, hotelId, fixed, "controller");

    if (!vendorId || !hotelId) {
      throw new Error("HotelId and VendorId required.");
    }

    const linkPresent = await HotelVendorLink.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new Object(hotelId),
    });

    console.log(linkPresent);
    if (linkPresent) {
      return res
        .status(500)
        .json({ message: "Hotel already linked to vendor" });
    } else {
      console.log("here");
      const newLink = new HotelVendorLink({
        vendorId: vendorId,
        hotelId: hotelId,
        isActive: isActive,
        isPriceFixed: fixed,
      });

      await newLink.save();

      const hotels = await HotelVendorLink.aggregate([
        {
          $match: { vendorId: new ObjectId(vendorId), _id: newLink._id },
        },
        {
          $lookup: {
            from: "UserDetails",
            localField: "hotelId",
            foreignField: "userId",
            as: "hotelDetails",
          },
        },
        {
          $unwind: "$hotelDetails",
        },
        {
          $lookup: {
            from: "Users",
            localField: "hotelId",
            foreignField: "_id",
            as: "hotelContact",
          },
        },
        {
          $unwind: "$hotelContact",
        },
      ]);

      console.log(hotels, "newLink");
      res.status(200).json({
        message: "Hotel linked to vendor successfully.",
        hotel: hotels,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
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

    const itemData = await Item.aggregate([
      {
        $match: { _id: newItem._id },
      },
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

    res
      .status(201)
      .json({ message: "Item created successfully", item: itemData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const orderDetailById = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // console.log(req.body);

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
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorId",
          foreignField: "userId",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
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

    const hotelData = await UserDetails.aggregate([
      {
        $match: { roleId: new ObjectId(hotelRoleId) },
      },
      {
        $lookup: {
          from: "Users",
          foreignField: "_id",
          localField: "userId",
          as: "userFlags",
        },
      },
      {
        $unwind: "$userFlags",
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

    const vendorData = await UserDetails.aggregate([
      {
        $match: { roleId: new ObjectId(vendorRoleId) },
      },
      {
        $lookup: {
          from: "Users",
          foreignField: "_id",
          localField: "userId",
          as: "userFlags",
        },
      },
      {
        $unwind: "$userFlags",
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

const addHotel = catchAsyncError(async (req, res, next) => {
  try {
    const { organization, fullName, email, phone, gst, fssai } = req.body;

    if (!organization || !fullName || !email || !phone || !gst || !fssai) {
      return res.status(404).json({ error: "All the Fields are Required" });
    }

    const user = await User.findOne({ phone: phone });

    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists!" });
    } else {
      const roleId = await Role.findOne({ name: "Hotel" });
      const uniqueCode = await generateUniqueId();
      const encryptedCode = await encrypt(uniqueCode);

      const newUser = await User.create({
        uniqueId: encryptedCode,
        phone: phone,
        isProfileComplete: true,
        isReviewed: true,
        isApproved: true,
        hasActiveSubscription: true,
        dateOfActivation: null,
      });

      await newUser.save();

      const newUserDetails = new UserDetails({
        userId: newUser._id,
        fullName: fullName,
        email: email,
        organization: organization,
        roleId: roleId._id,
        GSTnumber: gst,
        FSSAInumber: fssai,
      });

      await newUserDetails.save();

      const hotelData = await UserDetails.aggregate([
        {
          $match: { userId: newUserDetails.userId },
        },
        {
          $lookup: {
            from: "Users",
            foreignField: "_id",
            localField: "userId",
            as: "userFlags",
          },
        },
        {
          $unwind: "$userFlags",
        },
      ]);

      res.status(200).json({ success: true, user: hotelData });
    }
  } catch (error) {
    res.send(error);
  }
});

const removeHotel = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId } = req.body;
    // console.log(hotelId, "hotelId contr heree");

    if (!hotelId) {
      return res.status(404).json({ error: "HotelId is Required" });
    }

    const user = await User.findOne({ _id: hotelId });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Hotel Not Found in Database!" });
    } else {
      const deletedUser = await User.findOneAndDelete({
        _id: new ObjectId(hotelId),
      });
      const deleteDetails = await UserDetails.findOneAndDelete({
        userId: new ObjectId(hotelId),
      });

      // console.log(deletedUser, "Deleted");
      res.status(200).json({ success: true, user: deletedUser });
    }
  } catch (error) {
    res.send(error);
  }
});

const addVendor = catchAsyncError(async (req, res, next) => {
  try {
    console.log("heyyy add vendor contr");
    const { organization, fullName, email, phone, gst } = req.body;

    if (!organization || !fullName || !email || !phone || !gst) {
      return res.status(404).json({ error: "All the Fields are Required" });
    }

    const user = await User.findOne({ phone: phone });

    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists!" });
    } else {
      const roleId = await Role.findOne({ name: "Vendor" });
      const uniqueCode = await generateUniqueId();
      const encryptedCode = await encrypt(uniqueCode);

      const newUser = await User.create({
        uniqueId: encryptedCode,
        phone: phone,
        isProfileComplete: true,
        isReviewed: true,
        isApproved: true,
        hasActiveSubscription: true,
        dateOfActivation: null,
      });

      await newUser.save();

      const newUserDetails = new UserDetails({
        userId: newUser._id,
        fullName: fullName,
        email: email,
        organization: organization,
        roleId: roleId._id,
        GSTnumber: gst,
      });

      await newUserDetails.save();

      const vendorData = await UserDetails.aggregate([
        {
          $match: { userId: newUserDetails.userId },
        },
        {
          $lookup: {
            from: "Users",
            foreignField: "_id",
            localField: "userId",
            as: "userFlags",
          },
        },
        {
          $unwind: "$userFlags",
        },
      ]);

      res.status(200).json({ success: true, user: vendorData });
    }
  } catch (error) {
    res.send(error);
  }
});

const removeVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(404).json({ error: "VendorId is Required" });
    }

    const user = await User.findOne({ _id: vendorId });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Hotel Not Found in Database!" });
    } else {
      const deletedUser = await User.findOneAndDelete({
        _id: new ObjectId(vendorId),
      });
      const deleteDetails = await UserDetails.findOneAndDelete({
        userId: new ObjectId(vendorId),
      });

      // console.log(deletedUser, "Deleted");
      res.status(200).json({ success: true, user: deletedUser });
    }
  } catch (error) {
    res.send(error);
  }
});

const removeItem = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(404).json({ error: "ItemId is Required" });
    }

    const item = await Item.findOne({ _id: itemId });

    if (!item) {
      return res
        .status(400)
        .json({ success: false, error: "Item Not Found in Database!" });
    } else {
      const deletedItem = await Item.findOneAndDelete({
        _id: new ObjectId(itemId),
      });

      // console.log(deletedUser, "Deleted");
      res.status(200).json({ success: true, item: deletedItem });
    }
  } catch (error) {
    res.send(error);
  }
});

const reviewUser = catchAsyncError(async (req, res, next) => {
  try {
    const { userId, status } = req.body;

    // console.log(userId, status);

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

const getAllCategories = catchAsyncError(async (req, res, next) => {
  try {
    const category = await Category.find();
    res.json({ category });
  } catch (error) {
    res.json({ error });
  }
});

const getHotelVendors = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    console.log(hotelId, "absghd");

    const vendors = await HotelVendorLink.aggregate([
      {
        $match: { hotelId: new ObjectId(hotelId) },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorId",
          foreignField: "userId",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
      },
      {
        $lookup: {
          from: "Users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorContact",
        },
      },
      {
        $unwind: "$vendorContact",
      },
    ]);

    res.json({ vendors });
  } catch (error) {
    res.json({ error });
  }
});

const getHotelOrders = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;

    const orders = await UserOrder.aggregate([
      {
        $match: { hotelId: new ObjectId(hotelId) },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorId",
          foreignField: "userId",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
    ]);

    res.json({ orders });
  } catch (error) {
    res.json({ error });
  }
});

const getHotelItems = catchAsyncError(async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;

    const items = await hotelItemPrice.aggregate([
      {
        $match: { hotelId: new ObjectId(hotelId) },
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
        $unwind: "$itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemId",
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

    res.json({ items });
  } catch (error) {
    res.json({ error });
  }
});

const getVendorHotels = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;

    const hotels = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelContact",
        },
      },
      {
        $unwind: "$hotelContact",
      },
    ]);

    res.json({ hotels });
  } catch (error) {
    res.json({ error });
  }
});

const getVendorOrders = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    // console.log(vendorId);

    const orders = await UserOrder.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "vendorId",
          foreignField: "userId",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
      },
      {
        $lookup: {
          from: "UserDetails",
          localField: "hotelId",
          foreignField: "userId",
          as: "hotelDetails",
        },
      },
      {
        $unwind: "$hotelDetails",
      },
    ]);

    res.json(orders);
  } catch (error) {
    res.json({ error });
  }
});

const getVendorItems = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;

    const items = await hotelItemPrice.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
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
        $unwind: "$itemDetails",
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemId",
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

    res.json({ items });
  } catch (error) {
    res.json({ error });
  }
});

const addNewPaymentPlan = catchAsyncError(async (req, res, next) => {
  try {
    const { name, duration, features, price } = req.body;

    if (!name) {
      throw new Error("All fields are required");
    }

    const paymentPlan = new PaymentPlan({
      name,
      duration,
      features,
      price,
    });

    await paymentPlan.save();
    res.status(200).json({ message: "Payment Plan Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAssignableHotels = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;

    const hotelRoleId = await Role.findOne({ name: "Hotel" });

    if (!hotelRoleId) {
      return res.status(404).json({ error: "Role does not exist" });
    }

    // Get all hotels
    const allHotels = await UserDetails.aggregate([
      {
        $match: { roleId: new ObjectId(hotelRoleId._id) },
      },
      {
        $lookup: {
          from: "Users",
          foreignField: "_id",
          localField: "userId",
          as: "userFlags",
        },
      },
      {
        $unwind: "$userFlags",
      },
    ]);

    // Get linked hotels
    const linkedHotels = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
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

    // Create a set of linked hotel IDs
    const linkedHotelIds = new Set(
      linkedHotels.map((hotel) => hotel.hotelId.toString())
    );

    // Filter out linked hotels from allHotels
    const unlinkedHotels = allHotels.filter(
      (hotel) => !linkedHotelIds.has(hotel.userId.toString())
    );

    res.json({ hotels: unlinkedHotels });
  } catch (error) {
    res.json({ error });
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
  addHotel,
  removeHotel,
  addVendor,
  removeVendor,
  reviewUser,
  placeOrderByAdmin,
  getAllCategories,
  getHotelVendors,
  getHotelOrders,
  getHotelItems,
  getVendorHotels,
  getVendorOrders,
  getVendorItems,
  addNewPaymentPlan,
  getAssignableHotels,
  removeItem,
};
