from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .pdf_editor import *
import json


from .models import *


# Create your views here.
def index(request):
	return render(request, "index.html", {})


def getFile(request):
	fileID=request.POST.get('fileID')

	file = getPDF(fileID)

	if file == None:
		return JsonResponse({"error": "Invalid file"})

	return JsonResponse({"fileData": file.decode("utf-8") })



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
	fileData = request.POST.get('fileID')

	fileData = getPDF(fileData)

	response = applyEditing(fileData, json.loads(request.POST.get('action')))

	response = HttpResponse(response, content_type='application/pdf')
	response['Content-Disposition'] = 'inline;filename = "outputfile.pdf"'


	return response

