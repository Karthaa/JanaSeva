# JanaSeva 💧

**JanaSeva** is a location-aware public sanitation and drinking-water platform that helps citizens discover essential public facilities, access facility information, report issues and connect those reports with an authority-side management workflow.

## 🌟 Core Platform Features

* **Intelligent Spatial Discovery:** An interactive MapLibre canvas that detects the user's location via the HTML5 Geolocation API and instantly plots nearby civic amenities. Includes a dedicated "Locate Me" hardware-accelerated recenter button.
* **The "Truth-Decay" Ranking Engine (USP):** A custom PostGIS backend algorithm that ranks facilities not just by physical distance, but by data freshness. Facilities that haven't been verified recently suffer an exponential penalty, preventing users from being routed to abandoned or locked locations.
* **Real-Time Trust & Status Badges:** Every facility explicitly displays a dynamically calculated "Trust Percentage," a "Last Updated" timestamp, and its current operational condition (Clean, Usable, Broken, Locked, or No Water).
* **Dynamic Facility Filtering:** A reactive toggle system allowing users to instantly isolate 'Restrooms' or 'Water Points' on both the map markers and the list view without triggering new database fetches.
* **Anonymous Civic Ticketing:** An embedded reporting modal that allows users to submit condition updates (e.g., "Broken / Vandalized" or "No Water Supply"). To comply with privacy rules, it generates an anonymous device ID rather than forcing users to create an account.
* **One-Click Navigation Routing:** Facility cards feature a direct integration with Google Maps. Clicking "Get Directions" passes the exact PostGIS coordinates into the native routing app for immediate turn-by-turn navigation.
* **Accessibility Indicators:** Distinct visual markers highlighting facilities that are verified as wheelchair accessible, directly addressing the core problem statement for older users and persons with disabilities.
* **Offline-Ready PWA Architecture:** Built to degrade gracefully in dead zones. If the live Supabase connection fails, the frontend triggers a failsafe, injecting a locally cached dataset of Kakkanad/Infopark facilities so the demo (and the user experience) remains unbroken.
* **Premium "Native App" UX:** A responsive, mobile-first interface featuring a floating search header, custom SVG map pins (color-coded for fast recognition), and an interactive bottom-sheet list that mimics modern ride-sharing and delivery applications.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   Create a `.env` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🛠️ Technology Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Lucide React
* **Maps:** MapLibre GL JS, React-Map-GL
* **Backend:** Supabase, PostgreSQL, PostGIS
