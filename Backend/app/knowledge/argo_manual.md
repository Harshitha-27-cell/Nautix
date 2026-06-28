# Argo Float Cycle Operations Manual

Argo floats are autonomous profiling instruments that operate continuously in the global ocean, measuring salinity, temperature, and depth (pressure) profiles.

## The Standard 10-Day Profile Cycle

Each Argo float repeats a structured operational cycle lasting precisely 10 days:

1.  **Buoyancy Descent (Descent to Park)**
    *   The float activates its internal hydraulic bladder engine, pumping oil out of an external bladder. This increases its overall density, causing it to sink.
    *   It descends to a target **Parking Depth** of approximately **1,000 meters**.
2.  **Deep Drift (Parking Phase)**
    *   The float drifts passively with ocean currents at the 1,000-meter parking depth for **9 days**.
    *   This drifting phase is critical for estimating deep-ocean circulation speeds.
3.  **Profile Descent**
    *   At the end of the 9th day, the float descends further to its maximum **Profiling Depth**, typically **2,000 meters** (or deeper for Deep Argo floats).
4.  **Buoyancy Ascent and Parameter Recording**
    *   The float inflates its external bladder, decreasing its density, and ascends to the surface over approximately 6 hours.
    *   During the ascent, its CTD (Conductivity, Temperature, Depth) sensors record measurements continuously along the vertical profile.
5.  **Surface Data Telemetry**
    *   Once at the surface, the float connects via GPS to **Iridium** or Argos satellite networks.
    *   It transmits its profile measurements, current GPS coordinates, battery metrics, and sensor diagnostics to shore stations.
    *   After transmitting (usually taking under 30 minutes), it deflates the bladder and starts the next cycle.
