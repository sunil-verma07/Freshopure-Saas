async function sendWhatsappmessge(dataItems) {
  try {
    const vendorsOrders = [];
    // for (let item of dataItems) {
    //   let string = ``;
    //   let phone = item[0]?.mobile;
    //   if (phone == undefined) {
    //     continue;
    //   }
    //   if (item.length) {
    //     let str = ``;
    //     for (let x of item) {
    //       str += `${x.itemName}    -   ${x.hotelOrders} \\n\\n`;
    //     }
    //     string += str;
    //   }
    //   vendorsOrders.push({ string, phone });
    // }

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
module.exports = { sendWhatsappmessge };
