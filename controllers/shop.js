const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SK_KEY);

const Product = require('../models/product');
const Orders = require('../models/order');
const auth = require('./auth');
const pdfGenerator = require('../pdfGenerator');

const ITEMS_PER_PAGE = 4;

exports.getCart = async (req, res, next) => {

    const productDetail = [];
    let totalPrice = 0;
    let message = null;
        
    for(let cartItem of req.user.cart.items) {
        const prodId = cartItem.productId;
        const quantity = cartItem.quantity;
        await Product.findById(prodId)
            .then(product => {
                if(!product) {
                    req.user.deleteFromCart(prodId);
                } else {
                    product.quantity = quantity;
                    productDetail.push(product);
                    totalPrice += product.price*quantity;
                }
            })
            .catch(err => {console.log(err)});
    }
    totalPrice = totalPrice.toFixed(2);

    if(req.session.failedPayment) {
        message = req.session.failedPayment;
        req.session.failedPayment = undefined;
    }


    res.render('shop/cart', {
        pageTitle : 'Cart',
        path : '/cart',
        products : productDetail,
        totalPrice : totalPrice,
        message: message,
        isAuthenticated : req.session.isLoggedIn,
        isAdmin : req.session.isAdmin
    });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() =>{
            res.redirect('/cart');
        })
        .catch(err => {console.log(err)});

};

exports.checkout = (req, res, next) => {
    let products;
    req.user.populate("cart.items.productId")
        .then(user => {
            products = user.cart.items;
            res.render('shop/checkout', {
                products: products
            });
        })
        .catch(err => {next(new Error(err))});
};

exports.createCheckoutSessions = async (req, res, next) => {

    let products;
    await req.user.populate("cart.items.productId")
        .then(user => {
            products = user.cart.items;
        });

    const line_items = [];
    for(let i of products) {
        const new_item = {};
        new_item.quantity = i.quantity;
        const product_data = {};
        product_data.name = i.productId.title;
        const price_data = {};
        price_data.product_data = product_data;
        price_data.currency = 'inr';
        price_data.unit_amount = i.productId.price*100;
        new_item.price_data = price_data;
        line_items.push(new_item);
    }
    
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: line_items,
        success_url: 'http://localhost:3000/checkout/success',
        cancel_url: 'http://localhost:3000/checkout/cancel'
    });

    res.redirect(session.url);
};

exports.paymentFailure = (req, res, next) => {
    req.session.failedPayment = 'Payment was declined. Please try again';
    res.redirect('/cart');
}

exports.decreaseItemInCart = (req, res, next) => {
    let updatedCart = [];
    const prodId = req.body.productId;
    const cartItems = req.user.cart.items;
    updatedCart = [...cartItems];
    const reqdIndex = cartItems.findIndex(p => p.productId == prodId);
    updatedCart[reqdIndex].quantity -= 1;

    if(updatedCart[reqdIndex].quantity == 0)
        updatedCart.splice(reqdIndex, 1);

    req.user.cart.items = updatedCart;
    req.user.save();
    res.redirect('/cart');
};


exports.increaseItemInCart = (req, res, next) => {
    const prodId = req.body.productId;
    const cartItems = req.user.cart.items;
    updatedCart = [...cartItems];
    const reqdIndex = cartItems.findIndex(p => p.productId == prodId);
    updatedCart[reqdIndex].quantity += 1;

    req.user.cart.items = updatedCart;
    req.user.save();
    res.redirect('/cart');
};

exports.orders = (req, res, next) => {

    Orders.find( { "userInfo.userId" : req.user._id } )
        .then(orders => {
            res.render('shop/orders', {
                pageTitle:'orders',
                path: '/orders',
                orders : orders,
                isAuthenticated : req.session.isLoggedIn,
                isAdmin : req.session.isAdmin
            });
        })
        .catch(err => {return next(new Error(err))});
};

exports.postOrder = async (req, res, next) => {
    const cartItems = req.user.cart.items;
    const userInfo = {userId : req.user._id, username : req.user.name, email : req.user.email};
    const productInfo = [];
    const toBeMailed = [];
    for(let i of cartItems) {
        const prodId = i.productId;
        const quantity = i.quantity;
        await Product.findById(prodId)
            .then(product => {
                let productDetail = {productId : prodId, title : product.title, image : product.image, description : product.description, price : product.price, quantity : quantity};
                productInfo.push(productDetail);
                let new_item = {};
                new_item.title = product.title;
                new_item.pdfPath = product.pdfPath;
                toBeMailed.push(new_item);
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    const newOrder = new Orders({
        productInfo : productInfo,
        userInfo : userInfo
    });
    await newOrder.save()
        .then(() => {
            req.user.cart.items = [];
            req.user.save()
                .then(() => {
                    res.redirect('/orders');
                })
                .catch(err => {console.log(err)});
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
    auth.sendOrders(toBeMailed, req.user.email);
    
};

exports.products = (req, res, next) => {

    let page = +req.query.page;

    if(isNaN(page))
        return res.redirect('/products/?page='+1);

    let lastPage;

    Product.find().count()
        .then(async allItems => {

            lastPage = Math.ceil(allItems/ITEMS_PER_PAGE);

            if(page > lastPage)
                return res.redirect('/products/?page='+lastPage);

            const products = await Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);

            res.render('shop/product-detail', {
                pageTitle: 'Products',
                path: '/products',
                prods: products,
                page: page,
                lastPage: lastPage,
                isAuthenticated: req.session.isLoggedIn,
                isAdmin: req.session.isAdmin
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProductById = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
    .then(product => {
        res.render('shop/individual-product-detail', {
            product:product,
            pageTitle: product.title,
            path:'/product/'+product.id,
            isAuthenticated : req.session.isLoggedIn,
            isAdmin : req.session.isAdmin
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getShowProducts = (req, res, next) => {

    let page = +req.query.page;

    if(isNaN(page))
        return res.redirect('/?page='+1);

    let lastPage;

    Product.find().count()
        .then(allItems => {
            lastPage = Math.ceil(allItems/ITEMS_PER_PAGE);

            if (page > lastPage)
                return res.redirect('/?page='+lastPage);
            
            return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .then(products => {
                res.render('shop/product-list', {
                    pageTitle:'Shop',
                    path:'/',
                    prods:products,
                    page: page,
                    lastPage: lastPage,
                    isAuthenticated : req.session.isLoggedIn,
                    isAdmin : req.session.isAdmin
                });
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postShowProducts = (req, res, next) => {
    res.redirect('/');
};

exports.getInvoice = async (req, res, next) => {
    const orderId = req.params.orderId;
    await Orders.findById(orderId)
        .then(order => {

            if(!order)
                return next(new Error('No orders Found'));

            const invoiceName = 'Invoice-' + order._id.toString() + '.pdf';
            const invoicePath = path.join(__dirname, '..', 'invoice', invoiceName);
            pdfGenerator(order, invoicePath, res);
            
        })
        .catch(err => {return next(new Error(err))});
};