import { db } from "./firebase-config.js";
import { imageFileToBase64 } from "./image-helper.js";
import {
  addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, where, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function showNotice(id, message, type = "success") {
  const notice = $(id);
  if (!notice) return;
  notice.textContent = message;
  notice.className = `notice ${type}`;
}

async function loadPublicSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "church"));
    if (!snap.exists()) return;
    const data = snap.data();

    const mappings = {
      publicPhone: data.phone,
      publicEmail: data.email,
      publicAddress: data.address,
      publicChurchName: data.churchName,
      publicWelcome: data.welcome
    };
    Object.entries(mappings).forEach(([id, value]) => {
      if (value && $(id)) $(id).textContent = value;
    });

    if (data.sunday && $("serviceSunday")) $("serviceSunday").textContent = data.sunday;
    if (data.wednesday && $("serviceWednesday")) $("serviceWednesday").textContent = data.wednesday;
    if (data.friday && $("serviceFriday")) $("serviceFriday").textContent = data.friday;

    const social = { publicFacebook: data.facebook, publicInstagram: data.instagram, publicYoutube: data.youtube };
    Object.entries(social).forEach(([id, url]) => {
      if (url && $(id)) $(id).href = url;
    });

    const giving = {
      givingTitle: data.givingTitle || "Give With Purpose",
      mobileMoney: data.mobileMoney || "Giving details coming soon.",
      bankName: data.bankName || "",
      accountName: data.accountName || "",
      accountNumber: data.accountNumber || "",
      givingNote: data.givingNote || "Thank you for supporting the work of The Call Prayer Ministry."
    };
    if ($("givingTitle")) $("givingTitle").textContent = giving.givingTitle;
    if ($("givingMobileMoney")) $("givingMobileMoney").textContent = giving.mobileMoney;
    if ($("givingBankName")) $("givingBankName").textContent = giving.bankName;
    if ($("givingAccountName")) $("givingAccountName").textContent = giving.accountName;
    if ($("givingAccountNumber")) $("givingAccountNumber").textContent = giving.accountNumber;
    if ($("givingNote")) $("givingNote").textContent = giving.givingNote;
  } catch (error) {
    console.warn("Public settings could not be loaded:", error);
  }
}

async function loadAnnouncements() {
  const section = $("publicAnnouncements");
  const list = $("announcementList");
  if (!section || !list) return;

  try {
    const snap = await getDocs(query(collection(db, "announcements"), where("published", "==", true), limit(10)));
    const docs = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
    if (!docs.length) return;

    list.innerHTML = docs.map((x) => `
      <article class="announcement-card">
        ${x.image ? `<img class="announcement-image" src="${escapeHtml(x.image)}" alt="${escapeHtml(x.title || "Announcement")}" loading="lazy">` : ""}
        <div class="announcement-content">
          <span class="eyebrow">ANNOUNCEMENT</span>
          <h3>${escapeHtml(x.title || "Announcement")}</h3>
          <p>${escapeHtml(x.message || "")}</p>
        </div>
      </article>`).join("");
    section.hidden = false;
  } catch (error) {
    console.warn("Announcements could not be loaded:", error);
  }
}

async function loadPrograms() {
  const grid = $("publicEventGrid");
  if (!grid) return;

  try {
    // Query the exact published field used by the admin form. This also avoids
    // composite-index requirements. We normalize legacy isPublished records below.
    const snap = await getDocs(query(collection(db, "programs"), where("published", "==", true), limit(30)));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const docs = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
      .filter(x => {
        if (!x.date) return true;
        const d = new Date(`${x.date}T00:00:00`);
        return !Number.isNaN(d.getTime()) && d >= today;
      })
      .sort((a, b) => (a.date || "9999-12-31").localeCompare(b.date || "9999-12-31"))
      .slice(0, 6);

    if (!docs.length) {
      grid.innerHTML = `<div class="public-empty">No upcoming events have been published yet.</div>`;
      return;
    }

    grid.innerHTML = docs.map((x) => {
      const date = x.date ? new Date(`${x.date}T00:00:00`) : null;
      const month = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase() : "";
      const day = date && !Number.isNaN(date.getTime()) ? date.getDate() : "";
      return `<article class="event-card reveal visible">
        <div class="event-image dynamic-event-image">
          ${x.image ? `<img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.title || "Church event")}" loading="lazy">` : `<div class="event-date-fallback"><span>${escapeHtml(month)}</span><strong>${escapeHtml(day)}</strong></div>`}
        </div>
        <div class="event-body">
          <p>${escapeHtml(x.venue || "Church Program")}</p>
          <h3>${escapeHtml(x.title || "Untitled Event")}</h3>
          <small>${escapeHtml(formatDate(x.date))}${x.time ? ` · ${escapeHtml(x.time)}` : ""}</small>
          ${x.description ? `<div class="dynamic-description">${escapeHtml(x.description)}</div>` : ""}
        </div>
      </article>`;
    }).join("");
  } catch (error) {
    console.warn("Programs could not be loaded:", error);
    grid.innerHTML = `<div class="public-empty">We could not load the events right now. Please refresh the page.</div>`;
  }
}

async function loadSermons() {
  const grid = $("publicSermonGrid");
  const fallback = $("staticSermonFeature");
  if (!grid) return;

  try {
    const snap = await getDocs(query(collection(db, "sermons"), where("published", "==", true), limit(10)));
    if (snap.empty) return;
    if (fallback) fallback.hidden = true;
    const docs = snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 3);
    grid.innerHTML = docs.map((x) => `<article class="public-sermon-card">
      <div class="public-sermon-image" ${x.image ? `style="background-image:url('${escapeHtml(x.image)}')"` : ""}><span>▶</span></div>
      <div class="public-sermon-body"><span class="eyebrow">SERMON</span><h3>${escapeHtml(x.title || "Untitled Sermon")}</h3>
      <p>${escapeHtml(x.speaker || "The Call Prayer Ministry")} ${x.date ? `· ${escapeHtml(formatDate(x.date))}` : ""}</p>
      ${x.description ? `<div class="dynamic-description">${escapeHtml(x.description)}</div>` : ""}
      ${x.mediaUrl ? `<a class="text-link" href="${escapeHtml(x.mediaUrl)}" target="_blank" rel="noopener">Watch / Listen →</a>` : ""}</div>
    </article>`).join("");
    grid.hidden = false;
  } catch (error) { console.warn("Sermons could not be loaded:", error); }
}

async function loadGallery() {
  const section = $("publicGallery"); const grid = $("publicGalleryGrid");
  if (!section || !grid) return;
  try {
    const snap = await getDocs(query(collection(db, "gallery"), where("published", "==", true), limit(12)));
    const docs = snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 8);
    if (!docs.length) return;
    grid.innerHTML = docs.map((x) => `<figure class="public-gallery-item"><img src="${escapeHtml(x.image || "")}" alt="${escapeHtml(x.title || x.caption || "Church gallery image")}" loading="lazy">${x.caption ? `<figcaption>${escapeHtml(x.caption)}</figcaption>` : ""}</figure>`).join("");
    section.hidden = false;
  } catch (error) { console.warn("Gallery could not be loaded:", error); }
}

async function loadTestimonies() {
  const section = $("publicTestimonies"); const grid = $("publicTestimonyGrid");
  if (!section || !grid) return;
  try {
    const snap = await getDocs(query(collection(db, "testimonies"), where("approved", "==", true), limit(10)));
    const docs = snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
    if (!docs.length) return;
    grid.innerHTML = docs.map((x) => `<article class="testimony-card">${x.image ? `<img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.name || "Testimony")}" loading="lazy">` : ""}<div><span class="quote-mark">“</span><p>${escapeHtml(x.testimony || "")}</p><strong>${escapeHtml(x.name || "Anonymous")}</strong></div></article>`).join("");
    section.hidden = false;
  } catch (error) { console.warn("Testimonies could not be loaded:", error); }
}

const visitForm = $("visitForm");
if (visitForm) {
  visitForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("visitSubmit"); button.disabled = true; button.textContent = "Sending...";
    try {
      await addDoc(collection(db, "visitRequests"), {
        name: $("visitName").value.trim(), phone: $("visitPhone").value.trim(), email: $("visitEmail").value.trim(),
        visitDate: $("visitDate").value, people: Number($("visitPeople").value || 1), reason: $("visitReason").value,
        message: $("visitMessage").value.trim(), status: "new", createdAt: serverTimestamp()
      });
      visitForm.reset(); $("visitPeople").value = "1";
      showNotice("visitNotice", "Thank you! Your visit request has been received. We will get back to you soon.");
    } catch (error) {
      console.error("Visit request failed:", error);
      showNotice("visitNotice", "Sorry, we could not send your request. Please try again.", "error");
    } finally { button.disabled = false; button.textContent = "Send Visit Request →"; }
  });
}

const prayerForm = $("prayerForm");
if (prayerForm) {
  prayerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("prayerSubmit"); button.disabled = true; button.textContent = "Sending...";
    try {
      await addDoc(collection(db, "prayerRequests"), {
        name: $("prayerName").value.trim(), phone: $("prayerPhone").value.trim(), email: $("prayerEmail").value.trim(),
        request: $("prayerRequest").value.trim(), status: "new", createdAt: serverTimestamp()
      });
      prayerForm.reset(); showNotice("prayerNotice", "Your prayer request has been sent. Our prayer team will stand with you in prayer.");
    } catch (error) {
      console.error("Prayer request failed:", error);
      showNotice("prayerNotice", "We could not send your prayer request. Please try again.", "error");
    } finally { button.disabled = false; button.textContent = "Send Prayer Request →"; }
  });
}

const testimonyForm = $("testimonyForm");
if (testimonyForm) {
  testimonyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("testimonySubmit"); button.disabled = true; button.textContent = "Submitting...";
    try {
      let image = "";
      const file = $("testimonyImage").files[0];
      if (file) image = await imageFileToBase64(file, { maxWidth: 700, maxHeight: 700, quality: 0.7, maxBytes: 600000 });
      await addDoc(collection(db, "testimonies"), {
        name: $("testimonyName").value.trim(), testimony: $("testimonyText").value.trim(), image,
        approved: false, createdAt: serverTimestamp()
      });
      testimonyForm.reset(); showNotice("testimonyNotice", "Thank you for sharing. Your testimony has been submitted for admin approval.");
    } catch (error) {
      console.error("Testimony submission failed:", error);
      showNotice("testimonyNotice", error.message || "We could not submit your testimony. Please try again.", "error");
    } finally { button.disabled = false; button.textContent = "Submit Testimony →"; }
  });
}

loadPublicSettings(); loadAnnouncements(); loadPrograms(); loadSermons(); loadGallery(); loadTestimonies();
