# Mariachi de Uclatlán Website 🎶

Official web platform for **Mariachi de Uclatlán**, UCLA’s premier mariachi ensemble. Built with **React + Vite + Firebase** and designed for three audiences: the public, members/performers, and admins.

---

## 🚀 Features (current)

### Public

* **Home, About, Contact**
* **Book Us** (performance inquiry entry point)
* **Join** (interest / onboarding page)

### Authentication

* **Email & Password**
* **Google Sign‑In**
* **Phone (SMS) + reCAPTCHA**

### Members Portal (`/members/*`)

* **Members landing (Dashboard-lite)**
* **Profile** (Firestore-backed user profile)
* **Events** (list + details)
* **Calendar** (read-only calendar view)
* **Performer Availability** (Yes/No/Maybe)
* **Resources** (links to sheet music library via Box)
* **Settings**

### Role‑Based Dashboards

* **Performer Dashboard** (role = performer)
* **Admin Dashboard** (role = admin)
* Automatic selection via a **role‑based layout** wrapper; separate navbars for Member / Performer / Admin views.

### Firestore Integration

* **User registration profile** created on sign‑up
* **Events & availability** synced in real time
* **Optional custom claims** support for role detection

---

## 🧩 Tech Stack

* **Frontend:** React + TypeScript (Vite)
* **Auth:** Firebase Authentication (Email/Google/Phone)
* **DB:** Cloud Firestore (real-time)
* **Storage (optional):** Firebase Storage for avatars/media

---

## 📂 Project Structure (current)

```
src/
├─ App.tsx                     # Router & top-level nav switching
├─ firebase.ts                 # Firebase config/init
├─ components/
│  ├─ Navbar.tsx
│  ├─ Footer.tsx
│  ├─ MembersNavbar.tsx
│  └─ carousel/
├─ adminComponents/
│  ├─ adminDashboard.tsx
│  └─ adminNavbar.tsx
├─ performerComponents/
│  ├─ PerformerDashboard.tsx
│  └─ performerNavbar.tsx
├─ rolebasedlayout/
│  └─ rbl.tsx                  # Role-based layout (admin/performer/public)
├─ pages/
│  ├─ Home.tsx
│  ├─ About.tsx
│  ├─ Contact.tsx
│  ├─ Login.tsx
│  ├─ Register.tsx
│  ├─ bookUs.tsx
│  ├─ joinUs.tsx
│  ├─ MembersOnly.tsx
│  ├─ ManageMembers.tsx        # (internal management surface)
│  └─ Members/
│     ├─ Profile.tsx
│     ├─ Events.tsx
│     ├─ Resources.tsx
│     ├─ Settings.tsx
│     ├─ PerformerAvailability.tsx
│     └─ Calendar.tsx
└─ styles/                     # (if using standalone CSS files)
```

> **Note:** Routes for `/admin-dashboard`, `/performer-dashboard`, and `/members/*` are mounted in `App.tsx`. Navbars switch automatically based on the current section and auth state.

---

## ⚙️ Setup & Installation

1. **Clone & install**

```bash
git clone https://github.com/<your-org-or-user>/<repo>.git
cd <repo>
npm install
```

2. **Create Firebase project** (Console)

* Enable **Authentication** (Email/Password, Google, and Phone).
* Enable **Firestore**.
* (Optional) Enable **Storage** for avatars.

3. **Local env vars**
   Create `.env` at the repo root:

```bash
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id
```

4. **Run dev server**

```bash
npm run dev
```

App runs at **[http://localhost:5173](http://localhost:5173)**.

5. **Build & preview**

```bash
npm run build
npm run preview
```

---

## 👥 Roles & Access

* **Public** – anyone visiting the site
* **Performer** – authenticated users with performer role
* **Admin** – elevated privileges

Role detection can be handled via **Firebase custom claims** or a **roles field in Firestore**. The role‑based layout chooses which dashboard to render and which navbar to show.

---

## 🔒 Security Notes (high level)

* Authenticated users can **read & write their own profile**.
* Sensitive collections (e.g., **admin‑only**) should be restricted to **admin role**.
* Always test Firestore rules with the Firebase Emulator or Rules Playground before deploying.

---

## 🛠 Scripts

```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # serve dist/ locally for QA
```

(If you add linting/formatting, also expose `npm run lint` / `npm run format`.)

---

## 📌 Current State & To‑Dos

* ✅ Email/Google/Phone login flows wired up
* ✅ Members area with Profile / Events / Calendar / Availability / Resources / Settings
* ✅ Separate navbars for Members, Performer, Admin contexts
* ✅ Role‑based dashboard selection
* ✅ Resources page links to **Box sheet‑music library** (update link in code/config as needed)
* ⏳ **Performance Inquiry workflow**: currently routed via **Book Us**; plan to queue submissions into an **Admin Performance Requests** collection for review before promotion to Events
* ⏳ **Single “Member Portal” top‑nav** (optional) that routes to `/members` and surfaces Login/Redirect if not signed in

---

## 🤝 Contributing

1. Branch from `main` (`feat/...` or `fix/...`)
2. Keep PRs focused with a short description and testing notes
3. Include screenshots or a short video for UI changes

---

## 🧭 Contact

For questions or performance bookings, use the **Contact** or **Book Us** pages. Internal issues: open a GitHub issue or contact the web team.
