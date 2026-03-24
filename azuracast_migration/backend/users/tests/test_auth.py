from django.test import TestCase
from django.contrib.auth.models import Group
from users.models import User, ApiKey, RolePermission
from stations.models import Station

class UserAuthTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123",
            name="Test User"
        )
        self.station = Station.objects.create(
            name="Test Radio",
            short_name="test-radio",
            radio_base_dir="/var/azuracast/stations/test_radio"
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, "test@example.com")
        self.assertTrue(self.user.check_password("password123"))
        self.assertFalse(self.user.is_staff)

    def test_api_key_creation(self):
        api_key = ApiKey.objects.create(
            user=self.user,
            comment="Mobile App",
            key_hash="hashed_key_here"
        )
        self.assertEqual(api_key.user, self.user)
        self.assertEqual(api_key.comment, "Mobile App")

    def test_superuser_creation(self):
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpassword",
            name="Admin User"
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_login_endpoint(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
