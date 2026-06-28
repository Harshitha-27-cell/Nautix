from datetime import datetime
from sqlalchemy import Text, DateTime, ForeignKey, func, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    query: Mapped[str] = mapped_column(Text, nullable=False)
    execution_time: Mapped[float] = mapped_column(Float, nullable=False)  # execution time in seconds
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # 'success', 'failed'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="query_logs")
