from fastapi import HTTPException, status

class ChongException(Exception):
    def __init__(self, message: str, status_code: int = 500, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)

class NotFoundException(ChongException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND")

class ProviderException(ChongException):
    def __init__(self, message: str = "Music provider error"):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY, code="PROVIDER_ERROR")

class PlaybackException(ChongException):
    def __init__(self, message: str = "Audio stream unavailable"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, code="PLAYBACK_UNAVAILABLE")

class AuthenticationException(ChongException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, code="UNAUTHORIZED")
