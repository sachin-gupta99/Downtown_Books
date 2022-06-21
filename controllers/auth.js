const bcrypt = require('bcryptjs');
const sgemail = require('@sendgrid/mail');
const crypto = require('crypto');
const validator = require('express-validator');
const fs = require('fs');

const User = require("../models/User");
const email_content = require('../email-body/content');

sgemail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOrders = (orders, custEmail) => {

    const files = [];
    for(let i of orders) {
        const new_item = {};
        let content = fs.readFileSync(i.pdfPath).toString('base64');
        new_item.filename = i.title+'.pdf';
        new_item.type = 'application/pdf',
        new_item.disposition = "attachment",
        new_item.content = content,
        files.push(new_item);
    }

    return sgemail.send({
        to : custEmail,
        from : {
            name : 'Downtown Books',
            email : process.env.OWNER_MAIL
        },
        subject : 'Voila!! Your orders are here.',
        html : email_content.orderBought,
        attachments : files
    });
};

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    message = (message.length > 0) ? message[0] : null;

    const oldInput = (req.cookies["oldInput"] ? req.cookies["oldInput"] : null);
    res.clearCookie('oldInput', {httpOnly : true});

    res.render('auth/login', {
        pageTitle : 'Login',
        path : '/login',
        message : message,
        oldInput : oldInput
    });
};

exports.postLogin = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle : 'Login',
            path : '/login',
            message : errors.array()[0].msg,
            oldInput : {
                name : req.body.name,
                email : req.body.email,
                password : req.body.password
            }
        });
    }


    User.findOne({email : email})
        .then((user) => {
            if(!user) {
                req.flash('NoUser', 'You are not registered. Register yourself first');
                return res.redirect('/signup');
            } else {
                bcrypt.compare(password, user.password)
                    .then(matched => {
                        if(matched) {
                            if(email == process.env.OWNER_MAIL) {
                                req.session.isAdmin = true;
                            }
                            req.session.user = user;
                            req.session.isLoggedIn = true;
                            res.redirect('/');
                        } else {
                            req.flash('error', 'Invalid username or password');
                            res.cookie("oldInput", {
                                name : req.body.name,
                                email : email,
                                password : password
                            }, {httpOnly : true});
                            res.redirect('/login');
                        }
                    })
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.postLogout = (req, res, next) => {
    req.session.destroy();
    res.redirect('/');
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('NoUser');
    message = (message.length > 0) ? message[0] : null;

    res.render('auth/signup', {
        pageTitle : 'Signup',
        path : '/signup',
        message : message,
        oldInput : null
    })
};

exports.postSignup = (req, res, next) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle : 'SignUp',
            path : '/signup',
            message : errors.array()[0].msg,
            oldInput : {
                name : req.body.name,
                email : req.body.email,
                password : req.body.password
            }
        });
    }

    User.findOne({email : email})
        .then(user => {
            if (!user) {
                name = encodeURI(name);
                email = encodeURI(email);
                const otp = email_content.otp;

                bcrypt.hash(password, 12)
                    .then(hashedPassword => {
                        password = hashedPassword;
                        req.session.password = password;
                        req.session.otp = otp;
                        res.redirect('/verify?name='+name+'&email='+email);
                        return sgemail.send({
                            to : email,
                            from : {
                                name : 'Downtown Books',
                                email : process.env.OWNER_MAIL
                            },
                            subject : 'OTP Generated',
                            html : email_content.otp_content
                        });
                    })
                    .catch(err => {console.log(err)});
                
            } else {
                req.flash('error', 'You are alredy registered. Just login with your credentials');
                return res.redirect('/login');
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getVerify = (req, res, next) => {

    const name = decodeURI(req.query.name);
    const email = decodeURI(req.query.email);
    const password = decodeURI(req.query.password);

    res.render('auth/verify', {
        pageTitle : 'OTP Verification',
        name : name,
        email : email,
        password : password
    });
};

exports.postVerify = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.session.password;
    const userOtp = +req.body.userOtp;
    const otp = +req.session.otp;
    req.session.password = undefined;
    req.session.otp = undefined;
    if(otp!=userOtp) {
        req.flash('NoUser', 'Incorrect Otp. Please register again');
        return res.redirect('signup');
    } else {
        const newUser = new User({
            name : name,
            email : email,
            password : password,
            cart : {items : []}
        });
        return newUser.save()
            .then(() => {
                req.flash('error', 'Now login with your credentials');                        
                res.redirect('/login');
                return sgemail.send({
                    to : email,
                    from : {
                        name : 'Downtown Books',
                        email : process.env.OWNER_MAIL
                    },
                    subject : 'Welcome to Downtown Books',
                    html : email_content.welcome
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    message = (message.length > 0) ? message[0] : null;
    res.render('auth/reset', {
        pageTitle : 'Reset Password',
        path : 'reset',
        message : message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            req.flash('error', 'Some unknown error occured');
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email : req.body.email})
            .then(user => {
                if(!user) {
                    req.flash('NoUser', 'No user registered with this email. Please Sign Up');
                    return res.redirect('/signup');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 300000;
                return user.save()
                    .then(result => {
                        res.redirect('/');
                        return sgemail.send({
                            to : req.body.email,
                            from : {
                                name : 'Downtown Books',
                                email : process.env.OWNER_MAIL
                            },
                            subject : 'Reset Password',
                            html : `<pre>
                            Dear Customer,
                            
                            You have requested for resetting password of your Downtown Books account.
                            
                            Please click on this <a href="http://localhost:3000/reset/${token}">link</a> to proceed to the steps of resetting your password.
                            
                            If you have not requested for any such service, feel free to contact our customer support.
                            
                            Warm Regards,
                            The Downtown Books Team
                            
                            This is a computer generated mail, hence does not require signature.
                            </pre>`
                        });
                    })
                    .catch(err => {console.log(err)});
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
    
};

exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;
    User.findOne({resetToken : token, resetTokenExpiration : { $gt : Date.now() } })
        .then(user => {
            if(!user) {
                req.flash('error', 'Some unknown error occured or the link expired.');
                return res.redirect('/reset');
            } else {
                let message = req.flash('error');
                message = (message.length > 0) ? message[0] : null;
                res.render('auth/new-password', {
                    pageTitle : 'Update Password',
                    path : '/update-password',
                    message : message,
                    userId : user._id.toString()
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const password = req.body.password;
    const confirm_password = req.body.password;
    const userId = req.body.userId;
    if(password!=confirm_password) {
        req.flash('error', 'Passwords did not match. Please try again');
        return res.redirect('/login');
    } else {
        bcrypt.hash(password, 12)
            .then(hashedPassword => {
                User.findById(userId)
                    .then(user => {
                        user.password = hashedPassword;
                        user.resetToken = undefined;
                        user.resetTokenExpiration = undefined;
                        return user.save()
                            .then(result => {
                                req.flash('error', 'Password has been reset');
                                sgemail.send({
                                    to : user.email,
                                    from : {
                                        name : 'Downtown Books',
                                        email : process.env.OWNER_MAIL
                                    },
                                    subject : 'Password Changed',
                                    html : email_content.resetPassword
                                })
                                res.redirect('/login');
                            })
                            .catch(err => {console.log(err)});
                    })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};
