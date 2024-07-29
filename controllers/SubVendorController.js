const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const SubVendor = require("../models/subVendor");
const { ObjectId } = require("mongodb");
const Items = require("../models/item");
const Image = require("../models/image");
const HotelItemPrice = require("../models/hotelItemPrice.js");

const addVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const vendorId = req.user._id;
    if (!fullName || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields properly!" });
    } else {
      // Generate subVendorCode
      const generateCode = () => {
        let num = Math.random() * 9000;
        return "SV-" + Math.floor(num + 999);
      };
      const subVendorCode = generateCode();

      // Check if subVendorCode already exists
      const vendorWithCode = await SubVendor.findOne({ subVendorCode });
      if (vendorWithCode) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Vendor with this code already exists!",
          });
      }

      // Check if phone number already exists
      const vendorWithPhone = await SubVendor.findOne({ phone });
      if (vendorWithPhone) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Vendor with this phone number already exists!",
          });
      }

      // Create new vendor
      const newVendor = new SubVendor({
        vendorId,
        subVendorCode,
        fullName,
        phone,
      });

      await newVendor.save();

      const data = await SubVendor.find({ vendorId });
      res.status(200).json({ message: "New Vendor Added!", data });
    }
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    const { vendorId } = req.body; // Assuming vendorId is provided in the request parameters
    const user = req.user._id;
    // Check if vendorId is provided
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required" });
    }

    // Find vendor by ID and remove it
    const removedVendor = await SubVendor.findOne({
      _id: new ObjectId(vendorId),
    });

    // Check if vendor was found and removed
    if (removedVendor) {
      await SubVendor.deleteOne({ _id: vendorId });

      const data = await SubVendor.find({ vendorId: user });

      res.status(200).json({
        success: true,
        data: data,
        message: "Vendor removed successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    // Vendor removed successfully
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const addItemToVendor = async (req, res) => {
  try {
    const { vendorId, itemIds } = req.body;

    // Check if vendorId and itemIds are provided
    if (!vendorId || !itemIds) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and an array of Item IDs are required",
      });
    }

    const subVendorPresent = await SubVendor.findOne({
      _id: new ObjectId(vendorId),
    });

    const elementFound = await SubVendor.findOne({
      _id: new ObjectId(vendorId),
      assignedItems: {
        $elemMatch: {
          itemId: itemIds[0].itemId,
        },
      },
    });
    if (!elementFound) {
      if (subVendorPresent) {
        const items = [...subVendorPresent.assignedItems, ...itemIds];
        await SubVendor.updateOne(
          { _id: new ObjectId(vendorId) },
          { $set: { assignedItems: items } }
        );

        const AssignedItems = await getSubVendorItemsFunc(vendorId);

        // console.log(AssignedItems, "sv Cont");
        res.status(200).json({
          message: "Items assigned to Sub Vendor",
          items: AssignedItems,
        });
      } else {
        res.status(400).json({ error: "Item already added" });
      }
    } else {
      res.status(400).json({ error: "Item already added" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const removeItemsFromVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    const { _id, itemIds } = req.body;

    // Check if vendorId and itemIds are provided
    if (!_id || !itemIds) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and and Item ID are required",
      });
    }

    // Find vendor by ID and update the assignedItems array
    const updatedVendor = await SubVendor.findOneAndUpdate(
      { _id },
      { $pull: { assignedItems: { itemId: { $in: itemIds } } } },
      { new: true }
    );

    const AssignedItems = await getSubVendorItemsFunc(_id);

    // Check if vendor was found and updated
    if (updatedVendor) {
      res.status(200).json({
        success: true,
        message: "Items removed from vendor successfully",
        vendor: updatedVendor,
        items: AssignedItems,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getSubVendorItems = catchAsyncErrors(async (req, res, next) => {
  try {
    const subvendorId = req.body._id;

    const AssignedItems = await getSubVendorItemsFunc(subvendorId);

    if (AssignedItems) {
      res.status(200).json({
        success: true,
        message: "successful",
        items: AssignedItems,
        length: AssignedItems.length,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getSubVendorAssignableItems = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    console.log(vendorId);

    // Fetch all item IDs
    const allItemsIds = await HotelItemPrice.find({
      vendorId: new ObjectId(vendorId),
    }).select("itemId");

    // Fetch subvendor items
    const subVendorItems = await SubVendor.find({
      vendorId: new ObjectId(vendorId),
    }).select("assignedItems");

    let assignedItems = [];
    for (const item of subVendorItems) {
      assignedItems.push(...item?.assignedItems);
    }

    const assignedItemIds = assignedItems.map((item) => item.itemId.toString());

    // Filter out items from allItemsIds that are not present in assignedItemIds
    const notAssignedItemIds = allItemsIds.filter(
      (item) => !assignedItemIds.includes(item.itemId.toString())
    ).map(item => item.itemId);

    // Fetch item details for not assigned items
    const itemsDetails = await Items.find({
      _id: { $in: notAssignedItemIds }
    });

       // Fetch images for the not assigned items
       const images = await Image.find({
        itemId: { $in: notAssignedItemIds }
      });
  
      // Combine item details with their corresponding images
      const itemsWithImages = itemsDetails.map(item => {
        const itemImage = images.find(image => image.itemId.toString() === item._id.toString());
        return {
          itemDetails:item.toObject(), // Convert mongoose document to plain JavaScript object
          itemImage: itemImage.toObject(), // Add image URL if it exists
        };
      });

      
    res.status(200).json(itemsWithImages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getSubVendorItemsFunc = async (subvendorId) => {
  const pipeline = [
    {
      $match: {
        _id: new ObjectId(subvendorId),
      },
    },
    {
      $unwind: "$assignedItems",
    },
    {
      $lookup: {
        from: "Items",
        localField: "assignedItems.itemId",
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
        localField: "assignedItems.itemId",
        foreignField: "itemId",
        as: "items.image",
      },
    },
    {
      $unwind: "$items.image",
    },
  ];

  const AssignedItems = await SubVendor.aggregate(pipeline);

  return AssignedItems;
};

module.exports = {
  addVendor,
  removeVendor,
  addItemToVendor,
  removeItemsFromVendor,
  getSubVendorItems,
  getSubVendorAssignableItems,
};
