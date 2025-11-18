# A-1APSVC Dashboard PWA

A Progressive Web App (PWA) dashboard for **A-1 Affordable Plumbing Services**, live at [https://a-1apsvc.com](https://a-1apsvc.com).  
Provides an app-like experience with offline functionality, Supabase-backed data integration, and secure authentication.

---

## 🚀 Features
- 📱 Installable on desktop and mobile devices
- 🔄 Offline support via service worker caching
- ⚡ Fast loading with optimized caching strategies
- 📊 Supabase integration for real-time customer and job data
- 🎨 Responsive design with A-1APSVC branding
- 🔐 Secure authentication with redirects configured for `https://a-1apsvc.com`

---

## 📂 File Structure
├── index.html # Main dashboard page 
├── manifest.json # PWA configuration 
├── service-worker.js # Offline functionality 
├── style.css # Dashboard styling 
├── script.js # Interactive features 
├── images/ # App icons and branding 
│ ├── icon-192.png 
│ └── icon-512.png 
└── README.md # This file

Code

---

## 🛠️ Setup & Development

### Environment Variables
Set these in **Vercel → Settings → Environment Variables**:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
