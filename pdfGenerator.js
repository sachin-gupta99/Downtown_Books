const PDFDocument = require('pdfkit');
const fs = require('fs');


const generateInvoice = async (order, path, res) => {
    let pdfDoc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-disposition', 'attachment; filename=Invoice-' + order._id + '.pdf');
    var writeStream = pdfDoc.pipe(fs.createWriteStream(path));
    await pdfDoc.pipe(res);
    writeStream.on('finish', () => {
      fs.unlink(path, err => {
        if(err) throw err;
      });
    });
    headline(pdfDoc);    
    generateCustomerInformation(pdfDoc, order);
    generateInvoiceTable(pdfDoc, order);
    generateFooter(pdfDoc);
    pdfDoc.end();
};

function headline(pdfDoc) {
    pdfDoc
        .image("icon.png", 40, 50, {width : 40})
        .fontSize(15)
        .text('Downtown Books', 85, 60)
        .moveDown()
        .fontSize(10)
        .text('Where mind meets Knowledge', 50);
}


function generateCustomerInformation(doc, invoice) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Invoice", 50, 160);
  
    generateHr(doc, 185);
  
    const customerInformationTop = 200;
  
    doc
      .fontSize(10)
      .text("Invoice Number:", 50, customerInformationTop)
      .font("Helvetica-Bold")
      .text(invoice._id.toString(), 150, customerInformationTop)
      .font("Helvetica")
      .text("Invoice Date:", 50, customerInformationTop + 15)
      .text((new Date()).toLocaleDateString('en-US'), 150, customerInformationTop + 15)

      .text('Customer Name: ', 300, customerInformationTop)
      .font("Helvetica-Bold")
      .text(invoice.userInfo.username, 390, customerInformationTop)
      .font("Helvetica")
      .text(`Customer Email: ${invoice.userInfo.email}`, 300, customerInformationTop + 15)
      .moveDown();
  
    generateHr(doc, 252);
  }


function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
	doc.fontSize(8)
		.text(c1, 50, y)
    .fontSize(10)
		.text(c2, 170, y)
		.text(c3, 280, y, { width: 90, align: 'right' })
		.text(c4, 370, y, { width: 90, align: 'right' })
		.text(c5, 0, y, { align: 'right' });
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330;
    let totalPrice = 0;
  
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item No.",
      "Title",
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
  
    for (i = 0; i < invoice.productInfo.length; i++) {
      const item = invoice.productInfo[i];
      const position = invoiceTableTop + (i + 1) * 30;
      const amount = item.price*item.quantity;
      generateTableRow(
        doc,
        position,
        item.productId.toString(),
        item.title,
        formatCurrency(item.price),
        item.quantity,
        formatCurrency(amount)
      );
        totalPrice += amount;
      generateHr(doc, position + 20);
    }
  
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      formatCurrency(totalPrice)
    );
  
    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      formatCurrency(totalPrice)
    );
  
    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Balance Due",
      "",
      formatCurrency(0)
    );
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Thank you for shopping with us. Wish to serve you again.",
        50,
        780,
        { align: "center", width: 500 }
      );
  }

function formatCurrency(cents) {
    return "Rs. " + (cents).toFixed(2);
}

function generateHr(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

module.exports = generateInvoice;