import json
import time
from typing import Optional

import httpx
from jose import jwk, jwt
from jose.utils import base64url_decode

from app.config.settings import settings

# Cache for JWKS keys
_jwks_cache: Optional[dict] = None
_jwks_cache_time: float = 0
JWKS_CACHE_DURATION = 3600  # 1 hour


async def get_jwks() -> dict:
    """Fetch and cache the JWKS from Cognito."""
    global _jwks_cache, _jwks_cache_time

    if _jwks_cache and (time.time() - _jwks_cache_time) < JWKS_CACHE_DURATION:
        return _jwks_cache

    jwks_url = (
        f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
        f"{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = time.time()
        return _jwks_cache


async def verify_token(token: str) -> dict:
    """
    Verify a Cognito JWT token and return the claims.
    
    Raises:
        ValueError: If the token is invalid or expired.
    """
    try:
        # Get the kid from the token header
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")

        if not kid:
            raise ValueError("Token missing key ID")

        # Get the JWKS
        jwks_data = await get_jwks()
        keys = jwks_data.get("keys", [])

        # Find the matching key
        key = None
        for k in keys:
            if k["kid"] == kid:
                key = k
                break

        if not key:
            raise ValueError("Token key not found in JWKS")

        # Construct the public key
        public_key = jwk.construct(key)

        # Get the message and signature
        message, encoded_signature = token.rsplit(".", 1)
        decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))

        # Verify the signature
        if not public_key.verify(message.encode("utf-8"), decoded_signature):
            raise ValueError("Token signature verification failed")

        # Decode and verify claims
        claims = jwt.get_unverified_claims(token)

        # Verify expiration
        if time.time() > claims.get("exp", 0):
            raise ValueError("Token has expired")

        # Verify audience (client_id)
        if claims.get("client_id") != settings.COGNITO_APP_CLIENT_ID:
            # For id_token, the audience field is 'aud'
            if claims.get("aud") != settings.COGNITO_APP_CLIENT_ID:
                raise ValueError("Token audience mismatch")

        # Verify issuer
        expected_issuer = (
            f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
            f"{settings.COGNITO_USER_POOL_ID}"
        )
        if claims.get("iss") != expected_issuer:
            raise ValueError("Token issuer mismatch")

        return claims

    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")
