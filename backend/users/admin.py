from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordResetToken, Faculty, Program, CoordinatorProfile


class CoordinatorProfileInline(admin.TabularInline):
    model = CoordinatorProfile
    extra = 0
    autocomplete_fields = ['program']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'document_number', 'faculty', 'program']
    list_filter = ['role', 'faculty', 'program', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'document_number', 'first_name', 'last_name']
    inlines = [CoordinatorProfileInline]

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rol y Afiliación Académica', {
            'fields': ('role', 'roles', 'faculty', 'program')
        }),
        ('Información Adicional', {
            'fields': ('document_number', 'second_name', 'second_lastname',
                       'personal_email', 'phone_number', 'photo')
        }),
    )


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    search_fields = ['name', 'code']


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'faculty', 'created_at']
    list_filter = ['faculty']
    search_fields = ['name', 'code']
    autocomplete_fields = ['faculty']


@admin.register(CoordinatorProfile)
class CoordinatorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'coordinator_type', 'program', 'created_at']
    list_filter = ['coordinator_type', 'program']
    search_fields = ['user__first_name', 'user__last_name', 'user__document_number']
    autocomplete_fields = ['user', 'program']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'expires_at', 'used']
    list_filter = ['used', 'created_at']
    search_fields = ['user__username', 'user__email', 'token']
    readonly_fields = ['token', 'created_at']
