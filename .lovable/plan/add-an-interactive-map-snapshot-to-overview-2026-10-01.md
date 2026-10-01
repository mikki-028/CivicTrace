# Add an interactive map snapshot to Overview

## What will change
- Add a compact “GIS Waste Intelligence” section directly below the KPI cards and prototype note, before “Requires Attention”.
- Render the existing CivicTrace entities on an interactive OpenStreetMap centered on Ward 142.
- Add filters for All, Assets, BWGs, Issues, and Attention, plus zoom, pan, and reset controls.
- Open concise marker details with the requested action: “View Entity” for assets and “Review Case” for BWGs.
- Include the exact prototype-data disclaimer and a clear Ward 142 highlight.

## What stays unchanged
- Existing page layout, sidebar, colors, KPI cards, dashboard actions, and the dedicated GIS Map page.
- Existing dashboard data and status logic remain authoritative, so reports, collections, and verification actions immediately update marker states.

## Technical details
- Use Leaflet with OpenStreetMap tiles in a browser-only component to keep server rendering stable.
- Use semantic CivicTrace status tokens for custom markers and controls.
- Verify desktop and mobile rendering, marker actions, filters, zoom/pan/reset, and current build diagnostics.
