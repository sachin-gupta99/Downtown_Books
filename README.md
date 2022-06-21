# Downtown_Books
A Full Stack project created with Node js on the server side and HTML(created via Pug templating engine), CSS and JS on the client Side, using MongoDB as database.

  - Dynamic creation of html pages is made possible with the help of pug templating engine.
  - Login and Signup feature is added with an additional OTP verification included during the signup process.Invalid credentials leads to corresponding messages to be flashed.
  - Admin can add, delete or update the products by login with the admin credentials.
  - Pagination has been included to restrict all the products to be shown in one page.
  - The products can be added to cart which includes - and + buttons to alter the quantities of the products.
  - The products can be thereafter ordered by going through a confirmation checkout page which takes the user to Stripe payments page (Currently the orders can be ordered with the dummy cards provided by Stripe)
  - After completing the payment, the user will receive a mail with their ordered items attached with it.
  - The user can also download the invoice of their orders by going to the orders page and clicking on the 'Download Invoice' link. This creates a pdf dynamically with the corresponding order details and is downloaded by the client browser.

# Prerequisites

  - Visual Studio 2022
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
  - Run 'npm start' in the terminal and go to 'localhost:3000' in your browser.
