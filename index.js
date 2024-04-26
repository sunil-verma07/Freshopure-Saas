require("dotenv").config();
const http = require("http");
const aws = require("aws-sdk");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const cookieParser = require("cookie-parser");

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KET,
  region: process.env.AWS_BUCKET_REGION,
});
const userRoute = require("./routes/UserRoute");
const orderRoute = require("./routes/OrderRoute");
const cartRoute = require("./routes/CartRoute");
const wishlistRoute = require("./routes/WishlistRoute");
const addressRoute = require("./routes/addressRoute");
const adminRoute = require("./routes/adminRoute");
const vendorRoute = require("./routes/vendorRoute");
const hotelRoute = require("./routes/HotelRoute");
const subVendorRoute = require("./routes/subVendorRoute");
const socketIo = require('./utils/socket');

const errorMiddleware = require("./middleware/error");
const authMiddleware = require("./middleware/auth");

require("./db");
const cors = require("cors");
const ACTIONS = require("./actions");

const app = express();
app.use(cookieParser());
app.use(errorMiddleware);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

const server = http.createServer(app);

socketIo.initWebSocket(server);


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", ["http://localhost:3000"]);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
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
app.use("/subvendor", subVendorRoute);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
