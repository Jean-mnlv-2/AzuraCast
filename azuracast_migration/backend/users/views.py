import pyotp
import qrcode
import io
import base64
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import Group
from guardian.shortcuts import assign_perm, remove_perm
from stations.models import Station
from .models import User, ApiKey, RolePermission
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserAdminUpdateSerializer,
    GroupSerializer,
    ApiKeySerializer,
    RolePermissionSerializer,
)
from bantuwave.emails import send_welcome_email

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        send_welcome_email(user)

from rest_framework_simplejwt.tokens import RefreshToken

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    @action(detail=True, methods=['post'], permission_classes=[IsSuperUser])
    def impersonate(self, request, pk=None):
        """
        Generates a JWT token for another user.
        """
        user = self.get_object()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_permissions(self):
        if self.action in ('me', 'setup_2fa', 'verify_2fa'):
            return [permissions.IsAuthenticated()]
        if self.action in ('request_password_reset',):
            return [permissions.AllowAny()]
        return [IsSuperUser()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserAdminUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def station_permissions(self, request, pk=None):
        """
        Assign or remove station permissions for a user.
        Body: { "station_id": 1, "permission": "manage_station", "action": "add" }
        """
        user = self.get_object()
        station_id = request.data.get('station_id')
        permission = request.data.get('permission')
        action_type = request.data.get('action', 'add')

        if not station_id or not permission:
            return Response({'error': 'station_id and permission are required'}, status=status.HTTP_400_BAD_REQUEST)

        station = get_object_or_404(Station, id=station_id)
        
        available_permissions = [
            'view_station', 'manage_station', 'manage_station_profile',
            'manage_station_media', 'manage_station_playlists', 'manage_station_streamers',
            'manage_station_mounts', 'manage_station_remotes', 'manage_station_webhooks',
            'manage_station_podcasts', 'manage_station_hls', 'manage_station_analytics'
        ]

        if permission not in available_permissions:
            return Response({'error': 'Invalid permission'}, status=status.HTTP_400_BAD_REQUEST)

        perm_str = f"stations.{permission}"
        
        if action_type == 'add':
            assign_perm(perm_str, user, station)
            return Response({'status': f'Permission {permission} added for station {station.name}'})
        else:
            remove_perm(perm_str, user, station)
            return Response({'status': f'Permission {permission} removed for station {station.name}'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def get_station_permissions(self, request, pk=None):
        """
        Get all station permissions for a user.
        """
        user = self.get_object()
        from guardian.shortcuts import get_objects_for_user
        
        available_permissions = [
            'view_station', 'manage_station', 'manage_station_profile',
            'manage_station_media', 'manage_station_playlists', 'manage_station_streamers',
            'manage_station_mounts', 'manage_station_remotes', 'manage_station_webhooks',
            'manage_station_podcasts', 'manage_station_hls', 'manage_station_analytics'
        ]

        permissions_data = []
        

        from guardian.shortcuts import get_objects_for_user
        all_stations_ids = set()
        
        station_perms_map = {} # station_id -> list of perms

        for perm in available_permissions:
            stations_with_perm = get_objects_for_user(user, f'stations.{perm}', klass=Station)
            for s in stations_with_perm:
                if s.id not in station_perms_map:
                    station_perms_map[s.id] = {
                        'station_id': s.id,
                        'station_name': s.name,
                        'short_name': s.short_name,
                        'permissions': []
                    }
                station_perms_map[s.id]['permissions'].append(perm)

        return Response(list(station_perms_map.values()))

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def setup_2fa(self, request, pk=None):

        user = self.get_object()
        if user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save()
        
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="BantuWave")
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return Response({
            'secret': secret,
            'qr_code': f"data:image/png;base64,{qr_base64}"
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_2fa(self, request, pk=None):
        user = self.get_object()
        otp = request.data.get('otp')
        
        if not user.two_factor_secret:
            return Response({'error': '2FA not setup'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(otp):
            return Response({'status': 'verified'})
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def request_password_reset(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            from bantuwave.emails import send_centralized_email
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.http import urlsafe_base64_encode
            from django.utils.encoding import force_bytes
            
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')}/reset-password/{uid}/{token}"
            
            send_centralized_email(
                "Réinitialisation de votre mot de passe",
                'emails/password_reset.html',
                {'user': user, 'reset_url': reset_url},
                [user.email]
            )
            
            return Response({'status': 'If an account exists with this email, a reset link has been sent.'})
        except User.DoesNotExist:
            return Response({'status': 'If an account exists with this email, a reset link has been sent.'})

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsSuperUser]

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsSuperUser]

class ApiKeyViewSet(viewsets.ModelViewSet):
    queryset = ApiKey.objects.all()
    serializer_class = ApiKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        import secrets
        key = secrets.token_urlsafe(32)
        serializer.save(user=self.request.user, key_hash=key)
