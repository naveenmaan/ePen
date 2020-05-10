# ePen

A web pdf editing tool. This tool allows users to deliberately draw lines, boxes, or add texts on the top of the pdf. This tool enables users to use varieties of files like pdf, doc, images. But the outcome will be the pdf. When a user uploads a file to update using various python library system converts the file to the pdf and allow the user to draw on the top of the pdf file.

# Technologies Used
- Python
- Django
- MongoDB
- Javascript
- Html

# Required Python Package
- PyPDF2
- reportlab
- xhtml2pdf
- mammoth
- base64
- pymongo
- Django

# Instruction
- Run mongo server
    ```cmd
    mongod --dbpath "path_to_db"
    ```
- Run django web server
    ```cmd
    python manage.py runserver
    py manage.py runserver
    ```

# ePen.js
epen.js can also be used standalone. This will enable the user to associate with pdf and paint on the top of pdf. Below is how to use epen.js.
To use epen.js first we required the [pdf.js](https://mozilla.github.io/pdf.js/getting_started/) import in the project.
```html
<script  type="text/javascript" src="pdf.js"></script>
<script  type="text/javascript" src="text_layer_builder.js"></script>

<div id="container"></div>

<script  type="text/javascript" src="epen.js"></script>
<script>
    pen = ePen({
        url: pdf_base64,
    });
    ePen.prototype._load_pdf();
</script>

```
