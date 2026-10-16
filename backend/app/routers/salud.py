from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["salud"])


@router.get("/salud")
def salud():
    return {"status": "ok"}
