const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    resetToken : String,
    resetTokenExpiration : Date,
    cart : {
        items : [
            {
                productId : { type : mongoose.Types.ObjectId, ref : 'Product', required : true},
                quantity : {type : Number, required : true}
            }
        ]
    }
});

userSchema.methods.addToCart = function(product) {
    const reqdIndex = this.cart.items.findIndex(p => p.productId.toString() === product._id.toString());
    if(reqdIndex != -1) {
        this.cart.items[reqdIndex].quantity += 1;
    } else {
        newProduct = {productId : product._id, quantity : 1};
        this.cart.items.push(newProduct);
    }
    this.save();
}

userSchema.methods.deleteFromCart = function(prodId) {
    const reqdIndex = this.cart.items.findIndex(p => p.productId.toString() == prodId.toString());
    if(reqdIndex!=-1) {
        const updatedCart = [...this.cart.items];
        updatedCart.splice(reqdIndex, 1);
        this.cart.items = updatedCart;
        this.save();
    }
}
module.exports = mongoose.model('user', userSchema);