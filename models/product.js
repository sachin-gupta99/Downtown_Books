const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    image : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    pdfPath : {
        type : String,
        required : true
    },
    userId : {
        type : mongoose.Types.ObjectId,
        ref : 'User',
        required : true
    }
});


module.exports = mongoose.model('Product', productSchema);
