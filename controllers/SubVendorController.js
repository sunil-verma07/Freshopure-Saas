const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const SubVendor = require("../models/subVendor");
const { ObjectId } = require("mongodb");
const Items = require("../models/item");

const addVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const vendorId = req.user._id;
    if (!fullName || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all feilds properly!" });
    } else {
      const vendor = await SubVendor.findOne({ phone });

      if (vendor) {
        return res
          .status(400)
          .json({ success: false, error: "Vendor already exists!" });
      } else {
        const newVendor = await SubVendor.create({
          vendorId: new Object(vendorId),
          fullName,
          phone,
        });
        res.status(200).json({ message: "New Vendor Added!" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeVendor = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.body; // Assuming vendorId is provided in the request parameters

    // Check if vendorId is provided
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required" });
    }

    console.log(vendorId);
    // Find vendor by ID and remove it
    const removedVendor = await SubVendor.find(vendorId);
    console.log(removeVendor);
    // Check if vendor was found and removed
    if (removedVendor) {
      await SubVendor.deleteOne({ vendorId });
      res.status(200).json({
        success: true,
        message: "Vendor removed successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    // Vendor removed successfully
  } catch (error) {
    console.log(error);
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
        res.status(200).json({ message: "Items assigned to Sub Vendor" });
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
    const { _id } = req.body;

    const { itemIds } = req.body;

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

    // Check if vendor was found and updated
    if (updatedVendor) {
      res.status(200).json({
        success: true,
        message: "Items removed from vendor successfully",
        vendor: updatedVendor,
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

module.exports = {
  addVendor,
  removeVendor,
  addItemToVendor,
  removeItemsFromVendor,
  getSubVendorItems,
};
