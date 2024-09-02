require("dotenv").config();

const aws = require("aws-sdk");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
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
const customerRoute = require("./routes/CustomerRoute");

const errorMiddleware = require("./middleware/error");
const authMiddleware = require("./middleware/auth");

require("./db");
const cors = require("cors");
const ACTIONS = require("./actions");

const app = express();

const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http, {
  cors: {
    origin: [
      "http://localhost:19006",
      "http://localhost:4000",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const corsOptions = {
  origin: [
    "http://localhost:19006",
    "http://localhost:4000",
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
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
app.use("/customer", customerRoute);

app.use(errorMiddleware);

io.on("connection", (socket) => {
  console.log("User Connected!");

  socket.on("testing", (data) => {
    console.log(`hey! you've reached ${data}`);
  });

  socket.on("order-placed", (data) => {
    console.log("msg from hotel: ", data);

    io.emit("new-order", "Order Placed", () => {
      console.log("i have sent the update of order!");
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected!");
  });
});

const port = process.env.PORT;
http.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
