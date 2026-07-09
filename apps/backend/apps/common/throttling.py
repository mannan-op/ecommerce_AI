from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    scope = "auth"


class AuthUserRateThrottle(UserRateThrottle):
    scope = "auth"


class BurstAnonRateThrottle(AnonRateThrottle):
    scope = "burst"


class TryOnRateThrottle(UserRateThrottle):
    scope = "tryon"


class StylistChatRateThrottle(UserRateThrottle):
    scope = "stylist_chat"
