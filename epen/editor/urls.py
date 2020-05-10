from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('upload/', views.upload, name='upload'),
    path('get_stored_document', views.get_stored_document, name='Url to responded the stored document details'),
    path('getImage/', views.getImage, name='Url to respond the document image'),
    path('editor/', views.editor, name='editor'),
    path('uploadFile/', views.uploadFile, name='uploadFile'),
    path('getFile/', views.getFile, name='getFile'),
    path('applyChanges/', views.applyChanges, name='applychanges'),
    path('saveDetails/', views.saveDetails, name='saveDetails')
]