const otp = parseInt(Math.random()*1000000);

const otp_content = `<pre>
Dear Sir/Madam,

Welcome to Downtown Books. Following is your OTP to verify your account.

OTP : <b>${otp}</b>

Do not share your OTP with anyone for security reasons.

Warm Regards,
The Downtown Books Team

This is a computer generated mail, hence does not require signature.
</pre>`;

const welcome = `<pre>
Dear Customer,

Congratulations on having your Downtown Books account verified. We are excited to have you onboard.

Feel free to browse through our collection and dive into the world of Pushtakalya.

Warm Regards,
The Downtown Books Team

This is a computer generated mail, hence does not require signature.
</pre>`;

const resetPassword = `<pre>
Dear Customer,

Your password has been successfully changed. Login with your new credentials to access your account again.

If you didn't issued this request, feel free to contact our customer support.

Warm Regards,
The Downtown Books Team

This is a computer generated mail, hence does not require signature.
</pre>`

const orderBought = `<p><h4>Dear Customer,</h4><br>
Thank you for shopping with us. Your delivery is complete.<br><br>

Please find attached your ordered e-books.<br><br>

Tell us about your experience with this order.<br><br>

If you didn't issue this request, feel free to contact our customer support.<br><br>

Warm Regards,<br>
The Downtown Books Team<br><br>

This is a computer generated mail, hence does not require signature.<p>`

exports.otp_content = otp_content;
exports.welcome = welcome;
exports.resetPassword = resetPassword;
exports.otp = otp;
exports.orderBought = orderBought;
