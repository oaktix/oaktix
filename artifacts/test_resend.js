const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log("Using API key:", process.env.RESEND_API_KEY);
  
  console.log("Sending email from hello@oaktix.com.ng to oaktix@gmail.com...");
  try {
    const result = await resend.emails.send({
      from: "OakTix <hello@oaktix.com.ng>",
      to: "oaktix@gmail.com",
      subject: "Test hello@oaktix.com.ng",
      html: "<p>Hello World</p>",
    });
    console.log("Result (from oaktix.com.ng):", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error (from oaktix.com.ng):", err);
  }

  console.log("Sending email from onboarding@resend.dev to oaktix@gmail.com...");
  try {
    const result = await resend.emails.send({
      from: "OakTix <onboarding@resend.dev>",
      to: "oaktix@gmail.com",
      subject: "Test onboarding@resend.dev",
      html: "<p>Hello World</p>",
    });
    console.log("Result (from onboarding.dev):", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error (from onboarding.dev):", err);
  }
}

main();
