// static/js/main.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Main JS loaded ✅");

    // Highlight active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });
});
