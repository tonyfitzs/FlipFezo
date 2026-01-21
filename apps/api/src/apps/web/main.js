const form = document.querySelector(".contact-form");
const extensionButtons = document.querySelectorAll("[data-extension-choice]");
const extensionActions = document.querySelector("[data-extension-actions]");
const extensionInput = document.querySelector("[data-extension-input]");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
  });
}

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

if (extensionButtons.length && extensionActions && extensionInput) {
  extensionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setExtensionChoice(button.dataset.extensionChoice);
    });
  });
}
