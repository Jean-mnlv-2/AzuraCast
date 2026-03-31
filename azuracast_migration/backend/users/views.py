import pyotp
import qrcode
import io
import base64
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import Group
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

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        send_welcome_email(user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_permissions(self):
        if self.action in ('me', 'setup_2fa', 'verify_2fa'):
            return [permissions.IsAuthenticated()]
        if self.action in ('request_password_reset',):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

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
    permission_classes = [permissions.IsAdminUser]

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [permissions.IsAdminUser]

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
