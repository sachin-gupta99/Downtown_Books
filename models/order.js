const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    productInfo : [
        {
            productId : {type : mongoose.Types.ObjectId, ref : "Product"},
            title : {type : String, required : true},
            price : {type : Number, required : true},
            description : {type : String, required : true},
            image : {type : String},
            quantity : {type : Number, required : true}
        }
    ],
    userInfo : {
        userId : {type : mongoose.Types.ObjectId, ref : 'user'},
        username : {type : String, required : true},
        email : {type : String, required : true}
    }
});

module.exports = mongoose.model('orders', orderSchema);