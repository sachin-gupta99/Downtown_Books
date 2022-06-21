require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongodbStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const validator = require('express-validator');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const adminRoute = require('./routes/admin');
const shopRoute = require('./routes/shop');
const authRoute = require('./routes/auth');
const User = require('./models/User');

const app = express();
const store = new MongodbStore({
    uri : process.env.MONGO_URI,
    collection : 'sessions'
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'pdfs');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const filtering = (req, file, cb) => {
    if(file.mimetype === 'application/pdf')
        cb(null, true);
    else
        cb(null, false);
};

app.set('view engine', 'pug');
app.set('views', 'Views');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({storage: fileStorage, fileFilter: filtering}).single('pdfFile'));
app.use(session({
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : false,
    store : store
}));

app.use(express.json());
app.use(flash());
app.use(cookieParser());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
    
});

app.use('/admin', adminRoute);
app.use(shopRoute);
app.use(authRoute);

app.use((req, res, next) => {
    res.status(404).render('notFound', {pageTitle: 'Error 404'});
});

app.use((error, req, res, next) => {
    res.render('error', {
        pageTitle: 'Error',
        path: '/500',
        message: error
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(result => {
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {new Error(err)});