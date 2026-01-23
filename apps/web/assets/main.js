const form = document.querySelector(".contact-form");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
  });
}

const feasibilityButtons = document.querySelectorAll(
  "[data-feasibility-choice]"
);
const uploadPanel = document.querySelector("[data-upload-panel]");
const feasibilityActions = document.querySelector("[data-feasibility-actions]");
const uploadTrigger = document.querySelector("[data-upload-trigger]");
const uploadInput = document.querySelector("[data-upload-input]");
const uploadDrop = document.querySelector("[data-upload-drop]");
const uploadSummary = document.querySelector("[data-upload-summary]");
const uploadCount = document.querySelector("[data-upload-count]");
const uploadList = document.querySelector("[data-upload-list]");
const uploadMoreButtons = document.querySelectorAll("[data-upload-more]");
const uploadClientId = document.querySelector("[data-upload-client-id]");
const extensionButtons = document.querySelectorAll("[data-extension-choice]");
const extensionActions = document.querySelector("[data-extension-actions]");
const extensionInput = document.querySelector("[data-extension-input]");
const mainView = document.querySelector("[data-main-view]");
const thankYouView = document.querySelector("[data-thank-you]");
const thankYouTitle = document.querySelector("[data-thank-you-title]");
const clientIdText = document.querySelector("[data-client-id]");
const clientNameInput = document.querySelector("[data-client-name]");
const clientEmailInput = document.querySelector("[data-client-email]");
const loanAmountInput = document.querySelector("[data-loan-amount]");
const termMonthsInput = document.querySelector("[data-term-months]");
const extensionMonthsInput = document.querySelector("[data-extension-months]");
const interestRateInput = document.querySelector("[data-interest-rate]");
const thankYouEmail = document.querySelector("[data-thank-you-email]");
const loanSummary = document.querySelector("[data-loan-summary]");
const confettiRoot = document.querySelector("[data-confetti]");
const phoneInputs = document.querySelectorAll("[data-phone-input]");
const phoneMessages = {
  client: document.querySelector('[data-phone-message="client"]'),
  solicitor: document.querySelector('[data-phone-message="solicitor"]'),
};

const uploadedFiles = [];
let hasSubmitted = false;
let clientId = null;

const generateClientId = () => {
  let id = "";
  for (let i = 0; i < 10; i += 1) {
    id += Math.floor(Math.random() * 10).toString();
  }
  return id;
};

const generateRecordId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const ensureClientId = () => {
  if (clientId) {
    return clientId;
  }

  try {
    const storedId = localStorage.getItem("flipfesoClientId");
    if (storedId) {
      clientId = storedId;
      return clientId;
    }
  } catch (error) {
    console.error("Unable to read client id", error);
  }

  clientId = generateClientId();

  try {
    localStorage.setItem("flipfesoClientId", clientId);
  } catch (error) {
    console.error("Unable to save client id", error);
  }

  return clientId;
};

const getFirstName = () => {
  if (!clientNameInput || !clientNameInput.value.trim()) {
    return "there";
  }
  const first = clientNameInput.value.trim().split(/\s+/)[0];
  return first || "there";
};

const getEmail = () => {
  if (!clientEmailInput || !clientEmailInput.value.trim()) {
    return "";
  }
  return clientEmailInput.value.trim();
};

const parseAmount = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const multiplier = trimmed.endsWith("k") ? 1000 : 1;
  const numeric = trimmed.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(numeric);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed * multiplier;
};

const parseMonths = (value) => {
  const parsed = parseAmount(value);
  if (!parsed) {
    return null;
  }
  return Math.max(0, Math.round(parsed));
};

const parseRate = (value) => {
  const parsed = parseAmount(value);
  if (!parsed) {
    return null;
  }
  return parsed / 100;
};

const formatCurrency = (value) => {
  if (value === null || Number.isNaN(value)) {
    return "";
  }
  return `$${Math.round(value).toLocaleString("en-AU")}`;
};

const buildLoanSummary = () => {
  if (!loanSummary) {
    return;
  }

  const amount = parseAmount(loanAmountInput?.value);
  const termMonths = parseMonths(termMonthsInput?.value);
  const rate = parseRate(interestRateInput?.value);
  const extensionMonths = parseMonths(extensionMonthsInput?.value);
  const legalCosts = 1500;

  if (!amount || !termMonths || !rate) {
    loanSummary.textContent = "";
    return;
  }

  const baseInterest = amount * rate * (termMonths / 12);
  const extensionInterest = extensionMonths
    ? amount * rate * (extensionMonths / 12)
    : 0;
  const totalInterest = baseInterest + extensionInterest;

  const extensionCopy = extensionMonths
    ? ` You have indicated a potential extension of ${extensionMonths} months, ` +
      `which would take the total up to ${formatCurrency(totalInterest)} plus ` +
      `legal costs of ${formatCurrency(legalCosts)}.`
    : "";

  loanSummary.textContent =
    `You have requested a loan of ${formatCurrency(amount)} for a period of ` +
    `${termMonths} months, which works out to a total of ` +
    `${formatCurrency(baseInterest)} at ${(rate * 100).toFixed(2)}%.` +
    extensionCopy +
    " If we proceed Fitzsimmons Properties Pty Pty as trustee for the " +
    "Fitzsimmons Investment Group is a named party on the title, and is " +
    "entitled to recover all outstanding amounts prior to other interested " +
    "parties with the exception of tier 1 banks.";
};

const launchConfetti = () => {
  if (!confettiRoot) {
    return;
  }

  confettiRoot.innerHTML = "";
  const colors = ["#ff5f6d", "#ffc371", "#7afcff", "#9b5de5", "#43aa8b"];
  const total = 80;

  for (let i = 0; i < total; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--size", `${6 + Math.random() * 6}px`);
    piece.style.setProperty("--color", colors[i % colors.length]);
    piece.style.setProperty(
      "--drift",
      `${(Math.random() * 120 - 60).toFixed(1)}px`
    );
    piece.style.setProperty(
      "--duration",
      `${(1.6 + Math.random() * 1.4).toFixed(2)}s`
    );
    piece.style.setProperty("--delay", `${(Math.random() * 0.4).toFixed(2)}s`);
    confettiRoot.appendChild(piece);
  }
};

const saveSubmission = (record) => {
  try {
    const existing = JSON.parse(localStorage.getItem("flipfesoSubmissions"));
    const submissions = Array.isArray(existing) ? existing : [];
    submissions.push(record);
    localStorage.setItem("flipfesoSubmissions", JSON.stringify(submissions));
  } catch (error) {
    console.error("Unable to save submission", error);
  }
};

const sendEmail = async (email, clientId) => {
  if (!email) {
    return;
  }

  try {
    // Get API URL - try to detect from current location or use default
    let apiUrl = window.location.origin;
    // If we're on a specific port, try to use port 8090 for the API
    if (window.location.port) {
      apiUrl = `${window.location.protocol}//${window.location.hostname}:8090`;
    } else {
      // For production, you might have a separate API domain
      apiUrl = window.location.origin;
    }

    const response = await fetch(`${apiUrl}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        clientId: clientId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't block the UI if email fails
  }
};

const showThankYou = () => {
  if (hasSubmitted) {
    return;
  }

  const assignedClientId = ensureClientId();
  const firstName = getFirstName();
  const email = getEmail();

  const submissionData = {
    clientId: assignedClientId,
    firstName,
    documents: [...uploadedFiles],
    submittedAt: new Date().toISOString(),
  };

  saveSubmission(submissionData);

  // Send email if email address is provided
  if (email) {
    sendEmail(email, assignedClientId);
  }

  if (thankYouTitle) {
    thankYouTitle.textContent = `Thank you ${firstName}`;
  }
  if (clientIdText) {
    clientIdText.textContent = `Your client id is ${assignedClientId}.`;
  }
  buildLoanSummary();
  if (thankYouEmail) {
    if (email) {
      thankYouEmail.textContent =
        `We've sent a confirmation email to ${email} with your client number and more information about FLIP IQ.`;
    } else {
      thankYouEmail.textContent =
        "We'll email you with the next steps.";
    }
  }

  if (mainView) {
    mainView.classList.add("is-hidden");
  }
  if (thankYouView) {
    thankYouView.classList.remove("is-hidden");
  }

  launchConfetti();
  hasSubmitted = true;
};

const updateUploadSummary = () => {
  if (!uploadSummary || !uploadCount || !uploadList) {
    return;
  }

  const total = uploadedFiles.length;
  if (total === 0) {
    uploadSummary.classList.add("is-hidden");
    uploadList.innerHTML = "";
    uploadCount.textContent = "You have uploaded 0 documents.";
    if (uploadClientId) {
      uploadClientId.classList.add("is-hidden");
      uploadClientId.textContent = "";
    }
    return;
  }

  uploadSummary.classList.remove("is-hidden");
  uploadCount.textContent = `You have uploaded ${total} document${
    total === 1 ? "" : "s"
  }.`;
  uploadList.innerHTML = uploadedFiles
    .map((fileName) => `<li>${fileName}</li>`)
    .join("");

  if (uploadClientId) {
    const assignedClientId = ensureClientId();
    uploadClientId.textContent = `Your client id is ${assignedClientId}.`;
    uploadClientId.classList.remove("is-hidden");
  }
};

const addFiles = (fileList) => {
  if (!fileList) {
    return;
  }

  const assignedClientId = ensureClientId();
  Array.from(fileList).forEach((file) => {
    if (!uploadedFiles.includes(file.name)) {
      uploadedFiles.push(file.name);
      saveSubmission({
        recordId: generateRecordId(),
        clientId: assignedClientId,
        fileName: file.name,
        fileType: file.type || "unknown",
        fileSize: file.size,
        addedAt: new Date().toISOString(),
      });
    }
  });

  updateUploadSummary();
};

const normalizeAuPhone = (value) => {
  let raw = value.trim();
  if (!raw) return { ok: true, value: "" };

  const hasPlus = raw.startsWith("+");
  raw = raw.replace(/[^\d+]/g, "");

  if (raw.startsWith("+")) {
    if (!raw.startsWith("+61")) {
      return { ok: false, reason: "foreign" };
    }
    raw = raw.replace("+61", "");
    if (raw.startsWith("0")) {
      raw = raw.slice(1);
    }
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return { ok: true, value: "" };

  const localMobile = digits.startsWith("04") && digits.length === 10;
  const localLandline =
    digits.length === 10 && ["02", "03", "07", "08"].includes(digits.slice(0, 2));
  const intlMobile = digits.startsWith("4") && digits.length === 9;
  const intlLandline =
    digits.length === 9 && ["2", "3", "7", "8"].includes(digits[0]);

  if (!localMobile && !localLandline && !intlMobile && !intlLandline) {
    return { ok: false, reason: "invalid" };
  }

  if (hasPlus) {
    return { ok: true, value: digits };
  }

  if (intlMobile) {
    return { ok: true, value: `0${digits}` };
  }

  if (intlLandline) {
    return { ok: true, value: `0${digits}` };
  }

  return { ok: true, value: digits };
};

const showPhoneMessage = (key, message) => {
  const target = phoneMessages[key];
  if (target) {
    target.textContent = message || "";
  }
};

const handlePhoneValidation = (event) => {
  const input = event.target;
  const key = input.dataset.phoneInput;
  const result = normalizeAuPhone(input.value);

  if (!result.ok) {
    if (result.reason === "foreign") {
      showPhoneMessage(
        key,
        "This service is currently only available in Australia. " +
          "Please email info@Flipfeso.com.au."
      );
    } else {
      showPhoneMessage(
        key,
        "Enter a valid Australian mobile or landline number."
      );
    }
    return;
  }

  if (result.value) {
    input.value = result.value;
  }
  showPhoneMessage(key, "");
};

const setFeasibilityChoice = (choice) => {
  if (!uploadPanel) {
    return;
  }

  feasibilityButtons.forEach((button) => {
    if (button.dataset.feasibilityChoice === choice) {
      button.classList.add("is-selected");
    } else {
      button.classList.remove("is-selected");
    }
  });

  if (choice === "yes") {
    uploadPanel.classList.remove("is-hidden");
    if (feasibilityActions) {
      feasibilityActions.classList.add("is-hidden");
    }
  } else {
    // User chose "No" - navigate to the customized feasibility form page
    window.location.href = "./feasibility.html";
  }
};

const setExtensionChoice = (choice) => {
  if (!extensionActions || !extensionInput) {
    return;
  }

  extensionButtons.forEach((button) => {
    if (button.dataset.extensionChoice === choice) {
      button.classList.add("is-selected");
    } else {
      button.classList.remove("is-selected");
    }
  });

  if (choice === "yes") {
    extensionActions.classList.add("is-hidden");
    extensionInput.classList.remove("is-hidden");
  } else {
    extensionInput.classList.add("is-hidden");
    extensionActions.classList.remove("is-hidden");
  }
};

if (feasibilityButtons.length && uploadPanel) {
  feasibilityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFeasibilityChoice(button.dataset.feasibilityChoice);
    });
  });
}

if (extensionButtons.length && extensionActions && extensionInput) {
  extensionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setExtensionChoice(button.dataset.extensionChoice);
    });
  });
}

// Use event delegation for upload functionality - works even when elements are dynamically shown/hidden
document.addEventListener("click", (e) => {
  if (e.target && e.target.hasAttribute("data-upload-trigger")) {
    e.preventDefault();
    e.stopPropagation();
    const uploadInput = document.querySelector("[data-upload-input]");
    if (uploadInput) {
      uploadInput.click();
    }
  }
});

document.addEventListener("change", (e) => {
  if (e.target && e.target.hasAttribute("data-upload-input")) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  }
});

// Handle drag and drop for upload area using event delegation
let dragEnterCount = 0;

document.addEventListener("dragenter", (e) => {
  const uploadDrop = e.target.closest("[data-upload-drop]");
  if (uploadDrop) {
    e.preventDefault();
    dragEnterCount++;
    uploadDrop.classList.add("is-dragging");
  }
});

document.addEventListener("dragover", (e) => {
  if (e.target.closest("[data-upload-drop]")) {
    e.preventDefault();
  }
});

document.addEventListener("dragleave", (e) => {
  const uploadDrop = e.target.closest("[data-upload-drop]");
  if (uploadDrop) {
    dragEnterCount--;
    if (dragEnterCount === 0) {
      uploadDrop.classList.remove("is-dragging");
    }
  }
});

document.addEventListener("drop", (e) => {
  const uploadDrop = e.target.closest("[data-upload-drop]");
  if (uploadDrop) {
    e.preventDefault();
    dragEnterCount = 0;
    uploadDrop.classList.remove("is-dragging");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }
});

if (uploadMoreButtons.length) {
  uploadMoreButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.uploadMore === "yes") {
        ensureClientId();
        return;
      }

      if (uploadPanel) {
        uploadPanel.classList.add("is-hidden");
      }
      if (feasibilityActions) {
        feasibilityActions.classList.remove("is-hidden");
      }

      showThankYou();
    });
  });
}


if (phoneInputs.length) {
  phoneInputs.forEach((input) => {
    input.addEventListener("blur", handlePhoneValidation);
    input.addEventListener("change", handlePhoneValidation);
  });
}

// Test email button functionality
const testEmailButton = document.getElementById("test-email-button");
if (testEmailButton) {
  testEmailButton.addEventListener("click", async () => {
    const button = testEmailButton;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending...";

    try {
      // Get the page content (form data and text content)
      const pageContent = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        formData: {}
      };

      // Collect all form inputs
      const form = document.querySelector(".application-form");
      if (form) {
        const inputs = form.querySelectorAll("input, textarea");
        inputs.forEach(input => {
          if (input.type !== "file") {
            pageContent.formData[input.placeholder || input.name || 'field'] = input.value;
          }
        });
      }

      // Add visible page text
      pageContent.visibleText = document.body.innerText || document.body.textContent;

      // Try different API URL patterns
      const apiUrls = [
        `${window.location.protocol}//${window.location.hostname}:8090`,
        `${window.location.origin}/api`,
        `${window.location.origin}`,
        'http://localhost:8090'
      ];

      let lastError = null;
      let success = false;
      let workingApiUrl = null;

      // First, try to find a working API server by checking health endpoint
      for (const apiUrl of apiUrls) {
        try {
          console.log(`Checking API health at: ${apiUrl}`);
          const healthResponse = await fetch(`${apiUrl}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (healthResponse.ok) {
            console.log(`✓ API server is accessible at: ${apiUrl}`);
            workingApiUrl = apiUrl;
            break;
          }
        } catch (err) {
          console.log(`✗ API not accessible at: ${apiUrl} - ${err.message}`);
          // Continue to next URL
        }
      }

      // If we found a working API, use it; otherwise try all URLs
      if (workingApiUrl) {
        apiUrls.unshift(workingApiUrl);
      }

      // Now try to send the email
      for (const apiUrl of apiUrls) {
        try {
          console.log(`Trying to send email via API URL: ${apiUrl}`);
          const response = await fetch(`${apiUrl}/send-test-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pageContent: JSON.stringify(pageContent, null, 2)
            }),
          });

          if (response.ok) {
            const result = await response.json();
            alert(`Test email sent to tonyfitzs@gmail.com!\n\nStatus: ${result.message || 'Success'}\nAPI URL: ${apiUrl}`);
            success = true;
            break;
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            console.error(`Failed with ${apiUrl}:`, lastError);
          }
        } catch (err) {
          lastError = err.message;
          console.error(`Error with ${apiUrl}:`, err);
          // Continue to next URL
        }
      }

      if (!success) {
        alert(`Failed to send test email.\n\nTried multiple API URLs but none worked.\n\nLast error: ${lastError}\n\nPlease ensure:\n1. The API server is running (npm start in apps/api)\n2. The server is accessible on port 8090\n3. Check the browser console for detailed errors`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert(`Error sending test email: ${error.message}\n\nPlease check the browser console (F12) for more details.`);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

// Setup (admin-only): email, notifications, environment. Not customer-facing.
const ADMIN_PASSWORD = "admin123"; // Change this to a secure password
const ADMIN_STORAGE_KEY = "flipfesoAdminAuthenticated";
const EMAIL_CONFIG_STORAGE_KEY = "flipfesoEmailConfig";

const adminGearButton = document.getElementById("admin-gear-button");
const adminModal = document.getElementById("admin-modal");
const adminModalClose = document.getElementById("admin-modal-close");
const adminLoginSection = document.getElementById("admin-login");
const adminConfigSection = document.getElementById("admin-config");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginButton = document.getElementById("admin-login-button");
const adminLoginError = document.getElementById("admin-login-error");
const emailConfigForm = document.getElementById("email-config-form");
const adminConfigSuccess = document.getElementById("admin-config-success");
const adminConfigError = document.getElementById("admin-config-error");
const adminTestEmailButton = document.getElementById("admin-test-email");

const SETUP_MODE_KEY = "flipfesoSetupMode";

/**
 * Setup (gear) is admin-only, not customer-facing.
 * Visible only when ?setup=1 is in the URL. Do not expose ?setup=1 to customers in production.
 */
function initSetupVisibility() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "1" || params.get("admin") === "1") {
      sessionStorage.setItem(SETUP_MODE_KEY, "true");
      const url = new URL(window.location.href);
      url.searchParams.delete("setup");
      url.searchParams.delete("admin");
      const clean = url.pathname + (url.search || "") + (url.hash || "");
      window.history.replaceState({}, "", clean);
    }
    const inSetupMode = sessionStorage.getItem(SETUP_MODE_KEY) === "true";
    if (adminGearButton) {
      if (inSetupMode) adminGearButton.classList.add("visible");
      else adminGearButton.classList.remove("visible");
    }
  } catch (e) {
    if (adminGearButton) adminGearButton.classList.remove("visible");
  }
}

initSetupVisibility();

// Check if admin is already authenticated
const isAdminAuthenticated = () => {
  try {
    const auth = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    return auth === "true";
  } catch {
    return false;
  }
};

// Load email configuration
const loadEmailConfig = () => {
  try {
    const config = localStorage.getItem(EMAIL_CONFIG_STORAGE_KEY);
    if (config) {
      return JSON.parse(config);
    }
  } catch (error) {
    console.error("Error loading email config:", error);
  }
  return null;
};

// Save email configuration
const saveEmailConfig = (config) => {
  try {
    localStorage.setItem(EMAIL_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("Error saving email config:", error);
    return false;
  }
};

// Show admin modal
const showAdminModal = () => {
  if (adminModal) {
    adminModal.classList.remove("is-hidden");
    if (isAdminAuthenticated()) {
      showAdminConfig();
    } else {
      showAdminLogin();
    }
  }
};

// Hide admin modal
const hideAdminModal = () => {
  if (adminModal) {
    adminModal.classList.add("is-hidden");
  }
};

// Show admin login
const showAdminLogin = () => {
  if (adminLoginSection) adminLoginSection.classList.remove("is-hidden");
  if (adminConfigSection) adminConfigSection.classList.add("is-hidden");
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginError) adminLoginError.textContent = "";
};

// Show admin config
const showAdminConfig = () => {
  if (adminLoginSection) adminLoginSection.classList.add("is-hidden");
  if (adminConfigSection) adminConfigSection.classList.remove("is-hidden");
  
  // Load existing config
  const config = loadEmailConfig();
  if (config) {
    const hostInput = document.getElementById("smtp-host");
    const portInput = document.getElementById("smtp-port");
    const usernameInput = document.getElementById("smtp-username");
    const passwordInput = document.getElementById("smtp-password");
    const fromInput = document.getElementById("smtp-from");
    const fromNameInput = document.getElementById("smtp-from-name");
    
    if (hostInput) hostInput.value = config.host || "";
    if (portInput) portInput.value = config.port || "";
    if (usernameInput) usernameInput.value = config.username || "";
    if (passwordInput) passwordInput.value = config.password || "";
    if (fromInput) fromInput.value = config.from || "";
    if (fromNameInput) fromNameInput.value = config.fromName || "";
  }
  
  if (adminConfigSuccess) adminConfigSuccess.textContent = "";
  if (adminConfigError) adminConfigError.textContent = "";
};

// Handle admin login
if (adminLoginButton && adminPasswordInput) {
  adminLoginButton.addEventListener("click", () => {
    const password = adminPasswordInput.value;
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, "true");
        showAdminConfig();
      } catch (error) {
        if (adminLoginError) {
          adminLoginError.textContent = "Error: Could not save authentication";
        }
      }
    } else {
      if (adminLoginError) {
        adminLoginError.textContent = "Incorrect password";
      }
    }
  });
  
  // Allow Enter key to submit
  adminPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      adminLoginButton.click();
    }
  });
}

// Handle admin config form submission
if (emailConfigForm) {
  emailConfigForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const config = {
      host: document.getElementById("smtp-host")?.value || "",
      port: parseInt(document.getElementById("smtp-port")?.value || "587"),
      username: document.getElementById("smtp-username")?.value || "",
      password: document.getElementById("smtp-password")?.value || "",
      from: document.getElementById("smtp-from")?.value || "",
      fromName: document.getElementById("smtp-from-name")?.value || "FlipFeso"
    };
    
    if (saveEmailConfig(config)) {
      if (adminConfigSuccess) {
        adminConfigSuccess.textContent = "Configuration saved successfully!";
      }
      if (adminConfigError) adminConfigError.textContent = "";
      
      // Also send to API
      sendConfigToAPI(config);
    } else {
      if (adminConfigError) {
        adminConfigError.textContent = "Failed to save configuration";
      }
    }
  });
}

// Send configuration to API
const sendConfigToAPI = async (config) => {
  try {
    // Try multiple API URLs
    const apiUrls = [
      `${window.location.protocol}//${window.location.hostname}:8090`,
      `${window.location.origin}/api`,
      `${window.location.origin}`,
      'http://localhost:8090'
    ];
    
    let success = false;
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(`${apiUrl}/email-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
        
        if (response.ok) {
          console.log(`✓ Configuration sent to API at: ${apiUrl}`);
          success = true;
          break;
        }
      } catch (err) {
        // Continue to next URL
        console.log(`✗ Failed to send config to ${apiUrl}:`, err.message);
      }
    }
    
    if (!success) {
      console.warn('⚠ Could not send config to API server. Configuration saved locally only.');
      if (adminConfigSuccess) {
        adminConfigSuccess.textContent = "Configuration saved locally (API server not accessible)";
      }
    }
  } catch (error) {
    console.error('Error sending config to API:', error);
  }
};

// Handle test email
if (adminTestEmailButton) {
  adminTestEmailButton.addEventListener("click", async () => {
    const config = loadEmailConfig();
    if (!config || !config.host || !config.username) {
      if (adminConfigError) {
        adminConfigError.textContent = "Please configure SMTP settings first";
      }
      return;
    }
    
    adminTestEmailButton.disabled = true;
    adminTestEmailButton.textContent = "Sending...";
    if (adminConfigError) adminConfigError.textContent = "";
    if (adminConfigSuccess) adminConfigSuccess.textContent = "";
    
    try {
      // Try multiple API URLs
      const apiUrls = [
        `${window.location.protocol}//${window.location.hostname}:8090`,
        `${window.location.origin}/api`,
        `${window.location.origin}`,
        'http://localhost:8090'
      ];
      
      let success = false;
      let lastError = null;
      
      for (const apiUrl of apiUrls) {
        try {
          console.log(`Trying to send test email via: ${apiUrl}`);
          const response = await fetch(`${apiUrl}/send-test-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: "tonyfitzs@gmail.com",
              subject: "Test Email from FlipFeso Admin",
              message: "This is a test email to verify your SMTP configuration is working correctly.",
              config: config
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (adminConfigSuccess) {
              adminConfigSuccess.textContent = `Test email prepared successfully! Check server logs for actual sending.`;
            }
            if (adminConfigError) adminConfigError.textContent = "";
            success = true;
            break;
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            console.error(`Failed with ${apiUrl}:`, lastError);
          }
        } catch (err) {
          lastError = err.message;
          console.error(`Error with ${apiUrl}:`, err);
          // Continue to next URL
        }
      }
      
      if (!success) {
        if (adminConfigError) {
          adminConfigError.textContent = `API server not accessible. Please ensure the API server is running on port 8090. Error: ${lastError}`;
        }
      }
    } catch (error) {
      if (adminConfigError) {
        adminConfigError.textContent = `Unexpected error: ${error.message}. Check browser console for details.`;
      }
    } finally {
      adminTestEmailButton.disabled = false;
      adminTestEmailButton.textContent = "Test Email";
    }
  });
}

// Handle gear button click
if (adminGearButton) {
  adminGearButton.addEventListener("click", showAdminModal);
}

// Handle modal close
if (adminModalClose) {
  adminModalClose.addEventListener("click", hideAdminModal);
}

// Close modal when clicking overlay
if (adminModal) {
  const overlay = adminModal.querySelector(".admin-modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", hideAdminModal);
  }
}

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && adminModal && !adminModal.classList.contains("is-hidden")) {
    hideAdminModal();
  }
});

// Feasibility Calculator
const feasibilityForm = document.getElementById("feasibility-form");
const feasibilityResults = document.getElementById("feasibility-results");
const totalExpensesElement = document.getElementById("total-expenses");
const totalIncomeElement = document.getElementById("total-income");
const profitElement = document.getElementById("profit");

// Helper function to parse currency values
const parseCurrency = (value) => {
  if (!value || value.trim() === "") return 0;
  // Remove $, commas, and spaces, then parse as float
  const cleaned = value.toString().replace(/[$,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Calculate renovation breakdown totals
const calculateRenovationTotals = () => {
  const renoItemInputs = document.querySelectorAll('[data-reno-item]');
  let subtotal = 0;
  
  renoItemInputs.forEach((input) => {
    const value = parseCurrency(input.value);
    subtotal += value;
  });

  const contingency = subtotal * 0.1; // 10% contingency
  const total = subtotal + contingency;

  // Update renovation breakdown totals
  const renoSubtotalInput = document.getElementById("reno-subtotal");
  const renoContingencyInput = document.getElementById("reno-contingency");
  const renoTotalInput = document.getElementById("reno-total");
  const renovationsInput = document.getElementById("renovations");

  if (renoSubtotalInput) {
    renoSubtotalInput.value = formatCurrency(subtotal);
  }
  if (renoContingencyInput) {
    renoContingencyInput.value = formatCurrency(contingency);
  }
  if (renoTotalInput) {
    renoTotalInput.value = formatCurrency(total);
  }
  // Auto-populate the "Renovations & Minor Building Works" field in main form
  if (renovationsInput) {
    renovationsInput.value = formatCurrency(total);
  }

  return { subtotal, contingency, total };
};

// Calculate feasibility
const calculateFeasibility = () => {
  // First calculate renovation totals (this will auto-populate the renovations field)
  calculateRenovationTotals();

  // Get all expense inputs
  const expenseInputs = document.querySelectorAll('[data-expense]');
  let totalExpenses = 0;
  
  expenseInputs.forEach((input) => {
    const value = parseCurrency(input.value);
    totalExpenses += value;
  });

  // Get all income inputs
  const incomeInputs = document.querySelectorAll('[data-income]');
  let totalIncome = 0;
  
  incomeInputs.forEach((input) => {
    const value = parseCurrency(input.value);
    totalIncome += value;
  });

  // Calculate profit
  const profit = totalIncome - totalExpenses;

  // Update display
  if (totalExpensesElement) {
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
  }
  if (totalIncomeElement) {
    totalIncomeElement.textContent = formatCurrency(totalIncome);
  }
  if (profitElement) {
    profitElement.textContent = formatCurrency(profit);
    profitElement.style.color = profit >= 0 ? "#28a745" : "#dc3545";
  }
  
  // Show results section if we have calculations
  if (feasibilityResults) {
    feasibilityResults.style.display = "block";
  }

  return { totalExpenses, totalIncome, profit };
};

// Handle form submission
if (feasibilityForm) {
  feasibilityForm.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateFeasibility();
  });

  // Also calculate on input changes for real-time updates
  const allInputs = feasibilityForm.querySelectorAll('input[type="text"]:not([readonly])');
  allInputs.forEach((input) => {
    input.addEventListener("input", () => {
      calculateFeasibility();
    });
    input.addEventListener("blur", () => {
      calculateFeasibility();
    });
  });

  // Initial calculation on page load if any values are present
  setTimeout(() => {
    calculateFeasibility();
  }, 100);
}

// Contract of Sale Upload Functionality
const contractUploadTrigger = document.getElementById("contract-upload-trigger");
const contractUploadInput = document.getElementById("contract-upload-input");
const contractUploadDrop = document.getElementById("contract-upload-drop");
const contractUploadSummary = document.getElementById("contract-upload-summary");
const contractUploadCount = document.getElementById("contract-upload-count");
const contractUploadList = document.getElementById("contract-upload-list");

let contractUploadedFile = null;

const updateContractUploadSummary = () => {
  if (!contractUploadSummary || !contractUploadCount || !contractUploadList) {
    return;
  }

  if (!contractUploadedFile) {
    contractUploadSummary.classList.add("is-hidden");
    contractUploadList.innerHTML = "";
    contractUploadCount.textContent = "No file uploaded.";
    return;
  }

  contractUploadSummary.classList.remove("is-hidden");
  contractUploadCount.textContent = `Contract of Sale uploaded:`;
  contractUploadList.innerHTML = `<li>✓ ${contractUploadedFile.name}</li>`;
};

const handleContractFile = (file) => {
  if (file && (file.type === "application/pdf" || file.type.includes("word") || file.name.match(/\.(pdf|doc|docx)$/i))) {
    contractUploadedFile = file;
    updateContractUploadSummary();
  } else {
    alert("Please upload a PDF or Word document (.pdf, .doc, .docx)");
  }
};

if (contractUploadTrigger && contractUploadInput) {
  contractUploadTrigger.addEventListener("click", () => {
    contractUploadInput.click();
  });
}

if (contractUploadInput) {
  contractUploadInput.addEventListener("change", (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleContractFile(event.target.files[0]);
    }
    event.target.value = "";
  });
}

if (contractUploadDrop) {
  contractUploadDrop.addEventListener("dragenter", (event) => {
    event.preventDefault();
    contractUploadDrop.classList.add("is-dragging");
  });

  contractUploadDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  contractUploadDrop.addEventListener("dragleave", () => {
    contractUploadDrop.classList.remove("is-dragging");
  });

  contractUploadDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    contractUploadDrop.classList.remove("is-dragging");
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleContractFile(event.dataTransfer.files[0]);
    }
  });
}

// Comparable Sold Upload Functionality
let comparableUploadedFiles = [];

const initComparableUpload = () => {
  const comparableUploadTrigger = document.getElementById("comparable-upload-trigger");
  const comparableUploadInput = document.getElementById("comparable-upload-input");
  const comparableUploadDrop = document.getElementById("comparable-upload-drop");
  const comparableUploadSummary = document.getElementById("comparable-upload-summary");
  const comparableUploadCount = document.getElementById("comparable-upload-count");
  const comparableUploadList = document.getElementById("comparable-upload-list");

  if (!comparableUploadTrigger || !comparableUploadInput || !comparableUploadDrop) {
    return; // Not on the comparable sold page
  }

  const updateComparableUploadSummary = () => {
    if (!comparableUploadSummary || !comparableUploadCount || !comparableUploadList) {
      return;
    }

    const total = comparableUploadedFiles.length;

    if (total === 0) {
      comparableUploadSummary.classList.add("is-hidden");
      comparableUploadList.innerHTML = "";
      comparableUploadCount.textContent = "No files uploaded.";
      return;
    }

    comparableUploadSummary.classList.remove("is-hidden");
    comparableUploadCount.textContent = `You have uploaded ${total} comparable sold document${total === 1 ? '' : 's'}:`;
    comparableUploadList.innerHTML = comparableUploadedFiles
      .map((file) => `<li>✓ ${file.name}</li>`)
      .join("");
  };

  const handleComparableFiles = (files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf" || file.type.includes("word") || file.name.match(/\.(pdf|doc|docx)$/i)) {
        // Check if file is already uploaded
        if (!comparableUploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
          comparableUploadedFiles.push(file);
        }
      } else {
        alert(`File "${file.name}" is not a valid document. Please upload PDF or Word documents (.pdf, .doc, .docx)`);
      }
    });

    updateComparableUploadSummary();
  };

  comparableUploadTrigger.addEventListener("click", () => {
    comparableUploadInput.click();
  });

  comparableUploadInput.addEventListener("change", (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleComparableFiles(event.target.files);
    }
    event.target.value = "";
  });

  comparableUploadDrop.addEventListener("dragenter", (event) => {
    event.preventDefault();
    comparableUploadDrop.classList.add("is-dragging");
  });

  comparableUploadDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  comparableUploadDrop.addEventListener("dragleave", () => {
    comparableUploadDrop.classList.remove("is-dragging");
  });

  comparableUploadDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    comparableUploadDrop.classList.remove("is-dragging");
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleComparableFiles(event.dataTransfer.files);
    }
  });
};

// Initialize comparable upload when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComparableUpload);
} else {
  initComparableUpload();
}

// Conduct Feasibility Functionality
const conductFeasibilityButton = document.getElementById("conduct-feasibility-button");
const feasibilityReport = document.getElementById("feasibility-report");
const feasibilityLoading = document.getElementById("feasibility-loading");
const statusIndicator = document.getElementById("status-indicator");
const statusText = document.getElementById("feasibility-status-text");
const reportContent = document.getElementById("feasibility-report-content");

const collectAllFormData = () => {
  const data = {
    application: {},
    feasibility: {},
    contractOfSale: null,
    comparables: []
  };

  // Collect application form data from localStorage or sessionStorage
  const applicationData = sessionStorage.getItem("applicationData");
  if (applicationData) {
    try {
      data.application = JSON.parse(applicationData);
    } catch (e) {
      console.error("Error parsing application data:", e);
    }
  }

  // Collect feasibility form data
  const feasibilityForm = document.getElementById("feasibility-form");
  if (feasibilityForm) {
    const formData = new FormData(feasibilityForm);
    for (const [key, value] of formData.entries()) {
      data.feasibility[key] = value;
    }
  }

  // Collect contract of sale file info
  if (contractUploadedFile) {
    data.contractOfSale = {
      name: contractUploadedFile.name,
      size: contractUploadedFile.size,
      type: contractUploadedFile.type
    };
  }

  // Collect comparable files info
  if (comparableUploadedFiles && comparableUploadedFiles.length > 0) {
    data.comparables = comparableUploadedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
  }

  return data;
};

const setFeasibilityStatus = (status) => {
  // Remove all status classes
  statusIndicator.classList.remove("status-green", "status-orange", "status-red");
  feasibilityReport.classList.remove("status-green-bg", "status-orange-bg", "status-red-bg");

  if (status === "green") {
    statusIndicator.classList.add("status-green");
    feasibilityReport.classList.add("status-green-bg");
    statusText.textContent = "Go Ahead - Project Approved";
  } else if (status === "orange") {
    statusIndicator.classList.add("status-orange");
    feasibilityReport.classList.add("status-orange-bg");
    statusText.textContent = "Further Discussion Required";
  } else if (status === "red") {
    statusIndicator.classList.add("status-red");
    feasibilityReport.classList.add("status-red-bg");
    statusText.textContent = "Outside Risk Tolerance";
  }
};

const displayFeasibilityReport = (report) => {
  if (!report) return;

  setFeasibilityStatus(report.status || "orange");
  
  // Format and display report content
  if (report.content) {
    reportContent.innerHTML = report.content;
  } else if (report.summary) {
    reportContent.innerHTML = `<p>${report.summary}</p>`;
  } else {
    reportContent.innerHTML = "<p>Feasibility analysis complete. Please review the details above.</p>";
  }

  feasibilityLoading.classList.add("is-hidden");
  feasibilityReport.classList.remove("is-hidden");
};

const conductFeasibility = async () => {
  if (!conductFeasibilityButton || !feasibilityReport || !feasibilityLoading) {
    return;
  }

  // Show loading state
  conductFeasibilityButton.disabled = true;
  conductFeasibilityButton.textContent = "Generating Report...";
  feasibilityReport.classList.add("is-hidden");
  feasibilityLoading.classList.remove("is-hidden");

  // Collect all form data
  const allData = collectAllFormData();

  // Find API URL
  const apiUrls = [
    `${window.location.protocol}//${window.location.hostname}:8090`,
    `${window.location.origin}/api`,
    window.location.origin,
    `http://localhost:8090`
  ];

  let apiUrl = null;
  for (const url of apiUrls) {
    try {
      const response = await fetch(`${url}/health`, { method: "GET" });
      if (response.ok) {
        apiUrl = url;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!apiUrl) {
    alert("Unable to connect to the server. Please ensure the API server is running on port 8090.");
    conductFeasibilityButton.disabled = false;
    conductFeasibilityButton.textContent = "Continue to Feasibility";
    feasibilityLoading.classList.add("is-hidden");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/conduct-feasibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(allData),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    displayFeasibilityReport(result);
  } catch (error) {
    console.error("Error conducting feasibility:", error);
    alert(`Error generating feasibility report: ${error.message}. Please try again later.`);
    feasibilityLoading.classList.add("is-hidden");
  } finally {
    conductFeasibilityButton.disabled = false;
    conductFeasibilityButton.textContent = "Continue to Feasibility";
  }
};

if (conductFeasibilityButton) {
  conductFeasibilityButton.addEventListener("click", conductFeasibility);
}

// Principle Workers CV Management
const principleWorkersCount = document.getElementById("principle-workers-count");
const cvContainer = document.getElementById("cv-container");

// Predefined CV files for the first few workers
const defaultCvFiles = [
  "./Felicity Walker Reno CV.pdf",
  "./Reno Flip IM-compressed.pdf",
  "./CV-Placeholder-3.pdf",
  "./CV-Placeholder-4.pdf"
];

const defaultCvNames = [
  "Felicity Walker",
  "[Party 2 Name]",
  "[Party 3 Name]",
  "[Party 4 Name]"
];

const generateCvFields = (count) => {
  if (!cvContainer) return;
  
  const numWorkers = parseInt(count) || 1;
  cvContainer.innerHTML = "";
  
  for (let i = 0; i < numWorkers; i++) {
    const cvDiv = document.createElement("div");
    const cvFile = defaultCvFiles[i] || `./CV-Placeholder-${i + 1}.pdf`;
    const cvName = defaultCvNames[i] || `[Party ${i + 1} Name]`;
    const workerNumber = i + 1;
    
    cvDiv.innerHTML = `
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 16px;">
          Principal Worker ${workerNumber}: ${cvName}
        </h2>
        <div class="upload-panel">
          <div class="upload-drop" id="cv-upload-drop-${i}">
            <p style="font-weight: 600; margin-bottom: 8px;">Drag and drop CV document here</p>
            <span>or</span>
            <button
              type="button"
              class="ghost-button"
              id="cv-upload-trigger-${i}"
            >
              Browse Files
            </button>
            <input
              type="file"
              class="upload-input"
              id="cv-upload-input-${i}"
              accept=".pdf,.doc,.docx"
            />
          </div>
          <div class="upload-summary is-hidden" id="cv-upload-summary-${i}">
            <p id="cv-upload-count-${i}" style="font-weight: 600;">
              No file uploaded.
            </p>
            <ul class="upload-list" id="cv-upload-list-${i}"></ul>
          </div>
        </div>
      </div>
    `;
    
    cvContainer.appendChild(cvDiv);
    
    // Set up event listeners for this upload box
    setupCvUpload(i);
  }
};

const setupCvUpload = (index) => {
  // Use setTimeout to ensure DOM is updated
  setTimeout(() => {
    const uploadTrigger = document.getElementById(`cv-upload-trigger-${index}`);
    const uploadInput = document.getElementById(`cv-upload-input-${index}`);
    const uploadDrop = document.getElementById(`cv-upload-drop-${index}`);
    const uploadSummary = document.getElementById(`cv-upload-summary-${index}`);
    const uploadCount = document.getElementById(`cv-upload-count-${index}`);
    const uploadList = document.getElementById(`cv-upload-list-${index}`);
    
    if (!uploadTrigger || !uploadInput || !uploadDrop) {
      console.warn(`CV upload elements not found for index ${index}`);
      return;
    }
    
    let uploadedFile = null;
    
    const updateCvUploadSummary = () => {
      if (!uploadSummary || !uploadCount || !uploadList) {
        return;
      }
      
      if (!uploadedFile) {
        uploadSummary.classList.add("is-hidden");
        uploadList.innerHTML = "";
        uploadCount.textContent = "No file uploaded.";
        return;
      }
      
      uploadSummary.classList.remove("is-hidden");
      uploadCount.textContent = `CV uploaded:`;
      uploadList.innerHTML = `<li>✓ ${uploadedFile.name}</li>`;
    };
    
    const handleCvFile = (file) => {
      if (file && (file.type === "application/pdf" || file.type.includes("word") || file.name.match(/\.(pdf|doc|docx)$/i))) {
        uploadedFile = file;
        updateCvUploadSummary();
      } else {
        alert("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      }
    };
    
    uploadTrigger.addEventListener("click", () => {
      uploadInput.click();
    });
    
    uploadInput.addEventListener("change", (event) => {
      if (event.target.files && event.target.files.length > 0) {
        handleCvFile(event.target.files[0]);
      }
      event.target.value = "";
    });
    
    uploadDrop.addEventListener("dragenter", (event) => {
      event.preventDefault();
      uploadDrop.classList.add("is-dragging");
    });
    
    uploadDrop.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    
    uploadDrop.addEventListener("dragleave", () => {
      uploadDrop.classList.remove("is-dragging");
    });
    
    uploadDrop.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadDrop.classList.remove("is-dragging");
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleCvFile(event.dataTransfer.files[0]);
      }
    });
  }, 10);
};

// Initialize CV fields when DOM is ready
const initCvFields = () => {
  const principleWorkersCount = document.getElementById("principle-workers-count");
  const cvContainer = document.getElementById("cv-container");
  
  if (!principleWorkersCount || !cvContainer) {
    return; // Not on the introduction page
  }
  
  // Initialize with 1 worker by default
  generateCvFields(principleWorkersCount.value);
  
  principleWorkersCount.addEventListener("input", (event) => {
    const count = event.target.value;
    if (count >= 1 && count <= 10) {
      generateCvFields(count);
    }
  });
  
  principleWorkersCount.addEventListener("change", (event) => {
    const count = event.target.value;
    if (count < 1) {
      event.target.value = 1;
      generateCvFields(1);
    } else if (count > 10) {
      event.target.value = 10;
      generateCvFields(10);
    }
  });
};

// Initialize CV fields when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCvFields);
} else {
  initCvFields();
}

// Video Modal functionality with crossfade
const videoModal = document.getElementById("video-modal");
const videoTriggerCard = document.getElementById("video-trigger-card");
const videoModalClose = document.getElementById("video-modal-close");
const videoIframe = document.getElementById("video-iframe");
const videoModalOverlay = videoModal?.querySelector(".video-modal-overlay");

// InVideo video URL
// IMPORTANT: InVideo share links may not work directly in iframes due to security restrictions.
// You may need to:
// 1. Get the embed code from InVideo platform (look for "Embed" or "Share" options)
// 2. Or use the watch URL format if available
// 3. Or host the video on YouTube/Vimeo and use their embed URL instead

const VIDEO_SHARE_URL = "https://ai.invideo.io/workspace/023e8390-9abc-44b9-802a-06f8de640734/v40-copilot/01eeff14-a38c-4e33-a258-369bc37ea39b";

// Try different embed formats
const VIDEO_ID = "01eeff14-a38c-4e33-a258-369bc37ea39b";
// Format 1: Watch URL with embed
const VIDEO_EMBED_URL = `https://ai.invideo.io/watch/${VIDEO_ID}?embed=true&autoplay=1&mute=0`;
// Format 2: Alternative embed format (if Format 1 doesn't work)
const VIDEO_EMBED_ALT = VIDEO_SHARE_URL.replace('/workspace/', '/embed/');

let isVideoModalOpen = false;
let videoEndCheckInterval = null;

function showVideoModal() {
  if (!videoModal || !videoIframe) return;
  
  // Fade out the page content
  document.body.style.transition = "opacity 0.6s ease-in-out";
  document.body.style.opacity = "0";
  
  // Show modal and start crossfade in
  videoModal.classList.remove("is-hidden");
  
  // Trigger crossfade animation
  requestAnimationFrame(() => {
    videoModal.classList.add("showing");
    // Load video after a brief delay to ensure smooth transition
    setTimeout(() => {
      // Try embed URL first
      videoIframe.src = VIDEO_EMBED_URL;
      
      // Fallback: If embed URL doesn't work, try alternative formats
      // Note: Due to cross-origin restrictions, iframe errors may not fire
      // You may need to manually test and update the URL format
      // or get the embed code directly from InVideo platform
      
      document.body.style.overflow = "hidden";
      isVideoModalOpen = true;
      
      // Start checking for video end
      startVideoEndCheck();
    }, 100);
  });
}

function hideVideoModal() {
  if (!videoModal || !videoIframe) return;
  
  // Stop checking for video end
  stopVideoEndCheck();
  
  // Crossfade out
  videoModal.classList.remove("showing");
  
  // Clear video and fade back to page
  setTimeout(() => {
    videoIframe.src = "";
    videoModal.classList.add("is-hidden");
    document.body.style.overflow = "";
    document.body.style.opacity = "1";
    isVideoModalOpen = false;
  }, 800); // Match CSS transition duration
}

function startVideoEndCheck() {
  // Listen for postMessage events from InVideo iframe
  window.addEventListener('message', handleVideoMessage);
  
  // Fallback: If InVideo doesn't send postMessage events, 
  // you may need to manually close or get the video duration from InVideo API
  // For now, we'll rely on postMessage or manual close
}

function stopVideoEndCheck() {
  if (videoEndCheckInterval) {
    clearInterval(videoEndCheckInterval);
    videoEndCheckInterval = null;
  }
  window.removeEventListener('message', handleVideoMessage);
}

function handleVideoMessage(event) {
  // Listen for video end events from InVideo iframe
  // InVideo may send different event formats - adjust as needed
  if (event.origin.includes('invideo.io') || event.origin.includes('ai.invideo.io')) {
    const data = event.data;
    
    // Check for various video end event formats
    if (
      (typeof data === 'object' && (
        data.type === 'video-ended' || 
        data.event === 'ended' || 
        data.eventType === 'ended' ||
        data.action === 'videoEnded'
      )) ||
      (typeof data === 'string' && data.includes('ended'))
    ) {
      hideVideoModal();
    }
  }
}

// Open video modal on card click
if (videoTriggerCard) {
  videoTriggerCard.addEventListener("click", (e) => {
    e.preventDefault();
    showVideoModal();
  });
}

// Close video modal
if (videoModalClose) {
  videoModalClose.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideVideoModal();
  });
}

// Close on overlay click
if (videoModalOverlay) {
  videoModalOverlay.addEventListener("click", (e) => {
    if (e.target === videoModalOverlay) {
      hideVideoModal();
    }
  });
}

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isVideoModalOpen) {
    hideVideoModal();
  }
});
