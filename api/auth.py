"""
auth.py
───────
Clerk JWT verification for FastAPI.

Every protected endpoint calls verify_clerk_token(request)
to extract the authenticated user_id before touching any data.

Clerk JWTs are RS256 signed. We fetch Clerk's public JWKS on
startup and cache them — no network call per request.
"""

import os
import logging
from functools import lru_cache

import httpx
from fastapi import Request, HTTPException
from jose import jwt, JWTError

logger = logging.getLogger("lumen.auth")

CLERK_PUBLISHABLE_KEY = os.getenv("VITE_CLERK_PUBLISHABLE_KEY", "")
CLERK_SECRET_KEY      = os.getenv("CLERK_SECRET_KEY", "")

# Derive the JWKS URL from the publishable key
# pk_live_abc123 → https://abc123.clerk.accounts.dev/.well-known/jwks.json
def get_jwks_url() -> str:
    key = os.getenv("VITE_CLERK_PUBLISHABLE_KEY", "")
    if not key:
        raise RuntimeError("VITE_CLERK_PUBLISHABLE_KEY is not set")
    # Extract the instance identifier from the publishable key
    parts = key.replace("pk_live_", "").replace("pk_test_", "")
    import base64
    try:
        decoded = base64.b64decode(parts + "==").decode("utf-8").rstrip("$")
        return f"https://{decoded}/.well-known/jwks.json"
    except Exception:
        # Fallback: use Clerk's frontend API
        return f"https://clerk.{parts}.lcl.dev/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_jwks() -> dict:
    """
    Fetches and caches Clerk's public JWKS.
    Called once on first request, cached forever.
    Cache is cleared on server restart.
    """
    jwks_url = get_jwks_url()
    logger.info("Fetching Clerk JWKS from: %s", jwks_url)
    response = httpx.get(jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


async def verify_clerk_token(request: Request) -> str:
    """
    Extracts and verifies the Clerk JWT from the Authorization header.
    Returns the authenticated user_id string (e.g. "user_2abc123").
    Raises HTTP 401 if the token is missing, expired, or invalid.

    Usage in any protected endpoint:
        user_id = await verify_clerk_token(request)
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={
                "error":   "missing_token",
                "message": "Authentication required. Please sign in to use LUMEN.",
            }
        )

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        jwks = get_jwks()
        # Decode without verification first to get the key ID
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")

        # Find the matching public key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                public_key = key
                break

        if not public_key:
            raise HTTPException(status_code=401, detail={"error": "invalid_token"})

        # Verify and decode
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't set aud by default
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail={"error": "invalid_token"})

        return user_id

    except JWTError as e:
        logger.warning("JWT verification failed: %s", str(e))
        raise HTTPException(
            status_code=401,
            detail={
                "error":   "invalid_token",
                "message": "Your session has expired. Please sign in again.",
            }
        )


async def get_optional_user(request: Request) -> str | None:
    """
    Like verify_clerk_token but returns None instead of raising
    for unauthenticated requests. Used on endpoints that work
    both logged-in and anonymously.
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.removeprefix("Bearer ").strip()
        if not token or token == "null" or token == "undefined":
            return None
            
        return await verify_clerk_token(request)
    except Exception:
        return None
