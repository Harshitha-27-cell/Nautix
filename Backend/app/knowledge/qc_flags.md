# Argo Quality Control (QC) Flags Reference

This document describes the quality control (QC) flag system utilized across the Argo Global Data Assembly Centers (GDAC) to establish data authenticity and sensor health.

## Standard QC Flag Index

Every physical parameter measurement (pressure, temperature, salinity) in an Argo NetCDF profile is assigned a QC flag representing its validity:

*   **Flag 1: Good Data**
    *   *Description*: The measurement has passed all real-time and delayed-mode quality control checks.
    *   *Action*: Recommended for all scientific research and ocean modeling applications.
*   **Flag 2: Probably Good Data**
    *   *Description*: Passed most test checks, but contains slight parameter deviations.
    *   *Action*: Generally safe for research, but should be used with caution in sensitive calculations.
*   **Flag 3: Probably Bad Data**
    *   *Description*: Contains major anomalies indicating sensor drift, biofouling, or coordinate telemetry failures.
    *   *Action*: Not recommended for standard profiles calculations. Should be ignored unless corrected in delayed mode.
*   **Flag 4: Bad Data**
    *   *Description*: Failed critical physical threshold tests. The sensor is malfunctioning or telemetry was severely corrupted.
    *   *Action*: Reject immediately. Do not use.
*   **Flag 0: No QC Performed**
    *   *Description*: Raw observation data straight from satellite telemetry before automated processing cycles.

## Real-Time Testing Filters

GDAC automated filters immediately mark records as Flag 4 if:
1.  **Global Range Test**: Recorded temperatures are outside the range of -2.5°C to 40.0°C or salinity is outside 2.0 to 41.0 PSU.
2.  **Pressure Spike Test**: Sudden pressure jumps exceed realistic buoyancy speeds.
3.  **Spike Test**: Temperature spikes between consecutive pressure levels exceed 6.0°C.
