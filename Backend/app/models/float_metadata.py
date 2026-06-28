from datetime import date
from sqlalchemy import Float, String, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base


class FloatMetadata(Base):
    __tablename__ = "float_metadata"

    float_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    platform_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    region: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    deployment_date: Mapped[date] = mapped_column(Date, nullable=False)
