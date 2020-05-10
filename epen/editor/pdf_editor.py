from PyPDF2 import PdfFileReader, PdfFileWriter
from io import BytesIO, StringIO
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
import mammoth
from xhtml2pdf import pisa
import base64



def createPdf(pageNumber, actions, pagesize):
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=pagesize)


    scale = 0.666;

    for key, value in actions.items():
        if key == "pencil":
            for actionRow in value:
                for index, trackRow in enumerate(actionRow['track']):
                    if index < actionRow['trackLength']:
                        can.setStrokeColor(HexColor(actionRow['color']))
                        can.line(trackRow[0]*scale, float(pagesize[1]) - trackRow[1]*scale,
                                 actionRow['track'][index+1][0]*scale, float(pagesize[1]) - actionRow['track'][index+1][1]*scale)

        if key ==  "rectangle":
            for actionRow in value:
                can.setStrokeColor(HexColor(actionRow['color']))
                can.roundRect(actionRow['start'][0]*scale,  float(pagesize[1]) - actionRow['start'][1]*scale,
                              (actionRow['end'][0]-actionRow['start'][0])*scale,
                              (actionRow['start'][1]-actionRow['end'][1])*scale, 0, stroke=1, fill=0)

        if key ==  "text":
            for actionRow in value:
                textobject = can.beginText()
                box_text_strength = (actionRow['end'][0] -actionRow['start'][0]) // (actionRow['textSize'] / 2.5);
                n = 0;
                while n*box_text_strength < len(actionRow['comment']):
                    comment = actionRow['comment'][int(n * box_text_strength): int((n + 1) * box_text_strength)]
                    #textobject.setTextOrigin(actionRow['start'][0]*scale, float(pagesize[1])-(actionRow['start'][1]*0.709999))
                    textobject.setTextOrigin(actionRow['start'][0]*scale,
                                             float(pagesize[1])-(actionRow['start'][1]+(n+1)*actionRow['textSize'])*scale)
                    textobject.setFont('Times-Roman', actionRow['textSize']*scale)
                    textobject.textLine(text=comment)
                    textobject.setFillColor(colors.black)
                    can.drawText(textobject)

                    n+=1

    can.showPage()
    can.save()
    packet.seek(0)

    newPdf = PdfFileReader(packet)

    return newPdf

def image2pdf(file_data):
    encoded_image = BytesIO(base64.b64decode(file_data))

    encoded_image = ImageReader(encoded_image)

    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)

    width, height = letter


    can.drawImage(encoded_image, 0, 0, width=width, height=height,
                     preserveAspectRatio=True, mask='auto')

    can.showPage()
    can.save()
    packet.seek(0)


    return base64.b64encode(packet.getvalue())

def pdf2image(pdf_bytes, actions):
    decodedText = base64.b64decode(pdf_bytes)
    pdfFileObj = BytesIO()
    pdfFileObj.write(decodedText)
    pdfReader = PdfFileReader(pdfFileObj)
    page = pdfReader.getPage(0)

    height = pdfReader.getPage(0).mediaBox.getHeight()
    width = pdfReader.getPage(0).mediaBox.getWidth()
    action_filter = {}
    # filtering the result
    for key, value in actions.items():
        action_filter[key] = []
        for actionRow in value:
            if actionRow['pageNumber'] == 1:
                action_filter[key].append(actionRow)

    actionedPage = createPdf(pdfReader.numPages, action_filter, (width, height))
    page.mergePage(actionedPage.getPage(0))

    page.scaleTo(120, 150)

    output = PdfFileWriter()
    output.addPage(page)

    response = BytesIO()
    output.write(response)
    response.seek(0)

    return base64.b64encode(response.read())


def convert_image(image):
	with image.open() as image_bytes:
		encoded_src = base64.b64encode(image_bytes.read()).decode("ascii")

	return {
		"src": "data:{0};base64,{1}".format(image.content_type, encoded_src)
	}

def docs2pdf(file_data):
    result = mammoth.convert_to_html(file_data, convert_image=mammoth.images.img_element(convert_image))
    html = result.value

    result = BytesIO()
    pisaStatus = pisa.pisaDocument(BytesIO(html.encode()), result)
    if not pisaStatus.err:
        return base64.b64encode(result.getvalue())
    else:
        print("here")
        return None

def applyEditing(file, actions):
    decodedText = base64.b64decode(file)
    pdfFileObj = BytesIO()
    pdfFileObj.write(decodedText)
    pdfReader = PdfFileReader(pdfFileObj)

    output = PdfFileWriter()

    for row in range(0, pdfReader.numPages):
        height = pdfReader.getPage(row).mediaBox.getHeight()
        width = pdfReader.getPage(row).mediaBox.getWidth()

        action_filter = {}

        #filtering the result
        for key, value in actions.items():
            action_filter[key] = []
            for actionRow in value:
                if actionRow['pageNumber'] == row+1:
                    action_filter[key].append(actionRow)

        actionedPage = createPdf(pdfReader.numPages, action_filter, (width, height))

        page = pdfReader.getPage(row)
        page.mergePage(actionedPage.getPage(0))
        output.addPage(page)

    response = BytesIO()
    output.write(response)
    response.seek(0)

    return response