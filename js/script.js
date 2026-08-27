const loader = document.getElementById("pageLoader");
const header = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");
const drawerOverlay = document.getElementById("drawerOverlay");
const backTop = document.getElementById("backTop");

window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 500);
});

function openDrawer() {
    drawer.classList.add("open");
    drawerOverlay.classList.add("show");
    drawer.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
}

function closeDrawer() {
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
}

menuToggle.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

document.querySelectorAll(".drawer-nav a, .drawer-footer a").forEach(link => {
    link.addEventListener("click", closeDrawer);
});

window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
    backTop.classList.toggle("show", window.scrollY > 600);
});

backTop.addEventListener("click", () => {
    window.scrollTo({top: 0, behavior: "smooth"});
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        }
    });
}, {threshold: 0.12});

document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach(el => observer.observe(el));
