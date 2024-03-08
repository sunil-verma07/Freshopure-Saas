"use strict";

require("dotenv").config();

var aws = require("aws-sdk");

var path = require("path");

var express = require("express");

var bodyParser = require("body-parser"); // const msg91 = require('msg91').default;


var cookieParser = require("cookie-parser");

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KET,
  region: process.env.AWS_BUCKET_REGION
});

var userRoute = require("./routes/UserRoute");

var orderRoute = require("./routes/OrderRoute");

var cartRoute = require("./routes/CartRoute");

var wishlistRoute = require("./routes/WishlistRoute");

var addressRoute = require("./routes/addressRoute");

var adminRoute = require("./routes/adminRoute");

var vendorRoute = require("./routes/vendorRoute");

var hotelRoute = require("./routes/HotelRoute");

var subVendorRoute = require("./routes/subVendorRoute"); // const paymentRoutes = require("./routes/paymentRoute");


var errorMiddleware = require("./middleware/error");

var authMiddleware = require("./middleware/auth");

require("./db");

var cors = require("cors");

var app = express();
app.use(cookieParser());
app.use(errorMiddleware); // msg91.initialize({ authKey: process.env.AUTHKEY });

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
var corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  //access-control-allow-credentials:true
  optionSuccessStatus: 200
};
app.use(cors(corsOptions)); // Set headers to allow CORS

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", ["http://localhost:3000"]);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use("/user", userRoute);
app.use("/order", orderRoute);
app.use("/cart", cartRoute);
app.use("/wishlist", wishlistRoute);
app.use("/address", addressRoute);
app.use("/admin", adminRoute);
app.use("/vendor", vendorRoute);
app.use("/hotel", hotelRoute);
app.use("/subvendor", subVendorRoute); // app.use("/api", paymentRoutes);

var port = process.env.PORT;
app.listen(port, function () {
  console.log("Server is running on http://localhost:".concat(port));
});