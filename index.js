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
const itemsRoute = require('./routes/ItemRoute');
const cartRoute = require('./routes/CartRoute');
const wishlistRoute = require('./routes/WishlistRoute');
const addressRoute = require('./routes/AddressRoute');
const adminRoute = require('./routes/adminRoute');
const vendorRoute = require('./routes/vendorRoute');
const hotelRoute = require('./routes/HotelRoute');

const errorMiddleware = require('./middleware/error');


require("./db");

const app = express();
app.use(cookieParser());
app.use(errorMiddleware);

// msg91.initialize({ authKey: process.env.AUTHKEY });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/user', userRoute);
app.use('/order', orderRoute);
app.use('/items', itemsRoute);
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






