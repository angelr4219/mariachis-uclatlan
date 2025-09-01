Mariachi de Uclatlán Website 🎶

This is the official web platform for Mariachi de Uclatlán, UCLA’s premier mariachi ensemble.
The site provides public pages (About, Contact, Booking), a members portal, performer dashboards, and an admin dashboard — all powered by React + Vite + Firebase.

🚀 Features

Public Pages

Home, About, Contact, Book Us, Join

Authentication

Email + Password

Google Sign-In

Phone (SMS + reCAPTCHA)

Members Portal

Profile, Events, Resources, Settings

Performer availability tracking

Calendar & event management

Role-Based Dashboards

Performer Dashboard

Admin Dashboard

Role detection via Firebase Auth & custom claims

Firestore Integration

User registration profiles stored in Firestore

Events, availability, and member data synced in real time

📂 Project Structure
src/
│
├── App.tsx                # Main app router & role-based navbars
├── firebase.ts            # Firebase config & initialization
│
├── pages/                 # Public + Member + Admin pages
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Contact.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── bookUs.tsx
│   ├── joinUs.tsx
│   ├── MembersOnly.tsx
│   └── Members/           # Members section
│       ├── Profile.tsx
│       ├── Events.tsx
│       ├── Resources.tsx
│       ├── Settings.tsx
│       ├── PerformerAvailability.tsx
│       └── Calendar.tsx
│
├── components/            # Shared UI components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── MembersNavbar.tsx
│   └── carousel/
│
├── adminComponents/       # Admin-only UI
│   └── adminDashboard.tsx
│
├── performerComponents/   # Performer-only UI
│   └── PerformerDashboard.tsx
│
└── rolebasedlayout/       # Role-based routing logic
    └── rbl.tsx

⚙️ Setup & Installation

Clone the repo

git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>


Install dependencies

npm install


Configure Firebase

Create a Firebase project at Firebase Console
.

Enable Authentication (Email/Password, Google, Phone).

Enable Firestore Database.

Add your web app and copy its config.

Create a .env file in the root with:

VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id


Run the dev server

npm run dev


App runs at http://localhost:5173
.

Build for production

npm run build
npm run preview

👥 Roles

Public – Anyone visiting the site.

Performer – Authenticated member with performer role.

Admin – Admin users with elevated privileges.

Roles are determined by email → role mapping in
src/config/roles.ts.

🛠 Scripts

npm run dev – Start development server

npm run build – Build production app

npm run preview – Preview production build locally

npm run lint – Run linter

📌 Notes

Make sure your Firebase rules are set up to allow authenticated users to read/write their own data while restricting sensitive collections to admins.

Admin and Performer dashboards will only appear if the user is signed in with the correct role.