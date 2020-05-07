import pymongo
from bson.objectid import ObjectId


def storePdf(pdf_data, pdf_name):
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_collection = pdfDB['pdf_collection']

    result = pdf_collection.insert_one(
        {
            "pdf_name": pdf_name,
            "pdf_data": pdf_data
        }
    )

    myclient.close()

    return str(result.inserted_id)

def getPDF(file_id):
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_collection = pdfDB['pdf_collection']

    collection = None

    for x in pdf_collection.find({"_id": ObjectId(file_id)}):
        collection = x['pdf_data']

    myclient.close()

    return collection