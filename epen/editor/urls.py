from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('editor/', views.editor, name='index'),
    path('uploadFile/', views.uploadFile, name='uploadFile'),
    path('getFile/', views.getFile, name='getFile'),
    path('applyChanges/', views.applyChanges, name='applychanges'),
]