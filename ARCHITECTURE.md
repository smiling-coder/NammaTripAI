# Architecture Overview

This project is a static, client-side travel planner for Karnataka. The architecture is intentionally simple and lightweight, with no backend service required for the current prototype.

```mermaid
flowchart TD
    U[User] --> UI[Web Browser\nindex.html + CSS + JS]
    UI --> F[Frontend Layer\nResponsive UI\nLanguage switching\nTrip form]
    F --> P[Planning Logic\nJavaScript rules\nBudget calculations\nItinerary generation]
    P --> R[Recommendation Engine\nInterest matching\nBudget constraints\nDestination scoring]
    R --> D[Curated Data Store\nDestinations\nActivities\nTravel metadata]
    P --> E[Estimated Cost Model\nTransport\nAccommodation\nFood\nActivities]
    F --> M[Maps / Discovery\nGoogle Maps links]
    D --> S[Static Site Deployment\nGitHub Pages]
    S --> U

    subgraph ClientSide[Client-Side Architecture]
        UI
        F
        P
        R
        D
        E
        M
    end

    classDef primary fill:#0f172a,stroke:#38bdf8,color:#e2e8f0,stroke-width:2px;
    classDef secondary fill:#1e293b,stroke:#34d399,color:#e2e8f0,stroke-width:2px;
    classDef data fill:#111827,stroke:#fbbf24,color:#fef3c7,stroke-width:2px;

    class U,F,P,R primary;
    class D,E,M,S secondary;
    class UI data;
```

## How the system works

1. The user interacts with the web interface in the browser.
2. The front-end form collects trip inputs such as city, budget, duration, travel interests, and number of travelers.
3. JavaScript logic processes those inputs and applies recommendation rules.
4. The recommendation engine matches user preferences against curated destination data.
5. The app calculates an approximate budget and generates a day-wise itinerary.
6. Users can open destinations in Google Maps for additional exploration.
7. The site is deployed as a static application on GitHub Pages.

## Core design principles

- Simple client-side architecture
- No server-side API dependency required
- Fast static hosting for easy deployment
- Rule-based recommendation logic for prototype use
- Bilingual interface support for Kannada and English
