const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const SubVendor = require("../models/subVendor");
const { ObjectId } = require("mongodb");

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
    const vendorId = req.user._id; // Assuming vendorId is provided in the request parameters

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
    const { vendorId } = req.body;

    const { itemIds } = req.body;

    // Check if vendorId and itemIds are provided
    if (!vendorId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and an array of Item IDs are required",
      });
    }

    // Find vendor by ID
    const vendor = await SubVendor.findOne({ _id: new ObjectId(vendorId) });

    // Check if vendor exists
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    // Push each itemId to assignedItems array
    itemIds.forEach((itemId) => {
      vendor.assignedItems.push({ itemId });
    });

    // Save the updated vendor
    await vendor.save();

    // Return success message
    res.status(200).json({
      success: true,
      message: "Items added to vendor successfully",
      vendor,
    });
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
    if (!_id || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and an array of Item IDs are required",
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

module.exports = {
  addVendor,
  removeVendor,
  addItemToVendor,
  removeItemsFromVendor,
};
