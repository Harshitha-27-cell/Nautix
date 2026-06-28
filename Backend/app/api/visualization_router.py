from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, JSONResponse
from app.api import deps
from app.models.user import User
from app.services.visualization import VisualizationService

router = APIRouter()


def export_figure(fig, export_format: str):
    """Helper to return figure as standard dict JSON or fully rendered offline HTML page."""
    if export_format.lower() == "html":
        # Render offline HTML with Plotly.js loaded via cloud CDN
        html_content = fig.to_html(
            include_plotlyjs="cdn",
            full_html=True,
            config={"responsive": True},
        )
        return HTMLResponse(content=html_content, status_code=status.HTTP_200_OK)

    # Default: Return Plotly dictionary directly to be consumed by react-plotly.js client
    return fig.to_dict()


@router.get(
    "/temperature-profile/{float_id}",
    responses={
        200: {
            "description": "Returns interactive temperature vs pressure profile chart",
            "content": {"application/json": {}, "text/html": {}},
        }
    },
)
async def get_temperature_profile(
    float_id: str,
    min_pressure: Optional[float] = Query(None, description="Minimum pressure cut-off (dbar)"),
    max_pressure: Optional[float] = Query(None, description="Maximum pressure cut-off (dbar)"),
    format: str = Query("json", description="Export format option: json or html"),
    current_user: User = Depends(deps.get_current_user),
    vis_service: VisualizationService = Depends(deps.get_visualization_service),
):
    """Generate temperature vs pressure vertical profiles for a float WMO code."""
    try:
        # Check if float exists
        fl = await vis_service.argo.get_float_by_platform_number(float_id)
        if not fl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Argo float WMO {float_id} not found.",
            )

        fig = await vis_service.generate_temperature_profile(
            platform_number=float_id,
            min_pressure=min_pressure,
            max_pressure=max_pressure,
        )
        return export_figure(fig, format)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating temperature profile visualization: {str(e)}",
        )


@router.get(
    "/salinity-profile/{float_id}",
    responses={
        200: {
            "description": "Returns interactive salinity vs pressure profile chart",
            "content": {"application/json": {}, "text/html": {}},
        }
    },
)
async def get_salinity_profile(
    float_id: str,
    min_pressure: Optional[float] = Query(None, description="Minimum pressure cut-off (dbar)"),
    max_pressure: Optional[float] = Query(None, description="Maximum pressure cut-off (dbar)"),
    format: str = Query("json", description="Export format option: json or html"),
    current_user: User = Depends(deps.get_current_user),
    vis_service: VisualizationService = Depends(deps.get_visualization_service),
):
    """Generate salinity vs pressure vertical profiles for a float WMO code."""
    try:
        fl = await vis_service.argo.get_float_by_platform_number(float_id)
        if not fl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Argo float WMO {float_id} not found.",
            )

        fig = await vis_service.generate_salinity_profile(
            platform_number=float_id,
            min_pressure=min_pressure,
            max_pressure=max_pressure,
        )
        return export_figure(fig, format)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating salinity profile visualization: {str(e)}",
        )


@router.get(
    "/trajectory/{float_id}",
    responses={
        200: {
            "description": "Returns interactive geographical float trajectory map",
            "content": {"application/json": {}, "text/html": {}},
        }
    },
)
async def get_trajectory_map(
    float_id: str,
    start_date: Optional[date] = Query(None, description="Start date bounds"),
    end_date: Optional[date] = Query(None, description="End date bounds"),
    format: str = Query("json", description="Export format option: json or html"),
    current_user: User = Depends(deps.get_current_user),
    vis_service: VisualizationService = Depends(deps.get_visualization_service),
):
    """Generate geographical coordinate trajectory tracks over time for a float WMO code."""
    try:
        fl = await vis_service.argo.get_float_by_platform_number(float_id)
        if not fl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Argo float WMO {float_id} not found.",
            )

        fig = await vis_service.generate_trajectory_map(
            platform_number=float_id, start_date=start_date, end_date=end_date
        )
        return export_figure(fig, format)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating float trajectory visualization: {str(e)}",
        )


@router.get(
    "/timeseries/{float_id}",
    responses={
        200: {
            "description": "Returns interactive timeseries parameters chart",
            "content": {"application/json": {}, "text/html": {}},
        }
    },
)
async def get_timeseries_chart(
    float_id: str,
    parameter: str = Query(
        "temperature", description="Tracking parameter options: temperature or salinity"
    ),
    depth_level: float = Query(
        5.0, description="Pressure depth level to track values at (dbar)"
    ),
    format: str = Query("json", description="Export format option: json or html"),
    current_user: User = Depends(deps.get_current_user),
    vis_service: VisualizationService = Depends(deps.get_visualization_service),
):
    """Generate historical time-series charts showing parameters variation at specific depths."""
    try:
        fl = await vis_service.argo.get_float_by_platform_number(float_id)
        if not fl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Argo float WMO {float_id} not found.",
            )

        if parameter.lower() not in ["temperature", "salinity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supported parameter filters are: 'temperature' or 'salinity'.",
            )

        fig = await vis_service.generate_timeseries_chart(
            platform_number=float_id, parameter=parameter, depth_level=depth_level
        )
        return export_figure(fig, format)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating timeseries visualization: {str(e)}",
        )
