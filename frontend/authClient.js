// ---------------------------------------------------
// Register/login now go straight to Supabase Auth from the
// browser — no custom backend routes needed for this part.
// Supabase handles password hashing, sessions, everything.
// ---------------------------------------------------

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("message");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
      messageBox.textContent = error.message;
      return;
    }

    messageBox.style.color = "#d6ffd6";
    messageBox.textContent = "Account created! Redirecting to login...";
    setTimeout(() => (window.location.href = "login.html"), 1200);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      messageBox.textContent = error.message;
      return;
    }

    messageBox.style.color = "#d6ffd6";
    messageBox.textContent = "Login successful! Redirecting...";
    setTimeout(() => (window.location.href = "chat.html"), 800);
  });
}