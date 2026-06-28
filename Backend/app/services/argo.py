import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.schemas.argo import ArgoMeasurement, ArgoProfile, ArgoFloatMetadata

logger = logging.getLogger(__name__)


class ArgoCacheManager:
    """In-memory cache manager with TTL support for caching HTTP queries."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        item = self._cache[key]
        if datetime.now(timezone.utc) > item["expire_at"]:
            del self._cache[key]
            return None
        return item["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        expire_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
        self._cache[key] = {"value": value, "expire_at": expire_at}

    def clear(self) -> None:
        self._cache.clear()


class ArgoAPIClient:
    """API client to query public ERDDAP / Argovis ocean data servers.

    Includes a high-fidelity synthetic fallback simulator for local reliability.
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
        # Seed realistic simulation data
        self._init_simulator_data()

    def _init_simulator_data(self):
        # Platform numbers mapped to float details
        self._sim_floats = [
            {
                "float_id": 1,
                "platform_number": "1901234",
                "latitude": 32.5,
                "longitude": -45.2,
                "region": "North Atlantic",
                "deployment_date": date(2023, 5, 12),
            },
            {
                "float_id": 2,
                "platform_number": "3901234",
                "latitude": -12.3,
                "longitude": -115.7,
                "region": "South Pacific",
                "deployment_date": date(2022, 9, 28),
            },
            {
                "float_id": 3,
                "platform_number": "5901234",
                "latitude": -28.1,
                "longitude": 75.4,
                "region": "Southern Indian Ocean",
                "deployment_date": date(2024, 1, 15),
            },
            {
                "float_id": 4,
                "platform_number": "6901234",
                "latitude": 38.6,
                "longitude": 18.2,
                "region": "Mediterranean Sea",
                "deployment_date": date(2021, 6, 2),
            },
        ]

        # Generate profiles for floats
        self._sim_profiles: Dict[str, List[Dict[str, Any]]] = {}
        for fl in self._sim_floats:
            p_num = fl["platform_number"]
            self._sim_profiles[p_num] = []

            # 3 profiles per float taken over consecutive days
            for cycle in range(1, 4):
                profile_date = datetime.combine(
                    fl["deployment_date"] + timedelta(days=cycle * 10),
                    datetime.min.time(),
                    tzinfo=timezone.utc,
                )

                # Simulate profiles descending along depth (pressure)
                measurements = []
                # Depth levels from surface (5 dbar) to depth (1000 dbar)
                depth_levels = [5, 50, 100, 250, 500, 1000]
                base_temp = 22.0 if "Mediterranean" in fl["region"] or "Pacific" in fl["region"] else 16.0
                base_sal = 36.2 if "Mediterranean" in fl["region"] else 34.8

                for i, pres in enumerate(depth_levels):
                    # Temp cools off with depth
                    temp = base_temp - (i * 2.8) + (cycle * 0.1)
                    if temp < 3.5:
                        temp = 3.5
                    # Salinity decreases slightly or behaves realistically
                    sal = base_sal - (i * 0.12)
                    measurements.append(
                        {"pressure": float(pres), "temperature": round(temp, 2), "salinity": round(sal, 2)}
                    )

                self._sim_profiles[p_num].append(
                    {
                        "profile_id": f"{p_num}_{cycle}",
                        "platform_number": p_num,
                        "latitude": fl["latitude"] + (cycle * 0.1),
                        "longitude": fl["longitude"] + (cycle * 0.15),
                        "timestamp": profile_date,
                        "measurements": measurements,
                    }
                )

    async def fetch_floats_from_api(self) -> List[Dict[str, Any]]:
        """Queries public ERDDAP / Argovis server. Falls back to simulator."""
        try:
            # Attempt Ifremer ERDDAP lookup for metadata
            url = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json?platform_number,latitude,longitude,time&distinct()&orderByLimit(10)"
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                rows = data.get("table", {}).get("rows", [])
                floats = []
                for idx, r in enumerate(rows):
                    p_num = str(r[0])
                    floats.append(
                        {
                            "float_id": idx + 100,
                            "platform_number": p_num,
                            "latitude": float(r[1]) if r[1] is not None else 0.0,
                            "longitude": float(r[2]) if r[2] is not None else 0.0,
                            "region": "Global Ocean",
                            "deployment_date": date(2020, 1, 1),
                        }
                    )
                return floats
        except Exception as e:
            logger.warning(f"Failed to query external ERDDAP. Falling back to simulator: {e}")

        # Simulator Fallback
        return self._sim_floats

    async def fetch_profiles_from_api(self, platform_number: str) -> List[Dict[str, Any]]:
        """Queries ERDDAP for profiles of a specific float. Falls back to simulator."""
        try:
            url = f"https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json?time,latitude,longitude,pres,temp,psal&platform_number={platform_number}&orderByLimit(50)"
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                rows = data.get("table", {}).get("rows", [])
                # Group measurements by profile cycle/time
                grouped: Dict[str, Dict[str, Any]] = {}
                for r in rows:
                    time_str, lat, lon, pres, temp, psal = r
                    if not time_str:
                        continue
                    ts = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                    cycle_key = time_str
                    if cycle_key not in grouped:
                        grouped[cycle_key] = {
                            "profile_id": f"{platform_number}_{cycle_key[:10]}",
                            "platform_number": platform_number,
                            "latitude": float(lat),
                            "longitude": float(lon),
                            "timestamp": ts,
                            "measurements": [],
                        }
                    grouped[cycle_key]["measurements"].append(
                        {
                            "pressure": float(pres),
                            "temperature": float(temp),
                            "salinity": float(psal),
                        }
                    )
                return list(grouped.values())
        except Exception as e:
            logger.warning(f"Failed to query external profiles for {platform_number}. Falling back to simulator: {e}")

        # Simulator Fallback
        return self._sim_profiles.get(platform_number, [])


class ArgoService:
    """Argo Integration Service layer linking the Client and the Cache Manager."""

    def __init__(self, client: ArgoAPIClient, cache: ArgoCacheManager):
        self.client = client
        self.cache = cache

    async def get_all_floats(self) -> List[ArgoFloatMetadata]:
        cache_key = "argo_all_floats"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        raw_floats = await self.client.fetch_floats_from_api()
        floats = []
        for fl in raw_floats:
            floats.append(ArgoFloatMetadata(**fl))

        self.cache.set(cache_key, floats, ttl_seconds=600)  # Cache for 10 minutes
        return floats

    async def get_float_by_platform_number(self, platform_number: str) -> Optional[ArgoFloatMetadata]:
        floats = await self.get_all_floats()
        for fl in floats:
            if fl.platform_number == platform_number:
                return fl
        return None

    async def get_float_profiles(self, platform_number: str) -> List[ArgoProfile]:
        cache_key = f"argo_profiles_{platform_number}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        raw_profiles = await self.client.fetch_profiles_from_api(platform_number)
        profiles = []
        for p in raw_profiles:
            measurements = [ArgoMeasurement(**m) for m in p.get("measurements", [])]
            profiles.append(
                ArgoProfile(
                    profile_id=p["profile_id"],
                    platform_number=p["platform_number"],
                    latitude=p["latitude"],
                    longitude=p["longitude"],
                    timestamp=p["timestamp"],
                    measurements=measurements,
                )
            )

        self.cache.set(cache_key, profiles, ttl_seconds=300)  # Cache for 5 minutes
        return profiles

    async def search_argo_data(
        self,
        platform_number: Optional[str] = None,
        region: Optional[str] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_temp: Optional[float] = None,
        max_temp: Optional[float] = None,
    ) -> List[ArgoProfile]:
        """Performs advanced geographic, date, and parameter query lookups."""
        floats = await self.get_all_floats()

        # 1. Filter floats list
        filtered_p_numbers = []
        for fl in floats:
            if platform_number and fl.platform_number != platform_number:
                continue
            if region and region.lower() not in fl.region.lower():
                continue
            if min_lat is not None and fl.latitude < min_lat:
                continue
            if max_lat is not None and fl.latitude > max_lat:
                continue
            if min_lon is not None and fl.longitude < min_lon:
                continue
            if max_lon is not None and fl.longitude > max_lon:
                continue
            if start_date and fl.deployment_date < start_date:
                continue
            if end_date and fl.deployment_date > end_date:
                continue
            filtered_p_numbers.append(fl.platform_number)

        # 2. Gather profiles and filter on date & temperature thresholds
        matching_profiles = []
        for p_num in filtered_p_numbers:
            profiles = await self.get_float_profiles(p_num)
            for profile in profiles:
                if start_date and profile.timestamp.date() < start_date:
                    continue
                if end_date and profile.timestamp.date() > end_date:
                    continue

                # Parameter checks (e.g. temperature ranges inside profile measurements)
                if min_temp is not None or max_temp is not None:
                    matched_measurements = []
                    for m in profile.measurements:
                        if min_temp is not None and m.temperature < min_temp:
                            continue
                        if max_temp is not None and m.temperature > max_temp:
                            continue
                        matched_measurements.append(m)

                    if not matched_measurements:
                        continue
                    # Yield clone profile containing matched parameters
                    profile = profile.model_copy(update={"measurements": matched_measurements})

                matching_profiles.append(profile)

        return matching_profiles
