const HotelVendorLink = require("../models/hotelVendorLink.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

async function sendWhatsappmessge(dataItems) {
  try {
   

    function formatDate(date) {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return new Date(date).toLocaleDateString("en-US", options);
    }

    // Get today's date and format it
    const todayDate = formatDate(new Date());

    for (let vendor of vendorsOrders) {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("authkey", process.env.AUTH_KEY_MSG91);

      var raw = JSON.stringify({
        integrated_number: "919216200680",
        content_type: "template",
        payload: {
          to: vendor.phone,
          type: "template",
          template: {
            name: "vendor_message",
            language: {
              code: "en_US",
              policy: "deterministic",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: todayDate,
                  },
                  {
                    type: "text",
                    text: vendor.string,
                  },
                ],
              },
            ],
          },
          messaging_product: "whatsapp",
        },
      });

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      await fetch(
        "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/",
        requestOptions
      )
        .then((response) => response.text("yayyyy"))
        .then((result) => console.log(result))
        .catch((error) => console.log("error", error));
    }
  } catch (error) {
    console.log(error);
  }
}


const distributeAmongSubvendors = catchAsyncErrors(async (req, res, next) => {

  try {
    const vendorId = req.user._id;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderData = await HotelVendorLink.aggregate([
      {
        $match: { vendorId: vendorId },
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
        $lookup: {
          from: "Users",
          localField: "hotelId",
          foreignField: "_id",
          as: "hotelOrders.hotelDetails",
        },
      },
      {
        $unwind: "$hotelOrders.hotelDetails", // Unwind hotel details (optional, if hotelDetails is usually a single document)
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

          hotelOrders: { $push: "$hotelOrders" },
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
        $project: {
          _id: 0,
          totalQuantityOrdered: {
            kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
            gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
          }, // Total quantity ordered in kg and grams
          itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details

          hotelOrders: "$hotelOrders",
        },
      },
    ]);
    
    res.status(200).json({
      status: "success",
      data: orderData,
    });

  } catch (error) {
    console.log(error)
  }
})


module.exports = { sendWhatsappmessge ,distributeAmongSubvendors};
