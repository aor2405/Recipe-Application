const cloudinary = require('cloudinary').v2;
const { cloudinaryStorage, CloudinaryStorage } = require('multer-storage-cloudinary');

// process.env from the '.env' file
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_KEY,
    api_secret : process.env.CLOUDINARY_SECERT 
});

// Setting an instance of cloudinary
const storage = new CloudinaryStorage({
    cloudinary, // Passing in the above info
    params: {
        folder: 'Recipe',
        allowedFormat: ['jpeg', 'png', 'jpg']
    }
})

module.exports = { cloudinary, storage }