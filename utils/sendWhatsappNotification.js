const HotelVendorLink = require("../models/hotelVendorLink.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

async function sendWhatsappmessge(vendorsOrders) {
  try {
    function formatDate(date) {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return new Date(date).toLocaleDateString("en-US", options);
    }

    const transformItems = (items) => {
      return items.map(item => {
          const { itemName, quantity } = item;
          const totalKg = quantity.kg + (quantity.gram / 1000);
  
          let formattedQuantity;
          if (totalKg > 0) {
              formattedQuantity = `${quantity.kg} kg  ${quantity.gram}grams`;
          } else if (quantity.piece > 0) {
              formattedQuantity = `${quantity?.piece} piece/pieces`;
          } else if (quantity.litre > 0) {
            formattedQuantity = `${quantity?.litre} litre/litres`;
        } else if (quantity.packet > 0) {
              formattedQuantity = `${quantity.packet} packet/packets`;
          } else {
              formattedQuantity = 0; // Handle the case where quantity is zero or none of the conditions are met
          }
  
          return { itemName, quantity: formattedQuantity };
      });
  };

    function itemDistribution(items) {

      let newItems = transformItems(items)

      let str = ``;
      for (let item of newItems) {
        str =
          str +
          `\\n${item?.itemName} - ${item?.quantity} \\n`;
      }
      console.log(str)
      return str;
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
          to: "91" + vendor.subVendorPhone,
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
                    text: vendor.vendorName,
                  },
                  {
                    type: "text",
                    text: todayDate,
                  },
                  {
                    type: "text",
                    text: itemDistribution(vendor?.items),
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

module.exports = { sendWhatsappmessge };
