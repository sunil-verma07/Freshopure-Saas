const ErrorHandler = require("../utils/errorhander.js");
const catchAsyncError = require("../middleware/catchAsyncErrors.js");
const { getDatabase } = require('../dbClient.js');
const { ObjectId } = require('mongodb');
const Category = require('../models/category.js');
const Item = require('../models/item.js');
const Image = require('../models/image.js');
const itemImageS3 = require('../services/itemImageS3.js');
const HotelVendorLink = require('../models/hotelVendorLink.js');
const db = getDatabase();
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);


const addNewCategory = catchAsyncError(async (req, res, next) => {
    try {
        const { name } = req.body;
        const createdBy = req.user._id;
        const isActive = true;

        if (!name) {
            throw new Error('Category Name is required.');
        }

        const category = new Category({
            name,
            createdBy,
            isActive
          });
    
          await category.save();
          res.status(200).json({ message: 'Category Added' });
       
        
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})


const linkHoteltoVendor = catchAsyncError(async (req, res, next) => {
    try {
        const { vendorId,hotelId } = req.body;
        const isActive = true;

        if (!vendorId || !hotelId) {
            throw new Error('HotelId and VendorId required.');
        }

        const linkPresent = await HotelVendorLink.findOne({ vendorId:  new ObjectId(vendorId),hotelId: new Object(hotelId)})

        if(linkPresent){
           return res.status(500).json({ message: 'Hotel already linked to vendor' });

        }else{
           

            const newLink = new HotelVendorLink({
                vendorId: vendorId,
                hotelId: hotelId,
                isActive: isActive
            });
            await newLink.save();

            res.status(200).json({ message: 'Hotel linked to vendor successfully.' });

        }
        
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})


const addNewItem = catchAsyncError( async function (req, res, next) {

  const images = req.files;


  try {
    // Create a new item in MongoDB
    const newItem = new Item({
      name: req.body.name,
      description: req.body.description,
      unit: req.body.unit,
      categoryId: req.body.categoryId,
    });
    await newItem.save();

    // Create a new image metadata entry in MongoDB

    let imagesReqBody = [];
    for (let i = 0; i < images.length; ++i) {
      const image = images[i];
      const result = await itemImageS3.uploadFile(image);
      // console.log(result)
      await unlinkFile(image.path);
      if (image.fieldname == "image") isDisplayImage = true;
      const imageReqBody = {
        imageLink: `/items/image/${result.Key}`,
      };
      // console.log(imageReqBody,result);
      imagesReqBody.push(imageReqBody);
    }
      

    const itemImageReqBody = {
      img: imagesReqBody[0].imageLink,
      itemId: newItem._id,
    };

    const newImage = new Image(itemImageReqBody);
    await newImage.save();

    res.status(201).json({ message: 'Item created successfully', item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
  });


  


module.exports = { linkHoteltoVendor, addNewCategory, addNewItem}