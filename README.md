# Downtown_Books
A Full Stack project developed with NodeJS and enhanced with ExpressJS on the server side. The client side view is orchestrated using pug templating engine to display dynamic web pages. MongoDB is employed as the database in this project with the help of ODM Mongoose.

# Features

  - Dynamic creation of html pages is made possible with the help of pug templating engine.
  - NoSQL database, MongoDB is employed with the help of MongoDB ODM, mongoose.
  - Login and Signup feature is added with an additional OTP verification included during the signup process. The OTP is received in the registered email of the user.
  - Invalid credentials leads to respective messages to be flashed.
  - After successful registration, the user is greeted with a welcome email as well.
  - The validation of user input is accomplished with the help of express-validator package.
  - The password entered by the user while signing up goes through 12 rounds of salting and hashing which is at par with industry standards. Thus the decryption of passwords stored in the database is next to impossible.
  - Admin can add, delete or update the products by logging in with the admin credentials.
  - Seperate page for displaying the details of every ebook is incorporated as well.
  - Pagination has been included to restrict all the products to be shown in one page.
  - The products can be added to cart which includes respective buttons to alter the quantities of the products.
  - The products can be thereafter ordered by going through a confirmation checkout page which takes the user to Stripe payments page (Currently the orders can be ordered with the dummy cards provided by Stripe)
  - After completing the payment, the user will receive a mail with their ordered e-books attached with it.
  - The user can also download the invoice of their orders by going to the orders page and clicking on the 'Download Invoice' link. This creates a pdf dynamically with the corresponding order details and is downloaded by the client browser.

# Prerequisites

  - Visual Studio
  - MongoDB Atlas Cluster
  - NodeJS v16 or above
  - Sendgrid and Stripe accounts

# Steps to run the app

  - Download Node on your system.
  - Clone this repo
  - Run 'npm install' in the terminal of the corresponding folder.
  - Signup on Sendgrid(or any other SMTP service provider) and Stripe(or any other payment processing service provider).
  - Create a 'pdfs' folder in the same directory where the ebooks will be stored.
  - Create a .env file which will contain your API keys and other sensitive informations.
  - Run 'npm start' in the terminal and go to 'http://localhost:3000' in your browser.
