from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel
import json

from database import get_db
import models
import schemas
from auth import get_current_user, get_current_admin, calculate_level
from default_data.course_data import COURSES
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["courses"])


@router.get("/", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request: Request):
    return _templates.TemplateResponse("login.html", {"request": request})
