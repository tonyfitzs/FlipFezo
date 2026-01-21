import Fastify from "fastify";
import { QueueServiceClient } from "@azure/storage-queue"; // Updated import

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const connStr = mustGetEnv("AZURE_STORAGE_CONNECTION_STRING");
const queueName = mustGetEnv("AZURE_QUEUE_NAME");

// Create the QueueServiceClient and then get the specific queue client
const queueService = QueueServiceClient.fromConnectionString(connStr);
const queueClient = queueService.getQueueClient(queueName);

const fastify = Fastify({ logger: true });

// Store email configuration in memory (in production, use a database)
let emailConfig = null;

// Add CORS headers
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return reply.code(200).send();
  }
});

fastify.get("/health", async () => ({ ok: true }));

// Store email configuration
fastify.post("/email-config", async (req, reply) => {
  const config = req.body ?? {};
  
  // Validate required fields
  if (!config.host || !config.port || !config.username || !config.password) {
    return reply.code(400).send({
      error: "Missing required SMTP configuration fields (host, port, username, password)"
    });
  }
  
  emailConfig = {
    host: config.host,
    port: parseInt(config.port),
    username: config.username,
    password: config.password,
    from: config.from || config.username,
    fromName: config.fromName || "FlipFeso"
  };
  
  console.log("Email configuration updated");
  console.log(`SMTP Host: ${emailConfig.host}:${emailConfig.port}`);
  console.log(`From: ${emailConfig.fromName} <${emailConfig.from}>`);
  
  return { saved: true, message: "Email configuration saved successfully" };
});

// Get email configuration (for verification, without password)
fastify.get("/email-config", async (req, reply) => {
  if (!emailConfig) {
    return reply.code(404).send({ error: "No email configuration found" });
  }
  
  // Return config without password
  return {
    host: emailConfig.host,
    port: emailConfig.port,
    username: emailConfig.username,
    from: emailConfig.from,
    fromName: emailConfig.fromName,
    configured: true
  };
});

fastify.post("/jobs", async (req, reply) => {
  const { applicationId, blobName } = req.body ?? {};

  if (!applicationId || !blobName) {
    return reply.code(400).send({
      error: "Missing applicationId or blobName",
      example: {
        applicationId: "test-123",
        blobName: "applications/test-123/uploads/yourfile.pdf"
      }
    });
  }

  // Ensure queue exists (safe if already exists)
  await queueClient.createIfNotExists();

  const payload = {
    applicationId,
    blobName,
    enqueuedAt: new Date().toISOString()
  };

  const messageText = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  await queueClient.sendMessage(messageText);

  return { enqueued: true, payload };
});

fastify.post("/send-email", async (req, reply) => {
  const { to, clientId } = req.body ?? {};

  if (!to || !clientId) {
    return reply.code(400).send({
      error: "Missing to email or clientId"
    });
  }

  if (!emailConfig) {
    return reply.code(400).send({
      error: "Email configuration not set. Please configure SMTP settings in admin panel."
    });
  }

  // Create email HTML with buttons
  const emailHtml = createEmailTemplate(clientId);
  const subject = `Thank you for your application. Your client number is ${clientId}`;
  
  console.log(`Email would be sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`HTML Content Length: ${emailHtml.length} characters`);
  console.log(`SMTP Config: ${emailConfig.host}:${emailConfig.port}`);
  console.log(`From: ${emailConfig.fromName} <${emailConfig.from}>`);

  // TODO: Actually send email using SMTP
  // You'll need to install nodemailer: npm install nodemailer
  // Example:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({
  //   host: emailConfig.host,
  //   port: emailConfig.port,
  //   secure: emailConfig.port === 465,
  //   auth: {
  //     user: emailConfig.username,
  //     pass: emailConfig.password
  //   }
  // });
  // await transporter.sendMail({
  //   from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
  //   to: to,
  //   subject: subject,
  //   html: emailHtml
  // });

  return { sent: true, to, clientId, message: "Email prepared (check logs for actual sending)" };
});

fastify.post("/send-test-email", async (req, reply) => {
  const { pageContent, to, subject, message, config } = req.body ?? {};

  const testEmail = to || "tonyfitzs@gmail.com";
  const emailSubject = subject || "Test Email - FlipFeso Page Content";
  
  // Use provided config or stored config
  const smtpConfig = config || emailConfig;
  
  // Create email with page content
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #0f0f0f;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          padding: 40px 30px;
          border-radius: 12px;
        }
        .page-content {
          margin-top: 20px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${message || 'Test Email - Page Content'}</h2>
        <p>This is a test email containing the page content:</p>
        <div class="page-content">${pageContent || 'No content provided'}</div>
      </div>
    </body>
    </html>
  `;
  
  // Log email details
  console.log(`Test email would be sent to: ${testEmail}`);
  console.log(`Subject: ${emailSubject}`);
  console.log(`HTML Content Length: ${emailHtml.length} characters`);
  
  if (smtpConfig) {
    console.log(`SMTP Config: ${smtpConfig.host}:${smtpConfig.port}`);
    console.log(`From: ${smtpConfig.fromName || 'FlipFeso'} <${smtpConfig.from || smtpConfig.username}>`);
    
    // TODO: Actually send email using SMTP
    // You'll need to install nodemailer: npm install nodemailer
    // Example:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: smtpConfig.host,
    //   port: smtpConfig.port,
    //   secure: smtpConfig.port === 465,
    //   auth: {
    //     user: smtpConfig.username,
    //     pass: smtpConfig.password
    //   }
    // });
    // await transporter.sendMail({
    //   from: `"${smtpConfig.fromName}" <${smtpConfig.from}>`,
    //   to: testEmail,
    //   subject: emailSubject,
    //   html: emailHtml
    // });
  } else {
    console.log("No SMTP configuration found. Email not sent.");
    return reply.code(400).send({
      error: "No SMTP configuration found. Please configure email settings in admin panel."
    });
  }

  return { sent: true, to: testEmail, message: "Test email prepared (check logs for actual sending)" };
});

function createEmailTemplate(clientId) {
  const features = [
    { name: "CRM System", url: "#" },
    { name: "Project Management", url: "#" },
    { name: "Inventory Control", url: "#" },
    { name: "Accounting System", url: "#" },
    { name: "Reno Cost Calculator", url: "#" },
    { name: "Property Valuation", url: "#" }
  ];

  const buttonsHtml = features.map(feature => `
    <a href="${feature.url}" style="
      display: inline-block;
      width: 100%;
      max-width: 300px;
      margin: 12px auto;
      padding: 12px 32px;
      background-color: #003366;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      font-size: 1rem;
      font-weight: 600;
    ">${feature.name}</a>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #0f0f0f;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          padding: 40px 30px;
          border-radius: 12px;
        }
        .button-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Thank you for your application!</p>
        <p>Your client number is <strong>${clientId}</strong>.</p>
        <p>If you're interested in checking out what FLIP IQ can do for you, click on each of the buttons below and we will show you a quick demo:</p>
        <div class="button-container">
          ${buttonsHtml}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Conduct feasibility analysis
fastify.post("/conduct-feasibility", async (req, reply) => {
  const data = req.body ?? {};
  
  console.log("Conducting feasibility analysis with data:", JSON.stringify(data, null, 2));
  
  // TODO: Implement actual AI analysis using the collected data
  // This should analyze:
  // - Application form data
  // - Feasibility form calculations
  // - Contract of sale information
  // - Comparable sold properties
  // - Market data from PropTrack/RP Data
  
  // For now, return a mock response
  // In production, this would call an AI service (e.g., OpenAI, Azure OpenAI)
  // to analyze all the data and generate a comprehensive report
  
  // Mock analysis - determine status based on some basic criteria
  let status = "green";
  let summary = "";
  let content = "";
  
  // Example logic (replace with actual AI analysis)
  if (data.feasibility && data.feasibility.profit) {
    const profit = parseFloat(data.feasibility.profit.replace(/[^0-9.-]/g, "")) || 0;
    if (profit < 0) {
      status = "red";
      summary = "Project shows negative profit margin.";
      content = `
        <h3>Risk Assessment: High Risk</h3>
        <p>The feasibility analysis indicates that this project is <strong>outside our risk tolerance</strong>.</p>
        <ul>
          <li><strong>Profit Margin:</strong> Negative profit detected</li>
          <li><strong>Recommendation:</strong> This project does not meet our lending criteria at this time.</li>
        </ul>
        <p>Please review your cost estimates and consider alternative approaches before resubmitting.</p>
      `;
    } else if (profit < 50000) {
      status = "orange";
      summary = "Project shows low profit margin. Further discussion required.";
      content = `
        <h3>Risk Assessment: Medium Risk</h3>
        <p>This project requires <strong>further discussion</strong> before approval.</p>
        <ul>
          <li><strong>Profit Margin:</strong> Below optimal threshold</li>
          <li><strong>Concerns:</strong> Low profit margin may not adequately cover risks</li>
          <li><strong>Recommendation:</strong> Schedule a meeting to discuss project details and potential adjustments</li>
        </ul>
        <p>We would like to discuss the following areas:</p>
        <ul>
          <li>Cost optimization opportunities</li>
          <li>Market conditions and timing</li>
          <li>Risk mitigation strategies</li>
        </ul>
      `;
    } else {
      status = "green";
      summary = "Project meets our criteria. Go ahead!";
      content = `
        <h3>Risk Assessment: Low Risk</h3>
        <p>Congratulations! This project is <strong>approved</strong> and ready to proceed.</p>
        <ul>
          <li><strong>Profit Margin:</strong> Within acceptable range</li>
          <li><strong>Risk Level:</strong> Low</li>
          <li><strong>Recommendation:</strong> Proceed with confidence</li>
        </ul>
        <p>Next steps:</p>
        <ul>
          <li>Review and sign the partnership agreement</li>
          <li>Coordinate with our team for project initiation</li>
          <li>Set up project management and tracking</li>
        </ul>
      `;
    }
  } else {
    // Default to orange if no profit data available
    status = "orange";
    summary = "Incomplete data. Further information required.";
    content = `
      <h3>Risk Assessment: Pending</h3>
      <p>We need <strong>additional information</strong> to complete the feasibility analysis.</p>
      <ul>
        <li>Please ensure all form fields are completed</li>
        <li>Upload required documents (contract of sale, comparables)</li>
        <li>Complete the feasibility calculations</li>
      </ul>
      <p>Once all information is provided, we can generate a complete risk assessment.</p>
    `;
  }
  
  return {
    status,
    summary,
    content,
    analyzedAt: new Date().toISOString(),
    dataReceived: {
      hasApplication: !!data.application && Object.keys(data.application).length > 0,
      hasFeasibility: !!data.feasibility && Object.keys(data.feasibility).length > 0,
      hasContract: !!data.contractOfSale,
      comparablesCount: data.comparables?.length || 0
    }
  };
});

fastify.listen({ host: "0.0.0.0", port: 8090 });
