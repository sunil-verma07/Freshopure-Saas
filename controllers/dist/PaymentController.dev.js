"use strict";

var crypto = require("crypto");

var axios = require("axios");

var _require = require("./secret"),
    salt_key = _require.salt_key,
    merchant_id = _require.merchant_id;

var newPayment = function newPayment(req, res) {
  var merchantTransactionId, data, payload, payloadMain, keyIndex, string, sha256, checksum, prod_URL, options;
  return regeneratorRuntime.async(function newPayment$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          try {
            merchantTransactionId = req.body.transactionId;
            data = {
              merchantId: merchant_id,
              merchantTransactionId: merchantTransactionId,
              merchantUserId: req.body.MUID,
              name: req.body.name,
              amount: req.body.amount * 100,
              redirectUrl: "http://localhost:4000/api/status/".concat(merchantTransactionId),
              redirectMode: "POST",
              mobileNumber: req.body.number,
              paymentInstrument: {
                type: "PAY_PAGE"
              }
            };
            payload = JSON.stringify(data);
            payloadMain = Buffer.from(payload).toString("base64");
            keyIndex = 1;
            string = payloadMain + "/pg/v1/pay" + salt_key;
            sha256 = crypto.createHash("sha256").update(string).digest("hex");
            checksum = sha256 + "###" + keyIndex;
            prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
            options = {
              method: "POST",
              url: prod_URL,
              headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                "X-VERIFY": checksum
              },
              data: {
                request: payloadMain
              }
            };
            axios.request(options).then(function (response) {
              // console.log(response.data);
              return res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
            })["catch"](function (error) {
              console.error(error);
            });
          } catch (error) {
            res.status(500).send({
              message: error.message,
              success: false
            });
          }

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
};

var checkStatus = function checkStatus(req, res) {
  var merchantTransactionId, merchantId, keyIndex, string, sha256, checksum, options;
  return regeneratorRuntime.async(function checkStatus$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          merchantTransactionId = res.req.body.transactionId;
          merchantId = res.req.body.merchantId;
          keyIndex = 1;
          string = "/pg/v1/status/".concat(merchantId, "/").concat(merchantTransactionId) + salt_key;
          sha256 = crypto.createHash("sha256").update(string).digest("hex");
          checksum = sha256 + "###" + keyIndex;
          options = {
            method: "GET",
            url: "https://api.phonepe.com/apis/hermes/pg/v1/status/".concat(merchantId, "/").concat(merchantTransactionId),
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              "X-VERIFY": checksum,
              "X-MERCHANT-ID": "".concat(merchantId)
            }
          }; // CHECK PAYMENT TATUS

          axios.request(options).then(function _callee(response) {
            var url, _url;

            return regeneratorRuntime.async(function _callee$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    if (!(response.data.success === true)) {
                      _context2.next = 5;
                      break;
                    }

                    url = "http://localhost:3000/success";
                    return _context2.abrupt("return", res.redirect(url));

                  case 5:
                    _url = "http://localhost:3000/failure";
                    return _context2.abrupt("return", res.redirect(_url));

                  case 7:
                  case "end":
                    return _context2.stop();
                }
              }
            });
          })["catch"](function (error) {
            console.error(error);
          });

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  });
};

module.exports = {
  newPayment: newPayment,
  checkStatus: checkStatus
};