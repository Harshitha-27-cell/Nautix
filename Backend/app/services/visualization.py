from datetime import date
from typing import List, Optional
import plotly.graph_objects as go
from app.services.argo import ArgoService

# Custom nautical dark theme color codes matching our styling system
THEME_BG = "rgba(7, 13, 25, 0.95)"
THEME_CARD_BG = "#0d1b31"
THEME_ACCENT_BLUE = "#00b4d8"
THEME_ACCENT_CYAN = "#4cc9f0"
THEME_TEXT = "#f0f3f8"
THEME_GRID = "rgba(0, 180, 216, 0.15)"


class VisualizationService:
    """Visualization service generating interactive Plotly figures for Argo float data."""

    def __init__(self, argo_service: ArgoService):
        self.argo = argo_service

    def _apply_theme_layout(self, fig: go.Figure, title: str, xaxis_title: str, yaxis_title: str) -> None:
        """Helper to apply standard ocean dark theme styles across charts."""
        fig.update_layout(
            title={
                "text": title,
                "font": {"family": "Outfit, sans-serif", "size": 18, "color": THEME_TEXT},
                "x": 0.5,
                "xanchor": "center",
            },
            plot_bgcolor="rgba(0, 0, 0, 0)",
            paper_bgcolor=THEME_BG,
            font={"family": "Inter, sans-serif", "color": THEME_TEXT},
            xaxis={
                "title": xaxis_title,
                "gridcolor": THEME_GRID,
                "linecolor": THEME_GRID,
                "zerolinecolor": THEME_GRID,
            },
            yaxis={
                "title": yaxis_title,
                "gridcolor": THEME_GRID,
                "linecolor": THEME_GRID,
                "zerolinecolor": THEME_GRID,
            },
            margin=dict(l=60, r=40, t=60, b=60),
            hovermode="closest",
        )

    async def generate_temperature_profile(
        self,
        platform_number: str,
        min_pressure: Optional[float] = None,
        max_pressure: Optional[float] = None,
    ) -> go.Figure:
        """Create Temperature vs Pressure vertical profile chart."""
        profiles = await self.argo.get_float_profiles(platform_number)
        fig = go.Figure()

        if profiles:
            # Get latest profile cycle
            p = sorted(profiles, key=lambda x: x.timestamp, reverse=True)[0]
            measurements = p.measurements

            # Apply pressure filters
            if min_pressure is not None:
                measurements = [m for m in measurements if m.pressure >= min_pressure]
            if max_pressure is not None:
                measurements = [m for m in measurements if m.pressure <= max_pressure]

            x_vals = [m.temperature for m in measurements]
            y_vals = [m.pressure for m in measurements]

            fig.add_trace(
                go.Scatter(
                    x=x_vals,
                    y=y_vals,
                    mode="lines+markers",
                    name=f"Cycle {p.profile_id}",
                    line=dict(color=THEME_ACCENT_CYAN, width=3),
                    marker=dict(size=8, symbol="circle", color=THEME_ACCENT_BLUE),
                    hovertemplate="Pressure: %{y} dbar<br>Temperature: %{x} °C<extra></extra>",
                )
            )

        # Invert y-axis (pressure increases downwards)
        self._apply_theme_layout(
            fig,
            title=f"Temperature vs Pressure Profile - Float {platform_number}",
            xaxis_title="Temperature (°C)",
            yaxis_title="Pressure (dbar)",
        )
        fig.update_layout(yaxis=dict(autorange="reversed"))
        return fig

    async def generate_salinity_profile(
        self,
        platform_number: str,
        min_pressure: Optional[float] = None,
        max_pressure: Optional[float] = None,
    ) -> go.Figure:
        """Create Salinity vs Pressure vertical profile chart."""
        profiles = await self.argo.get_float_profiles(platform_number)
        fig = go.Figure()

        if profiles:
            p = sorted(profiles, key=lambda x: x.timestamp, reverse=True)[0]
            measurements = p.measurements

            if min_pressure is not None:
                measurements = [m for m in measurements if m.pressure >= min_pressure]
            if max_pressure is not None:
                measurements = [m for m in measurements if m.pressure <= max_pressure]

            x_vals = [m.salinity for m in measurements]
            y_vals = [m.pressure for m in measurements]

            fig.add_trace(
                go.Scatter(
                    x=x_vals,
                    y=y_vals,
                    mode="lines+markers",
                    name=f"Cycle {p.profile_id}",
                    line=dict(color="#38b000", width=3),
                    marker=dict(size=8, symbol="diamond", color="#9ef01a"),
                    hovertemplate="Pressure: %{y} dbar<br>Salinity: %{x} PSU<extra></extra>",
                )
            )

        # Invert y-axis
        self._apply_theme_layout(
            fig,
            title=f"Salinity vs Pressure Profile - Float {platform_number}",
            xaxis_title="Salinity (PSU)",
            yaxis_title="Pressure (dbar)",
        )
        fig.update_layout(yaxis=dict(autorange="reversed"))
        return fig

    async def generate_trajectory_map(
        self,
        platform_number: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> go.Figure:
        """Create geographical trajectory route map tracking WMO coordinates over time."""
        profiles = await self.argo.get_float_profiles(platform_number)
        fig = go.Figure()

        if profiles:
            # Sort chronologically
            sorted_profiles = sorted(profiles, key=lambda x: x.timestamp)

            # Apply date filters
            if start_date:
                sorted_profiles = [p for p in sorted_profiles if p.timestamp.date() >= start_date]
            if end_date:
                sorted_profiles = [p for p in sorted_profiles if p.timestamp.date() <= end_date]

            lons = [p.longitude for p in sorted_profiles]
            lats = [p.latitude for p in sorted_profiles]
            texts = [
                f"Cycle: {p.profile_id}<br>Date: {p.timestamp.strftime('%Y-%m-%d')}<br>Coordinates: {p.latitude:.2f}, {p.longitude:.2f}"
                for p in sorted_profiles
            ]

            # Drawing trajectory lines & markers
            fig.add_trace(
                go.Scattergeo(
                    lon=lons,
                    lat=lats,
                    mode="lines+markers",
                    text=texts,
                    name=f"Float {platform_number}",
                    line=dict(width=3, color=THEME_ACCENT_CYAN),
                    marker=dict(
                        size=10,
                        color=THEME_ACCENT_BLUE,
                        line=dict(width=1, color=THEME_TEXT),
                    ),
                    hoverinfo="text",
                )
            )

        # Layout mapping configuration
        fig.update_layout(
            title={
                "text": f"Geographical Trajectory Map - Float {platform_number}",
                "font": {"family": "Outfit, sans-serif", "size": 18, "color": THEME_TEXT},
                "x": 0.5,
                "xanchor": "center",
            },
            paper_bgcolor=THEME_BG,
            geo=dict(
                showland=True,
                landcolor="#102542",
                oceancolor="#040810",
                showocean=True,
                subunitcolor="rgba(0, 180, 216, 0.3)",
                countrycolor="rgba(0, 180, 216, 0.3)",
                showlakes=True,
                lakecolor="#040810",
                projection_type="natural earth",
            ),
            margin=dict(l=20, r=20, t=50, b=20),
        )
        return fig

    async def generate_timeseries_chart(
        self,
        platform_number: str,
        parameter: str = "temperature",
        depth_level: float = 5.0,
    ) -> go.Figure:
        """Create time-series chart tracking vertical parameter changes across profile cycles."""
        profiles = await self.argo.get_float_profiles(platform_number)
        fig = go.Figure()

        if profiles:
            sorted_profiles = sorted(profiles, key=lambda x: x.timestamp)
            timestamps = []
            values = []

            for p in sorted_profiles:
                # Find the measurement closest to target depth/pressure level
                closest_m = min(p.measurements, key=lambda m: abs(m.pressure - depth_level))

                timestamps.append(p.timestamp)
                if parameter.lower() == "salinity":
                    values.append(closest_m.salinity)
                else:
                    values.append(closest_m.temperature)

            param_label = "Salinity (PSU)" if parameter.lower() == "salinity" else "Temperature (°C)"
            trace_color = "#38b000" if parameter.lower() == "salinity" else THEME_ACCENT_CYAN

            fig.add_trace(
                go.Scatter(
                    x=timestamps,
                    y=values,
                    mode="lines+markers",
                    name=f"Depth {depth_level} dbar",
                    line=dict(color=trace_color, width=3),
                    marker=dict(size=8, color=THEME_ACCENT_BLUE),
                    hovertemplate=f"Date: %{{x|%Y-%m-%d}}<br>{param_label}: %{{y}}<extra></extra>",
                )
            )

        param_name = "Salinity" if parameter.lower() == "salinity" else "Temperature"
        yaxis_title = "Salinity (PSU)" if parameter.lower() == "salinity" else "Temperature (°C)"

        self._apply_theme_layout(
            fig,
            title=f"Time-Series: {param_name} at {depth_level} dbar - Float {platform_number}",
            xaxis_title="Measurement Cycle Timestamp",
            yaxis_title=yaxis_title,
        )
        return fig
