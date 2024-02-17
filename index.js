require('dotenv').config()
const aws = require('aws-sdk');

const express = require('express');
const bodyParser = require('body-parser');
// const msg91 = require('msg91').default;
const cookieParser = require('cookie-parser');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KET,
  region: process.env.AWS_BUCKET_REGION
});


const userRoute = require('./routes/UserRoute');
const orderRoute = require('./routes/OrderRoute');
const cartRoute = require('./routes/CartRoute');
const wishlistRoute = require('./routes/WishlistRoute');
const addressRoute = require('./routes/addressRoute');
const adminRoute = require('./routes/adminRoute');
const vendorRoute = require('./routes/vendorRoute');
const hotelRoute = require('./routes/HotelRoute');

const errorMiddleware = require('./middleware/error');


require("./db");
const cors = require("cors");

const app = express();
app.use(cookieParser());
app.use(errorMiddleware);

// msg91.initialize({ authKey: process.env.AUTHKEY });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const corsOptions ={
  origin:['exp://192.168.152.236:8081',], 
  credentials:true,//access-control-allow-credentials:true
  optionSuccessStatus:200
}
app.use(cors(corsOptions));

// Set headers to allow CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", ["exp://192.168.152.236:8081"]);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});


app.use('/user', userRoute);
app.use('/order', orderRoute);
app.use('/cart', cartRoute);
app.use('/wishlist', wishlistRoute);
app.use('/address', addressRoute);
app.use('/admin', adminRoute);
app.use('/vendor', vendorRoute);
app.use('/hotel', hotelRoute);


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});






