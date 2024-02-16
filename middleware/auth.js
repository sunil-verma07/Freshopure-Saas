const catchAsyncErrors = require("./catchAsyncErrors.js");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const Role = require("../models/role.js");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
	const {token} = req.cookies
  if (!token) {
    return res.status(500).json({success: false}); 
  }else{
    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      
        req.user = await User.findById(decodedData.id);
       } catch (error) {
         return res.status(500).json({success: false, error: error.message}); 
       }
      next();
  }
   
});

exports.authorizeRoles = (...roles) => {
  return async(req, res, next) => {
    const userRole = await Role.findOne({_id:req.user.roleId})
    if(!roles.includes((userRole.name).toLowerCase())){
      return res.status(403).json({success:false,error:`${userRole.name} is not allowed to access this resouce`})
    }else{
      next();
    }
  };
};

exports.profileComplete = catchAsyncErrors(async (req, res, next) => {
	try {
    const user = req.user
    if (user.isProfieComplete == true) {
        if(user.isProfileReviewed == true && user.reviewStatus=='Approved'){
        next();
        }else{
            res.status(406).json({profileComplete:false,isProfileReviewed:user.isProfileReviewed,reviewStatus:user.reviewStatus, error: 'Profile Not Reviewed' });
        }
    } else {
        res.status(406).json({profileComplete:false, error: 'Profile Not Completed' });
    }

} catch (error) {
    res.status(500).json({ error });
}
   
});