
# JanaSeva — Public Sanitation & Drinking Water Finder
<img width="1919" height="897" alt="image" src="https://github.com/user-attachments/assets/039c08ec-c2f0-4415-9db0-58e32c6b95b7" />

### Find. Verify. Access. Report. Resolve.

**JanaSeva** is a civic-tech web application developed for the **ANAVANDI Hackathon** to make public sanitation and drinking-water facilities easier to discover and access. The platform brings geographic facility discovery, location-based search, accessibility information, navigation, and community reporting into a single interface.

By combining interactive mapping with structured facility information, JanaSeva aims to help people find public essentials and contribute information about missing or problematic facilities.

<p align="center">
  <a href="https://janaseva-jet.vercel.app/">
    <strong>Live Demo</strong>
  </a>
  &nbsp; • &nbsp;
  <a href="https://github.com/Karthaa/JanaSeva">
    <strong>GitHub Repository</strong>
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data Sources and Reliability](#data-sources-and-reliability)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Security and Privacy](#security-and-privacy)
- [Current Status and Limitations](#current-status-and-limitations)
- [Future Enhancements](#future-enhancements)
- [Hackathon Context](#hackathon-context)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Finding a public restroom or a safe, accessible drinking-water point can be difficult when information is scattered, outdated, or unavailable.

JanaSeva addresses this challenge through a map-first interface that brings public facilities and their available information together. Users can explore mapped locations, filter facilities, check available details, navigate to a selected location, and report issues or suggest missing facilities where those workflows are configured.

The platform is designed around three principles:

- **Accessibility:** Make essential public facilities easier to locate.
- **Transparency:** Distinguish mapped locations, reported issues, and verified information.
- **Community participation:** Enable people to contribute information that can be reviewed and maintained.

**Primary focus:** Public sanitation and drinking-water facility discovery in Kochi, Kerala, India.

## The Problem

Access to public sanitation and drinking water is an important part of everyday urban life. However, people may encounter several challenges:

- Difficulty locating nearby public restrooms and drinking-water facilities.
- Limited information about accessibility and facility condition.
- Uncertainty about whether a mapped facility is usable.
- Incomplete or outdated public facility information.
- Lack of a straightforward way to report an issue or suggest a missing location.

These challenges create a need for a simple, location-aware platform that makes public facility information easier to explore and maintain.

## Our Solution

JanaSeva combines an interactive geographical map with a searchable facility directory and reporting-oriented workflows.

The application is designed to let users:

1. Explore public restroom and drinking-water locations on a map.
2. Search for facilities and filter the available results.
3. Find nearby facilities and explore usability-related information.
4. View facility details and accessibility information when available.
5. Open navigation directions for a selected facility.
6. Report facility-related issues.
7. Suggest missing public facilities for review, where the submission workflow is configured.

The goal is not simply to display locations, but to provide a foundation for more accessible, transparent, and community-informed public facility discovery.

---

## Key Features

### 1. Interactive Geographical Map

JanaSeva uses a map-based interface to display public facility locations geographically.

- Distinct markers for sanitation facilities, drinking-water points, and reported issues.
- Interactive map controls and facility selection.
- Geographic exploration of available mapped locations.
- Map and facility-list interaction.
- Responsive map presentation for desktop and mobile screens.

### 2. Facility Discovery

Users can explore available public facilities through a searchable and filterable interface.

- Search facilities by available names or location information.
- Filter by facility type.
- Explore nearby facilities.
- Use nearest or nearest-usable sorting where supported by the available data.
- View facility details and available accessibility information.

Results depend on the data available to the application and the user's location permissions.

### 3. Public Restroom and Drinking-Water Categories

The application distinguishes sanitation facilities from drinking-water locations.

Facility details may include:

- Facility name or mapped identifier.
- Geographic coordinates.
- Available location or landmark information.
- Accessibility attributes when supplied by the source.
- Facility condition or issue information where available.
- Data-source and verification indicators where implemented.

Missing information is not equivalent to a confirmed negative condition. A mapped facility should not automatically be considered clean, open, or operational.

### 4. Live Location and Nearby Discovery

The application uses browser geolocation to support location-aware discovery.

The intended workflow is to obtain the user's location, display the relevant position on the map, and use that position to calculate distances and identify nearby facilities.

Geolocation depends on browser permissions, device settings, HTTPS, and the accuracy of the location supplied by the device.

### 5. Navigation

Users can request directions to a selected facility through an external mapping service where the routing action is available.

This helps connect facility discovery with the next practical step: reaching the selected location.

### 6. Community Reporting

The reporting workflow is designed to help users contribute information about facility conditions and issues.

Depending on the configured implementation, users may be able to report:

- Damaged or vandalized facilities.
- Locked or inaccessible facilities.
- Drinking-water supply problems.
- Other facility-related conditions supported by the form.

Reports should only be presented as successfully submitted when the backend confirms the operation.

### 7. Add Missing Place

JanaSeva includes a workflow for suggesting public facilities that may not yet appear in the available dataset.

The intended process is:

1. Select the facility type.
2. Choose or confirm its geographic location.
3. Enter the available facility details.
4. Review the submission.
5. Submit it for review.

Where the review system is configured, administrators can review submissions and decide whether to approve or reject them.

A submitted location should not automatically be treated as an independently verified or operational facility.

### 8. Administrative Review

The administrative workflow is intended to support review of community-submitted facility information.

Its intended responsibilities include:

- Access to authorized administrative functions.
- Reviewing pending facility submissions.
- Approving or rejecting suggestions.
- Keeping unapproved suggestions separate from publicly accepted facility records.

Administrative access must be protected by real authentication and backend/database authorization.

### 9. Responsive Interface

JanaSeva uses a map-first interface with a compact facility panel and responsive layouts.

The design emphasizes:

- A dark, modern civic-tech visual identity.
- Clear sanitation, water, and issue markers.
- Search and filter controls.
- Facility cards and contextual actions.
- Mobile-friendly panels and touch controls.

---

## Technology Stack

JanaSeva combines modern frontend technologies, geospatial data, and a managed backend.

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Typed application logic and improved maintainability |
| Vite | Development server and frontend build tooling |
| Tailwind CSS and CSS | Responsive styling and visual design |
| MapLibre GL JS | Interactive geographical map rendering |
| Lucide React | Interface icons |
| Supabase | Backend services, authentication, and database integration |
| PostgreSQL | Relational data storage |
| PostGIS | Geospatial queries and spatial operations where configured |
| OpenStreetMap (OSM) | Source of mapped geographic facility information |
| GeoJSON | Representation and exchange of geographic feature data |
| Vercel | Frontend deployment and hosting |
| Git and GitHub | Version control and collaborative development |

**Important:** PostgreSQL/PostGIS capabilities, Supabase services, and individual integrations depend on the project's actual database schema, migrations, configuration, and deployed code.

### Why These Technologies?

**React + TypeScript**

Provides a component-based architecture and typed data models for facility records, map interactions, forms, and application state.

**Vite**

Provides a fast local development workflow and production build tooling.

**MapLibre GL JS**

Provides the interactive geographical map used to explore facility locations and support location-aware interactions.

**Supabase + PostgreSQL**

Provides a managed backend and relational database foundation for application data and configured authentication or reporting workflows.

**PostGIS**

Supports spatial operations such as working with coordinates, geographic distances, and location-based queries when the relevant database extensions and functions are configured.

**OpenStreetMap + GeoJSON**

Provides geographic data and a structured format for representing facility locations and related geographic features. Data coverage and completeness depend on the underlying mapped information.

**Vercel**

Hosts the deployed frontend and provides a publicly accessible demonstration of the application.

---

## System Architecture

The application follows a frontend, geospatial-data, and backend integration model.

```text
                   USER
                    |
                    v
        React + TypeScript Frontend
                    |
          +---------+----------+
          |                    |
          v                    v
   MapLibre Map           User Interface
          |               Search / Filters
          |               Forms / Reports
          |                    |
          v                    v
   GeoJSON / OSM         Supabase Client
   Facility Data                |
                               v
                      Supabase Services
                               |
                               v
                      PostgreSQL Database
                               |
                               v
                     PostGIS / Spatial SQL
                     where configured
```

### Main Components

**Frontend:** Renders the map, facility directory, controls, facility details, and reporting interfaces.

**Geospatial layer:** Represents mapped facility locations and provides the geographic information needed for map visualization and location-based interactions.

**Backend integration:** Connects supported application workflows to Supabase services and database operations.

**Database:** Stores application records and supports configured queries, submissions, and administrative workflows.

**Deployment:** The production frontend is hosted on Vercel.

The precise data flow for each feature depends on the implementation currently deployed and the corresponding backend configuration.

---

## Data Sources and Reliability

JanaSeva uses geographic facility information, including OpenStreetMap-derived data and application fallback/demo data where configured.

Different data sources serve different purposes:

| Data category | Meaning |
|---|---|
| OSM-mapped location | A location represented in the mapped source |
| Community-submitted location | A location suggested by a user |
| Admin-reviewed location | A submission reviewed through the configured administrative process |
| Facility condition report | A report about a facility's observed condition |
| Demo/fallback record | A record used for demonstration or fallback behavior |

These categories must not be treated as interchangeable.

- A mapped location does not guarantee that a facility exists at the stated location today.
- A mapped location does not establish that a restroom is clean or that drinking water is available.
- A community submission does not automatically mean the location has been verified.
- A previous condition report may not reflect the facility's current condition.

JanaSeva aims to make these distinctions clear so users can interpret the available information responsibly.

---

## Getting Started

### Prerequisites

Install the following tools:

- Node.js (a version compatible with the project's Vite configuration).
- npm or the package manager specified by the repository lockfile.
- Git.
- A Supabase project if you intend to use backend-connected functionality.

### 1. Clone the Repository

```bash
git clone https://github.com/Karthaa/JanaSeva.git
cd JanaSeva
```

### 2. Install Dependencies

If the repository uses npm:

```bash
npm install
```

Use the existing package manager and lockfile if the repository specifies another package manager.

### 3. Configure Environment Variables

Create a local environment file based on the project's environment template, such as `.env.example`.

For example, if the existing application expects these variable names:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_public_supabase_key
```

Use the actual variable names expected by the current Supabase client implementation. The public key may be a legacy anon key or a supported publishable key, depending on the project's configuration.

Never place a Supabase service-role key or secret key in frontend environment variables.

### 4. Start the Development Server

For a standard Vite application:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 5. Create a Production Build

```bash
npm run build
```

Run the project's configured type-checking, linting, and test scripts as well. Check `package.json` for the exact available script names.

---

## Environment Configuration

The application may require environment configuration for backend-connected features.

Before running the application, verify:

- The Supabase project URL is correct.
- The configured public/publishable key belongs to the intended project.
- Required database tables and RPC functions exist.
- Appropriate Row Level Security (RLS) policies are configured.
- Authentication and administrative authorization are correctly set up.
- Required geographic data files are available.
- Map style and tile services are reachable.
- Production environment variables are configured in Vercel.

Changes to environment variables on Vercel may require a new deployment.

Do not commit `.env` files or share private credentials.

---

## Project Structure

The repository contains the application source, public assets, and backend-related configuration.

A typical high-level structure is:

```text
JanaSeva/
├── public/                 # Public assets
├── src/                    # Frontend application source
│   ├── components/         # Reusable interface components
│   ├── ...                 # Application modules and styles
├── supabase/               # Supabase-related files and migrations
├── .env.example            # Environment template, if present
├── package.json            # Dependencies and scripts
├── package-lock.json       # npm dependency lockfile, if used
├── vite.config.ts          # Vite configuration, if present
├── tsconfig.json           # TypeScript configuration, if present
└── README.md               # Project documentation
```

This is a high-level guide. Refer to the actual repository for the complete file layout and the location of individual modules and datasets.

---

## Security and Privacy

JanaSeva's backend-connected features should follow these principles:

- Keep private credentials out of client-side code.
- Use public client keys only for intended frontend operations.
- Enforce authorization for administrative operations on the backend.
- Configure Row Level Security for database access.
- Validate submitted data on the server/database boundary.
- Avoid exposing sensitive diagnostic information to users.
- Request browser location only when needed and handle denied permissions appropriately.
- Do not describe location data or facility status as more accurate than the underlying source supports.

These are implementation requirements and should be checked against the deployed configuration.

---

## Current Status and Limitations

JanaSeva is a hackathon prototype with a deployed demonstration.

The frontend includes map-based facility discovery and interfaces for location-aware interaction and community reporting. The actual availability of backend-connected operations depends on the deployed configuration and current database integration.

Before treating the application as production-ready, verify the following against the deployed version:

- Both map views load their geographic basemap tiles correctly.
- Live location returns a valid position and updates the correct map.
- Facility distances and nearby sorting use the current location.
- Add Missing Place submissions are successfully stored in the database.
- Admin authentication and administrative authorization work correctly.
- Submission review and approval update the intended records.
- Error handling clearly distinguishes network, configuration, authentication, and database failures.

This project should not be interpreted as a guarantee that a mapped restroom is clean, open, accessible, or operational. Current condition information requires appropriate verification.

---

## Future Enhancements

Potential next steps include:

- Improved location accuracy and location-permission guidance.
- More complete and regularly maintained public facility datasets.
- Stronger facility verification and data-freshness indicators.
- Improved community reporting and submission tracking.
- More comprehensive administrative review tools.
- Duplicate-location detection.
- Better accessibility metadata and filtering.
- Automated integration and end-to-end regression testing.
- Improved mobile map interactions and performance.
- More robust monitoring of backend failures and data quality.

These are roadmap possibilities, not claims that every item is already implemented.

---

## Hackathon Context

**Project:** JanaSeva  
**Event:** ANAVANDI Hackathon  
**Domain:** Civic Technology / Geospatial Applications / Public Facility Accessibility  
**Deployment:** [janaseva-jet.vercel.app](https://janaseva-jet.vercel.app/)  
**Repository:** [github.com/Karthaa/JanaSeva](https://github.com/Karthaa/JanaSeva)

JanaSeva explores how mapping technologies, geographic data, and web application development can be combined to address a practical public-infrastructure discovery problem.

The project focuses on making public facility information easier to find, understand, and contribute to through a single accessible interface.

---

## Contributing

Contributions, suggestions, and improvements are welcome.

For changes:

1. Review the existing implementation before modifying it.
2. Keep facility data and geographic coordinates accurate.
3. Preserve database security policies.
4. Test map rendering and live-location behavior.
5. Test backend-connected workflows rather than relying only on their user interfaces.
6. Run the available build and test checks.
7. Submit changes through a reviewable branch or pull request.

Avoid committing credentials, private configuration, or unverified geographic data.

---

## License

No license is specified in this README. A license should be added only after the project owner selects the intended terms for reuse, modification, and distribution.

---

<p align="center">
  <strong>JanaSeva — Making Public Essentials Easier to Find.</strong>
  <br />
  <sub>Built for the ANAVANDI Hackathon.</sub>
</p>
