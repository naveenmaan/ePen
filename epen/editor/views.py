from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .pdf_editor import *
import json


from .models import *


# Create your views here.
def index(request):
	return render(request, "index.html")

def upload(request):
	return render(request, "upload.html", {})

def get_stored_document(request):
	document_data = getStoredDocumentFromDB()

	return JsonResponse({"document_data": document_data})
	return JsonResponse(json.dumps({"document_data": document_data}))

def getFile(request):
	fileID=request.POST.get('fileID')

	file, changes = getPDF(fileID)

	if file == None:
		return JsonResponse({"error": "Invalid file"})

	return JsonResponse({"fileData": file.decode("utf-8"), 'action': changes })

def getImage(request):
	fileID = request.GET.get('fileID')
	file, changes = getPDF(fileID)
	if file == None:
		return JsonResponse({"error": "Invalid file"})

	response = pdf2image(file, changes)

	return JsonResponse({"fileData": response.decode("utf-8"), "_id": fileID})




def uploadFile(request):
	file = request.FILES["uploadFile"]

	file_data = None

	if file.name[-4:] == '.pdf':
		file_data = base64.b64encode(file.read())

	if file.name[-4:].lower() in [".png", "jpeg", ".jpg"]:
		file_data = base64.b64encode(file.read())
		file_data = image2pdf(file_data)

	if file.name[-4:].lower() in ['.doc', 'docx', 'docs']:
		file_data = docs2pdf(file)

	if file_data == None:
		return JsonResponse({"error": "File is invalid"})

	insert_id = storePdf(file_data, file.name)

	if insert_id == None:
		return JsonResponse({"error": "500 internal server error"})

	return JsonResponse({"id": insert_id, "filename": file.name})

def editor(request):

	return render(request, "editor.html")

def applyChanges(request):
	fileID = request.POST.get('fileID')

	fileData, _ = getPDF(fileID)

	_ = storePDfChanges(fileID, json.loads(request.POST.get('action')))

	response = applyEditing(fileData, json.loads(request.POST.get('action')))

	response = HttpResponse(response, content_type='application/pdf')
	response['Content-Disposition'] = 'inline;filename = "outputfile.pdf"'


	return response

def saveDetails(request):
	fileData = request.POST.get('fileID')

	action = json.loads(request.POST.get('action'))

	insert_id = storePDfChanges(fileData, action)

	return  JsonResponse({"id": insert_id})

