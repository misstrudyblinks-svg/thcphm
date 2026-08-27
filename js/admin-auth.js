import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export function requireAdmin(redirect = "login.html") {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = redirect;
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.exists() ? snap.data().role : null;

      if (role !== "admin") {
        await signOut(auth);
        alert("This account is not authorized to access the church admin panel.");
        window.location.href = redirect;
        return;
      }

      document.body.classList.add("admin-ready");
      document.dispatchEvent(new CustomEvent("tcpAdminReady", { detail: user }));
    } catch (error) {
      console.error(error);
      await signOut(auth);
      alert("We could not verify your admin account.");
      window.location.href = redirect;
    }
  });
}

export async function logoutAdmin() {
  await signOut(auth);
  window.location.href = "login.html";
}
