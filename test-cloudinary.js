const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'duwddcbuk', 
  api_key: '989289613761699', 
  api_secret: 'KcN9DvQNV6LOkOeyLxgZPl6587Y' 
});

const uploadImage = async () => {
    try {
        const result = await cloudinary.uploader.upload(
            "https://upload.wikimedia.org/wikipedia/commons/a/a0/Andrzej_Person_Kancelaria_Senatu.jpg", 
            { 
                faces: true, 
                categorization: "google_tagging", 
                auto_tagging: 0.6 
            }
        );
        console.log("Cloudinary Upload Response: ");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error: ", error);
    }
};

uploadImage();
