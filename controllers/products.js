const fs = require('fs');
const path = require('path');

const validator = require('express-validator');
const Product = require('../models/product');

const ITEMS_PER_PAGE = 4;

exports.getAddProducts = (req, res, next) => {

    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;

    const oldInput = req.session.AddData;
    req.session.AddData = undefined;

    res.render('admin/add-product', {
        pageTitle:'Add Product',
        path: '/admin/add-products',
        isAuthenticated : req.session.isLoggedIn,
        isAdmin : req.session.isAdmin,
        message : message,
        oldInput : oldInput
    });
};


exports.postAddProducts = (req, res, next) => {
    const title = req.body.title;
    const image = req.body.image;
    const price = req.body.price;
    const description = req.body.description;
    const pdf = req.file;

    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        req.session.AddData = {
            title : title,
            image : image,
            price : price,
            description : description
        };
        return res.redirect('/admin/add-products');
    } else if(!pdf) {
        req.flash('error', 'Attachment not pdf');
        req.session.AddData = {
            title : title,
            image : image,
            price : price,
            description : description
        };
        return res.redirect('/admin/add-products');
    }
    
    const product = new Product({
        title : title,
        image : image,
        price : price,
        description : description,
        pdfPath : pdf.path,
        userId : req.user
    });

    product.save()
        .then(result => {
            console.log('Inserted one document');
            res.redirect('/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAdminProducts = (req, res, next) => {

    let page = +req.query.page;

    if(isNaN(page))
        return res.redirect('/admin/products/?page='+1);

    let lastPage;

    Product.find().count()
        .then(async allItems => {

            lastPage = Math.ceil(allItems/ITEMS_PER_PAGE);

            if(page > lastPage)
                return res.redirect('/admin/products/?page='+lastPage);

            const products = await Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);

            res.render('admin/products', {
                pageTitle:'Admin Products',
                path:'/admin/products',
                prods:products,
                page: page,
                lastPage: lastPage,
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

exports.EditProducts = (req, res, next) => {
    let prodId = req.body.productId;

    let message = req.flash('error');
    message = (message.length > 0) ? message[0] : null;

    Product.findById(prodId)
    .then(product => {
        if(!product)
            product = req.session.AddData;
            req.session.AddData = undefined;
        res.render('admin/edit-products', {
            pageTitle:'Edit Products',
            path:'/admin/edit-product',
            productDetail : product,
            isAuthenticated : req.session.isLoggedIn,
            isAdmin : req.session.isAdmin,
            message : message

        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.UpdateProduct = async (req, res, next) => {
    const prodId = req.body.id;
    const title = req.body.title;
    const image = req.body.image;
    const price = req.body.price;
    const description = req.body.description;
    const pdf = req.file;

    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        req.session.AddData = {
            title : title,
            image : image,
            price : price,
            description : description,
            _id : prodId
        };
        return res.redirect('/admin/edit-products');
    }

    await Product.findById(prodId)
        .then(product => {
            product.title = title;
            product.image = image;
            product.price = price;
            product.description = description;
            if(pdf != null) {
                const filePath = path.join(__dirname, '..', product.pdfPath);
                fs.unlink(filePath, err => {
                    if(err) throw err;
                });
                product.pdfPath = pdf.path;
            }
                
            return product.save()
                .then(() => {res.redirect('/')});

        })
        .catch(err => {next(new Error(err))});
};

exports.deleteProduct = async (req, res, next) => {

    const prodId = req.body.productId;


    await Product.findById(prodId)
        .then(product => {
            filePath = path.join(__dirname, '..', product.pdfPath);
            fs.unlink(filePath, err => {
                if(err) throw err;
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });


    await Product.deleteOne({_id : prodId});
    await req.user.deleteFromCart(prodId);
    
    res.redirect('/products');
};

