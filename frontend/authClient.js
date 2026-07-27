
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("message");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      messageBox.textContent = "Passwords do not match";
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.textContent = data.error;
      return;
    }

    messageBox.style.color = "#d6ffd6";
    messageBox.textContent = "Account created! Redirecting to login...";
    setTimeout(() => (window.location.href = "login.html"), 1000);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.textContent = data.error;
      return;
    }

    messageBox.style.color = "#d6ffd6";
    messageBox.textContent = "Login successful! Redirecting...";
    setTimeout(() => (window.location.href = "chat.html"), 800);
  });
}
