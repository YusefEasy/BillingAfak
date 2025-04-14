document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Check localStorage to apply the correct theme
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  } else {
    darkModeToggle.textContent = "🌙";
  }

  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      darkModeToggle.textContent = "☀️";
      localStorage.setItem("darkMode", "enabled");
    } else {
      darkModeToggle.textContent = "🌙";
      localStorage.setItem("darkMode", "disabled");
    }
  });

  // Handle form submission
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username && password) {
      const userCredentials = { username, password };

      fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userCredentials),
      })
        .then((response) => {
          if (response.ok) {
            // Store login status in session storage
            sessionStorage.setItem("loggedIn", "true");
            window.location.href = "/"; // Redirect to the home page
          } else {
            response.json().then((data) => {
              document.getElementById("errorMessage").style.display = "block";
              document.getElementById("errorMessage").innerText = data.message;
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {
      document.getElementById("errorMessage").style.display = "block";
      document.getElementById("errorMessage").innerText = "Please enter both username and password.";
    }
  });

  // Logout Button Logic
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      // Clear session and redirect to login page
      sessionStorage.removeItem("loggedIn");
      window.location.href = "/login";
    });
  }
});
