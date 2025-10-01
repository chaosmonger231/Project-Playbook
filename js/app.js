document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const formError = document.getElementById("formError");
  
    const centerBox = document.querySelector(".center-box");
    const overlay = document.getElementById("loaderOverlay");
    const loaderText = overlay.querySelector(".loader-text");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();                 // stop page reload
      formError.textContent = "";         // clear old error
  
      // show loader overlay (always)
      centerBox.style.visibility = "hidden";  // keeps layout from shifting
      overlay.classList.add("show");
      loaderText.textContent = "Logging in...";
  
      // Simulate processing delay
      setTimeout(() => {
        const uOk = username.value.trim().length > 0;
        const pOk = password.value.trim().length > 0;
  
        if (uOk && pOk) {
          loaderText.textContent = "✅ Login Successful!";
          // Optional redirect:
            setTimeout(() => window.location.href = "Learning_Page.html", 800);
        } else {
          overlay.classList.remove("show");
          centerBox.style.visibility = "visible";
          formError.textContent = "Please enter both username and password.";
        }
      }, 1500);
    });
  });
  