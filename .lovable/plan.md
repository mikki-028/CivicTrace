# Upgrade the dedicated GIS map

## What will change
- Replace only the simulated map canvas on the existing GIS page with the same Leaflet and OpenStreetMap experience used on Overview.
- Keep the page header, two-column layout, entity details, activity summary, concentration panel, colors, and existing actions unchanged.
- Plot every mocked municipal asset and BWG using its existing coordinates and live CivicTrace status.
- Keep markers clickable so selection continues to update the current details panel.
- Add the existing status legend plus compact filters for All, Assets, BWGs, Issues, and Attention.
- Highlight Ward 142 and provide zoom, pan, and reset controls.
- Cluster nearby markers, expanding or separating them as users zoom in.

## Technical details
- Create a dedicated interactive map component for the GIS page, loading Leaflet and marker clustering only in the browser.
- Reuse the existing entity store and `statusOf` logic so reports, collections, and verification actions immediately affect markers.
- Reuse the current semantic map marker styles and add matching cluster styles through design tokens.
- Preserve the existing Overview map and the rest of the GIS route unchanged.
- Verify the GIS page in the browser at desktop and narrow widths, including filters, marker selection, reset, clustering, and the existing details links.
