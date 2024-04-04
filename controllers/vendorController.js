const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require("../dbClient.js");
const { ObjectId } = require("mongodb");
const Wishlist = require("../models/wishlist.js");
const HotelItemPrice = require("../models/hotelItemPrice.js");
const VendorItems = require("../models/VendorItems.js");
const db = getDatabase();
const HotelVendorLink = require("../models/hotelVendorLink.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const SubVendor = require("../models/subVendor.js");
const { sendWhatsappmessge } = require("../utils/sendWhatsappNotification.js");
const user = require("../models/user.js");
const Image = require("../models/image.js");
const Orders = require("../models/order.js");
const vendorStock = require("../models/vendorStock.js");
const puppeteer = require("puppeteer");
const UserOrder = require("../models/order.js");
const Items = require("../models/item");
const { isObjectIdOrHexString } = require("mongoose");
const vendorCategories = require("../models/vendorCategories.js");

const setHotelItemPrice = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, hotelId, categoryId, price } = req.body;

    const vendorId = req.user._id;

    if (!itemId || !hotelId || !price || !categoryId) {
      throw new Error("All fields are required.");
    }

    const linkPresent = await HotelVendorLink.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new Object(hotelId),
    });

    if (!linkPresent) {
      return res.status(500).json({ message: "Hotel is not linked to vendor" });
    }

    const itemPresent = await HotelItemPrice.findOne({
      $and: [
        { vendorId: new ObjectId(vendorId) },
        { hotelId: new ObjectId(hotelId) },
        { itemId: new ObjectId(itemId) },
      ],
    });

    if (!itemPresent) {
      await HotelItemPrice.create({
        vendorId: vendorId,
        hotelId: hotelId,
        itemId: itemId,
        categoryId: categoryId,
        todayCostPrice: price,
      });

      res.status(200).json({ message: "Price updated successfully." });
    } else {
      itemPresent.yesterdayCostPrice = itemPresent.todayCostPrice;
      itemPresent.todayCostPrice = price;

      await itemPresent.save();

      const items = await getHotelItemsFunc(hotelId, vendorId);

      res
        .status(200)
        .json({ message: "Price updated successfully.", data: items });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderHistoryForVendors = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;


    const orderData = await UserOrder.aggregate([
      {
        $match: { vendorId: vendorId }
      },

      {
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelDetails"
        }
      },
      {
        $unwind: "$hotelDetails"
      },
      {
        $lookup: {
          from: "orderstatuses",
          localField: "orderStatus",
          foreignField: "_id",
          as: "orderStatusDetails"
        }
      },
      {
        $unwind: "$orderStatusDetails"
      },
      {
        $unwind: "$orderedItems" // Unwind orderedItems array
      },
      {
        $lookup: {
          from: "Items",
          localField: "orderedItems.itemId",
          foreignField: "_id",
          as: "itemDetails"
        }
      },
      {
        $unwind: "$itemDetails"
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "images"
        }
      },
      {
        $unwind: "$images"
      },
      {
        $group: {
          _id: {
            orderId: "$_id"
          },
          orderNumber:{$first: "$orderNumber"},
          isReviewed:{$first: "$isReviewed"},
          totalPrice:{$first: "$totalPrice"},
          address:{$first: "$address"},
          createdAt:{$first: "$createdAt"},
          updatedAt:{$first: "$updatedAt"},
          hotelId: { $first: "$hotelId" },
          orderNumber: { $first: "$orderNumber" },
          hotelDetails: { $first: "$hotelDetails" },
          // orderData: { $first: "$$ROOT" },
          orderStatusDetails:{ $first : "$orderStatusDetails"},

          orderedItems: {
            $push: {
              $mergeObjects: [
                "$orderedItems",
                { itemDetails: "$itemDetails" },
                { image: "$images" }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          address: 1,
          orderNumber: 1,
          hotelId: 1,
          hotelDetails: 1,
          orderNumber:1,
          isReviewed:1,
          totalPrice:1,
          address:1,
          createdAt:1,
          orderStatusDetails:1,
          updatedAt:1,
          // orderData: 1,
          orderedItems: 1
        }
      }
    ]);

    res.status(200).json({
      status: "success message",
      data: orderData
    });
  } catch (error) {
    next(error);
  }
});


const hotelsLinkedWithVendor = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: vendorId },
      },
      {
        $lookup: {
          from: "orders",
          localField: "hotelId",
          foreignField: "hotelId",
          as: "hotelOrders",
        },
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
        $group: {
          _id: "$hotelOrders._id",
          hotelId: { $first: "$hotelId" },
          hotelDetails: { $first: "$hotelDetails" },
          orderData: { $first: "$hotelOrders" },
        },
      },
      {
        $project: {
          _id: 0,
          hotelId: 1,
          hotelDetails: 1,
          // orderData: 1,
          // orderedItems: 2,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: orderData,
    });
  } catch (error) {
    next(error);
  }
});

const todayCompiledOrders = catchAsyncError(async (req, res, next) => {

  const vendorId = req.user._id;
  const today = new Date(); // Assuming you have today's date
  today.setHours(0, 0, 0, 0); // Set time to the start of the day
  
  try {
    const orderData = await UserOrder.aggregate([
      {
        $match: {
          vendorId: vendorId,
          createdAt: { $gte: today } // Filter orders for today
        }
      },
      {
        $unwind: "$orderedItems" // Unwind orderedItems array
      },
      {
        $group: {
          _id: "$orderedItems.itemId",
          totalQuantityOrderedGrams: {
            $sum: {
              $add: [
                { $multiply: ["$orderedItems.quantity.kg", 1000] }, // Convert kg to grams
                "$orderedItems.quantity.gram" // Add grams
              ]
            }
          }, // Total quantity ordered in grams
          itemDetails: { $first: "$orderedItems" }, // Take item details from the first document
          hotelOrders: { $push: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "Items",
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails"
        }
      },
      {
        $lookup: {
          from: "Images",
          localField: "_id",
          foreignField: "itemId",
          as: "itemImages"
        }
      },
      {
        $project: {
          _id: 0,
          totalQuantityOrdered: {
            kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
            gram: { $mod: ["$totalQuantityOrderedGrams", 1000] } // Calculate remaining grams
          }, // Total quantity ordered in kg and grams
          itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
          itemImages: { $arrayElemAt: ["$itemImages", 0] }, // Get the item images
        }
      }
    ]);
  
    res.status(200).json({
      status: "success",
      data: orderData
    });
  } catch (error) {
    next(error);
  }
});

const vendorItem = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const AllItems = await HotelItemPrice.find({ vendorId }).select("itemId");
    const AssignedItems = await SubVendor.find({ vendorId }).select(
      "assignedItems"
    );

    let assignedItemsArray = [];
    for (let item of AssignedItems) {
      assignedItemsArray.push(...item.assignedItems);
    }

    const Items = AllItems.filter(
      (obj1) =>
        !assignedItemsArray.some((obj2) => obj1.itemId.equals(obj2.itemId))
    );

    res.status(200).json({ success: true, Items }); // Sending the items back to the client
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getAllSubVendors = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const data = await SubVendor.find({ vendorId: vendorId });

    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    next(error);
  }
});

const sendCompiledOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const vendorId = req.user._id; // Destructure the user object directly

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) }, // Convert vendorId to ObjectId
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
          from: "orders",
          let: { hotelId: "$hotelId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$hotelId", "$$hotelId"] },
                    { $gte: ["$createdAt", today] }, // Filter orders for today
                  ],
                },
              },
            },
          ],
          as: "hotelOrders",
        },
      },
      {
        $unwind: "$hotelOrders",
      },
      {
        $unwind: "$hotelOrders.orderedItems", // Unwind orderedItems array
      },
      {
        $group: {
          _id: "$hotelOrders.orderedItems.itemId",
          totalQuantityOrderedGrams: {
            $sum: {
              $add: [
                { $multiply: ["$hotelOrders.orderedItems.quantity.kg", 1000] }, // Convert kg to grams
                "$hotelOrders.orderedItems.quantity.gram", // Add grams
              ],
            },
          }, // Total quantity ordered in grams
          itemDetails: { $first: "$hotelOrders.orderedItems" }, // Take item details from the first document
        },
      },
      {
        $lookup: {
          from: "Items",
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $lookup: {
          from: "Images",
          localField: "_id",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $project: {
          _id: 0,
          totalQuantityOrdered: {
            kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
            gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
          }, // Total quantity ordered in kg and grams
          itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
          itemImages: { $arrayElemAt: ["$itemImages", 0] }, // Get the item images
        },
      },
    ]);

    const SubVendorsArray = await SubVendor.aggregate([
      {
        $match: {
          vendorId: vendorId,
          "assignedItems.itemId": {
            $in: orderData.map((order) => order.itemDetails._id),
          },
        }, // Match documents with the specified vendorId and matching assigned itemIds
      },
      {
        $unwind: "$assignedItems", // Deconstruct the assignedItems array
      },
      {
        $match: {
          "assignedItems.itemId": {
            $in: orderData.map((order) => order.itemDetails._id),
          },
        }, // Match assignedItems with the itemIds from orderData
      },
      {
        $lookup: {
          from: "Items",
          localField: "assignedItems.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails", // Deconstruct the itemDetails array
      },
      {
        $lookup: {
          from: "Category",
          localField: "itemDetails.categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo", // Deconstruct the categoryInfo array
      },
      {
        $lookup: {
          from: "Images",
          localField: "itemDetails._id",
          foreignField: "itemId",
          as: "itemImages",
        },
      },
      {
        $project: {
          _id: "$_id",
          vendorId: 1,
          subVendorPhone: "$phone", // Include the phone number of the subvendor
          itemId: "$assignedItems.itemId",
          itemName: "$itemDetails.name",
          itemDescription: "$itemDetails.description",
          category: "$categoryInfo.name",
          itemImages: "$itemImages.img",
        },
      },
    ]);

    //   sendWhatsappmessge();
    res.json({
      success: true,
      SubVendorsArray,
    });
    // Handle the fetched data as needed
  } catch (error) {
    next(error);
  }
});

const getHotelItemList = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { HotelId } = req.body;
    console.log(vendorId, HotelId);

    const pipeline = [
      {
        $match: {
          vendorId: new ObjectId(vendorId),
          hotelId: new ObjectId(HotelId),
        },
      },
      {
        $lookup: {
          from: "Items",
          localField: "itemId",
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
          localField: "itemId",
          foreignField: "itemId",
          as: "items.image",
        },
      },
      {
        $unwind: "$items.image",
      },
      {
        $lookup: {
          from: "Category",
          localField: "categoryId",
          foreignField: "_id",
          as: "items.category",
        },
      },
      {
        $unwind: "$items.category",
      },
    ];
    // Fetch items associated with the vendor and hotelId, populating the associated item's fields
    const itemList = await HotelItemPrice.aggregate(pipeline);

    return res.json({ data: itemList });
  } catch (error) {
    throw error;
  }
});

const getAllOrdersbyHotel = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const { HotelId } = req.body;

    console.log(vendorId, HotelId);

    const hotelOrders = await Orders.find({
      hotelId: HotelId,
      vendorId,
    }).populate("orderStatus");
    // .populate("addressId");
    // .populate({
    //   path: "orderedItems.itemId",
    //   populate: { path: "itemId" }, // Populate the associated item details
    // });

    res.json({ hotelOrders });
  } catch (error) {
    next(error);
  }
});

const updateStock = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    const vendorId = req.user._id;

    if (!itemId || !quantity) {
      return res.status(400).json({ message: "All the fields are required!" });
    }

    let item = await vendorStock.findOne({ vendorId });
    if (!item) {
      // Create a new stock entry if it doesn't exist
      item = new vendorStock({
        vendorId: vendorId,
        stocks: [
          {
            itemId: itemId,
            quantity: {
              kg: 0,
              gram: 0,
              piece: 0,
            },
          },
        ],
      });
    }

    // Update the quantity of the item in the stock
    const stocks = item.stocks.map((stock) => {
      if (stock.itemId.toString() === itemId) {
        return {
          itemId: itemId,
          quantity: {
            kg: quantity.kg || stock.quantity.kg,
            gram: quantity.gram || stock.quantity.gram,
            piece: quantity.piece || stock.quantity.piece,
          },
        };
      }
      return stock;
    });

    item.stocks = stocks;
    await item.save();

    const vendorStocks = await getVendorStockFunc(vendorId);
    if (vendorStocks.length > 0) {
      res.json({
        message: "Stock updated successfully",
        data: vendorStocks[0],
      });
    }
  } catch (error) {
    next(error);
  }
});

const generateInvoice = catchAsyncError(async (req, res, next) => {
  const { orderId } = req.body;
  console.log(orderId);
  const orderData = await UserOrder.aggregate([
    {
      $match: { _id: new ObjectId(orderId) },
    },
    {
      $lookup: {
        from: "orderstatuses",
        localField: "orderStatus",
        foreignField: "_id",
        as: "orderStatus",
      },
    },
    {
      $unwind: "$orderStatus",
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
        from: "Users",
        localField: "vendorId",
        foreignField: "_id",
        as: "vendorDetails",
      },
    },
    {
      $unwind: "$vendorDetails",
    },

    // {
    //   $unwind: "$orderedItems" // Unwind the orderedItems array
    // },
    {
      $lookup: {
        from: "Items", // Target collection
        localField: "orderedItems.itemId", // Field from the input collection
        foreignField: "_id", // Field from the target collection
        as: "itemDetails", // Output array field
      },
    },
    {
      $addFields: {
        "orderedItems.itemDetails": { $arrayElemAt: ["$itemDetails", 0] }, // Add itemDetails to orderedItems
      },
    },
    {
      $lookup: {
        from: "Category", // Target collection
        localField: "orderedItems.itemDetails.categoryId", // Field from the input collection
        foreignField: "_id", // Field from the target collection
        as: "categoryDetails", // Output array field
      },
    },
    {
      $addFields: {
        "orderedItems.itemDetails.category": {
          $arrayElemAt: ["$categoryDetails", 0],
        }, // Add categoryDetails to itemDetails
      },
    },
  ]);

  const data = orderData[0];

  console.log(data);

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      marginBottom: "30px",
      width: "520px",
      margin: "auto",
      paddingRight: "10px",
      borderRadius: "8px",
      background: "#fff",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "5px",
    },
    logo: {
      maxWidth: "50px",
      maxHeight: "50px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "10px",
    },
    th: {
      border: "1px solid #ddd",
      padding: "4px",
      textAlign: "left",
      background: "#f2f2f2",
      fontSize: "10px",
    },
    td: {
      border: "1px solid #ddd",
      padding: "4px",
      fontSize: "8px",
    },
    total: {
      textAlign: "right",
      fontSize: "12px",
      fontWeight: "600",
    },
  };

  const date = (createdOnString) => {
    // Assuming createdOn is a date string or a Date object
    const createdOn = new Date(createdOnString); // Replace this with your actual date

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      // Use 24-hour format
    };

    const formattedDateTime = new Intl.DateTimeFormat("en-US", options).format(
      createdOn
    );

    return `${formattedDateTime}`;
  };

  const totalPrice = (items) => {
    let totalPrice = 0;
    for (let item of items) {
      totalPrice =
        totalPrice +
        (item.price * item.quantity?.kg +
          item.price * (item.quantity?.gram / 1000));
    }

    return totalPrice;
  };

  const generateInlineStyles = (styles) => {
    return Object.keys(styles)
      .map((key) => `${key}:${styles[key]}`)
      .join(";");
  };

  let html = `
    <div style="${generateInlineStyles(styles.container)}">
      <div style="${generateInlineStyles(styles.header)}">
        
        <!-- <img src={Logo} alt="Logo" style=${generateInlineStyles(
          styles.logo
        )} /> -->
        <div>
          <h1 style="font-weight:600;font-size:24px;">INVOICE</h1>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between">
        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;">Hello, ${
          data?.hotelDetails?.fullName
        }.<br/>Thank you for shopping from ${data?.vendorDetails?.fullName}.</p>
        <p style="line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;text-align:right">Order #${
          data?.orderNumber
        } <br/> </p>
      </div>
      <div style="display:flex;margin-bottom:10px">
        <div style="border:1px solid #ddd ;flex:1;margin-right:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">${
            data?.vendorDetails?.fullName
          }</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          Rajasthan
          302017
          </p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          GSTIN/UIN: 08ABFCS1307P1Z2
          </p> 
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : Rajasthan, Code : 08
          
          </p>
        </div>
        <div style="border:1px solid #ddd ;flex:1;margin-left:5px;padding:10px">
          <p style="font-weight:600;font-size:12px;">${
            data?.hotelDetails?.fullName
          }</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          ${data?.address?.addressLine1},${data?.address?.addressLine2},${
    data?.address?.city
  }
          ,${data?.address?.pinCode} 
          </p>
          
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px">
          State Name : ${data?.address?.state}, Code : 08
          </p>
        </div>
      </div>
      <table style="${generateInlineStyles(styles.table)}">
        <thead>
          <tr>
            <th style="${generateInlineStyles(styles.th)}">Item Name</th>
            <th style="${generateInlineStyles(styles.th)}">Category</th>
            <th style="${generateInlineStyles(styles.th)}">Quantity</th>
            <th style="${generateInlineStyles(styles.th)}">Unit Price</th>
            <th style="${generateInlineStyles(styles.th)}">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data?.orderedItems
            ?.map(
              (item, index) => `
            <tr key=${index}>
              <td style="${generateInlineStyles(styles.td)}">${
                item?.itemDetails?.name
              }</td>
              <td style="${generateInlineStyles(styles.td)}">${
                item?.itemDetails?.category?.name
              }</td>
              <td style="${generateInlineStyles(styles.td)}">${
                item.quantity?.kg
              } Kg   ${item?.quantity?.gram} Grams</td>
              <td style="${generateInlineStyles(styles.td)}">${item.price}</td>
              <td style="${generateInlineStyles(styles.td)}">${
                item.price * item.quantity?.kg +
                item.price * (item.quantity?.gram / 1000)
              }</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div style="${generateInlineStyles(styles.total)}">
        <p>Total:₹${totalPrice(data?.orderedItems)}</p>
      </div>
      <div style="display:flex;margin-bottom:10px;margin-top:20px">
        <div style="flex:1;margin-right:5px">
          <p style="font-weight:600;font-size:10px;">Declaration</p>
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:10px">
          We declare that this invoice shows the actual price of the 
          goods described and that all particulars are true and 
          correct
          </p>
         
        </div>
        <div style="flex:1;margin-right:5px;text-align:right">
          <p style="font-weight:600;font-size:10px;">for Shvaas Sustainable Solutions Private Limited</p>
          
          <p style="line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:30px;text-align:right">
          Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the content of the page to the provided HTML
    await page.setContent(html);

    // Generate the PDF stream
    const pdfBuffer = await page.pdf({ format: "A4" });

    // Set response headers for PDF download
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="generated.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");

    // Send the PDF as a stream in the response
    res.send(pdfBuffer);

    // Close the Puppeteer browser
    await browser.close();
  } catch (error) {
    console.error("Error creating PDF:", error);
    res.status(500).send("Error creating PDF", error);
  }
});

const addItemToStock = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const vendorId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ message: "itemId is required!" });
    }

    // Check if the item already exists in the stock for the vendor
    const stock = await vendorStock.findOne({ vendorId });
    if (stock) {
      const itemExists = stock.stocks.some(
        (item) => item.itemId.toString() === itemId
      );
      if (itemExists) {
        return res
          .status(400)
          .json({ message: "Item already exists in the stock" });
      }
      // Add the new item to the stock
      stock.stocks.push({ itemId, quantity: { kg: 0, gram: 0, piece: 0 } });
      await stock.save();
    } else {
      // Create a new stock entry if the vendor doesn't have any existing stock
      await vendorStock.create({
        vendorId,
        stocks: [{ itemId, quantity: { kg: 0, gram: 0, piece: 0 } }],
      });
    }

    const vendorStocks = await getVendorStockFunc(vendorId);

    if (vendorStocks.length > 0) {
      res.json({
        message: "Stock added successfully",
        data: vendorStocks[0],
      });
    }
  } catch (error) {
    next(error);
  }
});

const getVendorStocks = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id; // Assuming req.user._id contains the vendorId

    // Aggregate pipeline to fetch vendor stocks with item details and images
    const stocks = await vendorStock.aggregate([
      {
        $match: { vendorId: new ObjectId(vendorId) },
      },
      {
        $unwind: "$stocks",
      },
      {
        $lookup: {
          from: "Items",
          localField: "stocks.itemId",
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
          localField: "stocks.itemId",
          foreignField: "itemId",
          as: "images",
        },
      },
      {
        $unwind: "$images",
      },
      {
        $addFields: {
          "stocks.itemDetails": "$itemDetails",
          "stocks.images": "$images",
        },
      },
      {
        $group: {
          _id: "$_id",
          vendorId: { $first: "$vendorId" },
          stocks: { $push: "$stocks" },
        },
      },
    ]);

    if (stocks.length > 0) {
      return res.json({ data: stocks[0] }); // Assuming each vendor has only one stock entry
    } else {
      return res.status(404).json({ message: "Vendor stock not found!" });
    }
  } catch (error) {
    next(error);
  }
});

const deleteItemFromStock = catchAsyncError(async (req, res, next) => {
  try {
    // Extract necessary parameters from the request
    const { itemId } = req.body;
    const vendorId = req.user._id;

    // Query the database to find the item in the stock
    const stock = await vendorStock.findOne({ vendorId: vendorId });

    if (!stock) {
      return res
        .status(404)
        .json({ message: "Stock not found for the vendor." });
    }

    // Find the index of the item to be deleted
    const itemIndex = stock.stocks.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the stock." });
    }

    // Remove the item from the stock
    stock.stocks.splice(itemIndex, 1);

    // Save the changes to the database
    await stock.save();

    const vendorStocks = await getVendorStockFunc(vendorId);
    if (vendorStocks.length > 0) {
      res.json({
        message: "Stock deleted successfully",
        data: vendorStocks[0],
      });
    }
  } catch (error) {
    // Handle errors
    next(error);
  }
});

const deleteHotelItem = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId, itemId } = req.body;
    const vendorId = req.user._id;

    // Check if vendorId, hotelId, and itemId are provided
    if (!vendorId || !hotelId || !itemId) {
      return res
        .status(400)
        .json({ message: "vendorId, hotelId, and itemId are required!" });
    }

    // Find and delete the document based on vendorId, hotelId, and itemId
    const item = await HotelItemPrice.findOne({
      vendorId: new ObjectId(vendorId),
      hotelId: new ObjectId(hotelId),
      itemId: new ObjectId(itemId),
    });

    if (!item) {
      return res.json({ message: "Item Not Found" });
    }

    await HotelItemPrice.deleteOne({ _id: item._id });

    const itemList = await getHotelItemsFunc(hotelId, vendorId);
    // Send success response
    res.json({ message: "Document deleted successfully", data: itemList });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const addHotelItem = catchAsyncError(async (req, res, next) => {
  try {
    const { hotelId, itemId, categoryId } = req.body;

    const vendorId = req.user._id;

    // Validate required fields
    if (!vendorId || !hotelId || !itemId || !categoryId) {
      return res.status(400).json({
        message: "vendorId, hotelId, itemId and categoryId are required fields",
      });
    }

    // Create new HotelItemPrice document
    const hotelItemPrice = new HotelItemPrice({
      vendorId,
      hotelId,
      itemId,
      categoryId,
      todayCostPrice: 0,
      showPrice: true, // Default to true if not provided
    });

    // Save the new document to the database
    await hotelItemPrice.save();
    const itemList = await getHotelItemsFunc({
      HotelId: hotelId,
      vendorId: vendorId,
    });
    // Send success response
    res.json({ message: "Document added successfully", data: itemList });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

const getHotelAssignableItems = catchAsyncError(async (req, res, next) => {
  try {
    const { categoryIds, hotelId } = req.body;
    const vendorId = req.user._id;

    console.log(categoryIds, hotelId, "abcd");

    if (!categoryIds || !hotelId) {
      return res
        .status(400)
        .json({ message: "Category IDs or Hotel ID not provided" });
    }

    const categoryIdsArray = categoryIds.map((item) =>
      item.categoryId.toString()
    );

    let allItemsIds = [];

    // Iterate over each categoryId
    for (let category of categoryIdsArray) {
      const items = await Items.find({ categoryId: category }).select("itemId");
      allItemsIds.push(...items); // Merge items into allItemsIds array
    }

    const hotelItems = await HotelItemPrice.find({
      vendorId: new ObjectId(vendorId),
      hotelId: new ObjectId(hotelId),
    }).select("itemId");

    const assignedItemIds = hotelItems.map((item) => item.itemId.toString());

    // Filter out items from allItemsIds that are not present in assignedItemIds
    const notAssignedItemIds = allItemsIds.filter(
      (item) => item._id && !assignedItemIds.includes(item._id.toString())
    );

    console.log(hotelItems);

    let assignItems = [];

    // Retrieve item details for not assigned items
    for (let item of notAssignedItemIds) {
      let newItem = {
        itemDetails: null,
      };

      const itemDetails = await Items.findOne({
        _id: new ObjectId(item._id),
      });

      newItem.itemDetails = itemDetails;

      assignItems.push(newItem);
    }

    res.status(200).json({
      assignItems,
      message: "filtered",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const addStockItemOptions = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const vendorItems = await HotelItemPrice.find({
      vendorId: new ObjectId(vendorId),
    }).select("itemId");

    const allItemsIds = vendorItems.map((item) => item.itemId.toString());

    let item = await vendorStock.findOne({ vendorId });

    // Update the quantity of the item in the stock
    let assignedItemIds = [];
    item.stocks.map((stock) => {
      assignedItemIds.push(stock.itemId.toString());
    });
    // Filter out items from allItemsIds that are not present in assignedItemIds
    const notAssignedItemIds = allItemsIds.filter(
      (item) => item && !assignedItemIds.includes(item.toString())
    );

    console.log(allItemsIds, assignedItemIds, notAssignedItemIds);

    let assignItems = [];

    // Retrieve item details for not assigned items
    for (let item of notAssignedItemIds) {
      let newItem = {
        itemDetails: null,
      };

      const itemDetails = await Items.findOne({
        _id: new ObjectId(item),
      });

      newItem.itemDetails = itemDetails;

      assignItems.push(newItem);
    }

    res.status(200).json({
      assignItems,
      message: "filtered",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const getVendorCategories = catchAsyncError(async (req, res, next) => {
  try {
    const vendorId = req.user._id;

    const vendor = await vendorCategories.findOne({ vendorId: vendorId });

    console.log(vendor);

    if (!vendor) {
      return res.json({ message: "vendor not found!" });
    }

    return res.json({ message: "successful", vendor });
  } catch (error) {
    return res.json({ message: "internal error!" });
  }
});

const getVendorStockFunc = async (vendorId) => {
  const pipeline = [
    {
      $match: { vendorId: new ObjectId(vendorId) },
    },
    {
      $unwind: "$stocks",
    },
    {
      $lookup: {
        from: "Items",
        localField: "stocks.itemId",
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
        localField: "stocks.itemId",
        foreignField: "itemId",
        as: "images",
      },
    },
    {
      $unwind: "$images",
    },
    {
      $addFields: {
        "stocks.itemDetails": "$itemDetails",
        "stocks.images": "$images",
      },
    },
    {
      $group: {
        _id: "$_id",
        vendorId: { $first: "$vendorId" },
        stocks: { $push: "$stocks" },
      },
    },
  ];

  const stocks = await vendorStock.aggregate(pipeline);

  return stocks;
};

const getHotelItemsFunc = async ({ HotelId, vendorId }) => {
  const pipeline = [
    {
      $match: {
        vendorId: new ObjectId(vendorId),
        hotelId: new ObjectId(HotelId),
      },
    },
    {
      $lookup: {
        from: "Items",
        localField: "itemId",
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
        localField: "itemId",
        foreignField: "itemId",
        as: "items.image",
      },
    },
    {
      $unwind: "$items.image",
    },
    {
      $lookup: {
        from: "Category",
        localField: "categoryId",
        foreignField: "_id",
        as: "items.category",
      },
    },
    {
      $unwind: "$items.category",
    },
  ];

  const itemList = await HotelItemPrice.aggregate(pipeline);

  return itemList;
};

module.exports = {
  setHotelItemPrice,
  orderHistoryForVendors,
  hotelsLinkedWithVendor,
  todayCompiledOrders,
  vendorItem,
  getAllSubVendors,
  sendCompiledOrders,
  getHotelItemList,
  getAllOrdersbyHotel,
  generateInvoice,
  updateStock,
  addItemToStock,
  getVendorStocks,
  deleteItemFromStock,
  deleteHotelItem,
  addHotelItem,
  getHotelAssignableItems,
  getVendorCategories,
  addStockItemOptions,
};
