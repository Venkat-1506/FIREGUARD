/* ==========================================
   LOGIN.JS — Login Logic (Modal + Standalone)
   ========================================== */

(function () {
    "use strict";

    var loginForm = document.getElementById("login-form");
    var usernameInput = document.getElementById("username");
    var passwordInput = document.getElementById("password");
    var usernameError = document.getElementById("username-error");
    var passwordError = document.getElementById("password-error");
    var loginErrorMsg = document.getElementById("login-error-msg");
    var loginErrorText = document.getElementById("login-error-text");
    var loginBtn = document.getElementById("login-btn");
    var passwordToggle = document.getElementById("password-toggle");

    if (!loginForm) return;

    var VALID_USERS = [
        { username: "admin", password: "admin123", name: "Safety Officer" },
        { username: "inspector", password: "inspect123", name: "Fire Inspector" },
        { username: "viewer", password: "viewer123", name: "Read Only User" }
    ];

    function validateUsername(v) {
        if (!v.trim()) return "Username is required";
        if (v.trim().length < 3) return "Username must be at least 3 characters";
        return "";
    }
    function validatePassword(v) {
        if (!v) return "Password is required";
        if (v.length < 6) return "Password must be at least 6 characters";
        return "";
    }
    function showFieldError(inputEl, errorEl, msg) {
        var group = inputEl.closest(".login-field");
        if (msg) { group.classList.add("has-error"); errorEl.textContent = msg; }
        else { group.classList.remove("has-error"); errorEl.textContent = ""; }
    }

    if (usernameInput) {
        usernameInput.addEventListener("blur", function () { showFieldError(this, usernameError, validateUsername(this.value)); });
        usernameInput.addEventListener("input", function () {
            if (this.closest(".login-field").classList.contains("has-error"))
                showFieldError(this, usernameError, validateUsername(this.value));
            hideLoginError();
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener("blur", function () { showFieldError(this, passwordError, validatePassword(this.value)); });
        passwordInput.addEventListener("input", function () {
            if (this.closest(".login-field").classList.contains("has-error"))
                showFieldError(this, passwordError, validatePassword(this.value));
            hideLoginError();
        });
    }

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", function () {
            var isPw = passwordInput.type === "password";
            passwordInput.type = isPw ? "text" : "password";
        });
    }

    function showLoginError(msg) {
        if (loginErrorMsg && loginErrorText) { loginErrorText.textContent = msg; loginErrorMsg.style.display = "flex"; }
    }
    function hideLoginError() { if (loginErrorMsg) loginErrorMsg.style.display = "none"; }

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var uErr = validateUsername(usernameInput.value);
        var pErr = validatePassword(passwordInput.value);
        showFieldError(usernameInput, usernameError, uErr);
        showFieldError(passwordInput, passwordError, pErr);
        if (uErr || pErr) return;

        var btnText = loginBtn.querySelector(".login-btn-text");
        var btnLoader = loginBtn.querySelector(".login-btn-loader");
        btnText.style.display = "none";
        btnLoader.style.display = "inline-flex";
        loginBtn.disabled = true;

        setTimeout(function () {
            var matched = VALID_USERS.find(function (u) {
                return u.username === usernameInput.value.trim().toLowerCase() && u.password === passwordInput.value;
            });
            if (matched) {
                sessionStorage.setItem("fireguard_user", JSON.stringify({
                    username: matched.username, name: matched.name, loginTime: new Date().toISOString()
                }));
                var rm = document.getElementById("remember-me");
                if (rm && rm.checked) localStorage.setItem("fireguard_remember", usernameInput.value.trim());
                else localStorage.removeItem("fireguard_remember");
                window.location.href = "dashboard.html";
            } else {
                showLoginError("Invalid username or password. Please try again.");
                btnText.style.display = "inline";
                btnLoader.style.display = "none";
                loginBtn.disabled = false;
                loginForm.style.animation = "none";
                loginForm.offsetHeight;
                loginForm.style.animation = "shake 0.4s ease";
            }
        }, 800);
    });

    var remembered = localStorage.getItem("fireguard_remember");
    if (remembered && usernameInput) { usernameInput.value = remembered; var rm = document.getElementById("remember-me"); if (rm) rm.checked = true; }

    var s = document.createElement("style");
    s.textContent = "@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}";
    document.head.appendChild(s);
})();
