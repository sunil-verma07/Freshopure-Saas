"use strict";

function sendWhatsappmessge(dataItems) {
  var formatDate, vendorsOrders, todayDate, _i, _vendorsOrders, vendor, myHeaders, raw, requestOptions;

  return regeneratorRuntime.async(function sendWhatsappmessge$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

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
          formatDate = function formatDate(date) {
            var options = {
              day: "numeric",
              month: "long",
              year: "numeric"
            };
            return new Date(date).toLocaleDateString("en-US", options);
          }; // Get today's date and format it


          vendorsOrders = [];
          todayDate = formatDate(new Date());
          _i = 0, _vendorsOrders = vendorsOrders;

        case 5:
          if (!(_i < _vendorsOrders.length)) {
            _context.next = 17;
            break;
          }

          vendor = _vendorsOrders[_i];
          myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          myHeaders.append("authkey", process.env.AUTH_KEY_MSG91);
          raw = JSON.stringify({
            integrated_number: "919216200680",
            content_type: "template",
            payload: {
              to: vendor.phone,
              type: "template",
              template: {
                name: "vendor_message",
                language: {
                  code: "en_US",
                  policy: "deterministic"
                },
                components: [{
                  type: "body",
                  parameters: [{
                    type: "text",
                    text: todayDate
                  }, {
                    type: "text",
                    text: vendor.string
                  }]
                }]
              },
              messaging_product: "whatsapp"
            }
          });
          requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };
          _context.next = 14;
          return regeneratorRuntime.awrap(fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", requestOptions).then(function (response) {
            return response.text("yayyyy");
          }).then(function (result) {
            return console.log(result);
          })["catch"](function (error) {
            return console.log("error", error);
          }));

        case 14:
          _i++;
          _context.next = 5;
          break;

        case 17:
          _context.next = 22;
          break;

        case 19:
          _context.prev = 19;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 19]]);
}

module.exports = {
  sendWhatsappmessge: sendWhatsappmessge
};