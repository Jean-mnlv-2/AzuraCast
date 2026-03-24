from rest_framework import permissions

class CanViewSftpUsers(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('view_sftpuser', view.get_station())
