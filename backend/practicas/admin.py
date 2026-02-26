from django.contrib import admin
from .models import SitioPractica, ObjetivoPractica, Practica


@admin.register(SitioPractica)
class SitioPracticaAdmin(admin.ModelAdmin):
    list_display = ('name', 'program', 'address', 'is_active')
    list_filter = ('program', 'is_active')
    search_fields = ('name', 'address')


@admin.register(ObjetivoPractica)
class ObjetivoPracticaAdmin(admin.ModelAdmin):
    list_display = ('name', 'program')
    list_filter = ('program',)
    search_fields = ('name',)


@admin.register(Practica)
class PracticaAdmin(admin.ModelAdmin):
    list_display = ('name', 'program', 'coordinator', 'profesor_practica', 'year', 'period', 'code', 'is_active')
    list_filter = ('program', 'year', 'period', 'is_active')
    search_fields = ('name', 'code')
    filter_horizontal = ('sitios', 'objetivos', 'students')
