function toggleMobileMenu() {
  const menu = document.getElementById("nav-actions");
  const body = document.body;

  menu.classList.toggle("open");
  body.classList.toggle("menu-open");
}

// Copia nome cliente in alto nella navbar
document.addEventListener("DOMContentLoaded", () => {
  const mainName = document.getElementById("client-name");
  const navName = document.getElementById("client-name-navbar");

  if (mainName && navName) {
    const observer = new MutationObserver(() => {
      navName.textContent = mainName.textContent;
    });

    observer.observe(mainName, { childList: true });
  }
});
