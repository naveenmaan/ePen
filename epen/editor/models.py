import pymongo
from bson.objectid import ObjectId

from datetime import datetime


def storePdf(pdf_data, pdf_name):
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_collection = pdfDB['pdf_collection']

    result = pdf_collection.insert_one(
        {
            "pdf_name": pdf_name,
            "pdf_data": pdf_data,
            "created_datetime": datetime.now()
        }
    )

    myclient.close()

    return str(result.inserted_id)

def storePDfChanges(pdf_id, pdf_changes):
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_changes_collection = pdfDB['pdf_changes']

    result = pdf_changes_collection.insert_one(
        {
            "pdf_id": pdf_id,
            "pdf_changes": pdf_changes,
            "created_datetime": datetime.now()
        }
    )

    myclient.close()

    return str(result.inserted_id)

def getPDF(file_id):
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_collection = pdfDB['pdf_collection']
    pdf_changes = pdfDB['pdf_changes']

    collection = None

    for x in pdf_collection.find({"_id": ObjectId(file_id)}):
        collection = x['pdf_data']

    #get latest change
    changes = {}
    for x in pdf_changes.find({'pdf_id': str(x['_id'])}):
        changes = x['pdf_changes']

    myclient.close()

    return collection, changes

def getStoredDocumentFromDB():
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")

    pdfDB = myclient['pdf_data']

    pdf_collection = pdfDB['pdf_collection']

    collection = []

    for x in pdf_collection.find({},{ "_id": 1, "pdf_name": 1, 'created_datetime': 1}):
        x['_id'] = str(x['_id'])
        x['created_datetime'] = x['created_datetime'].strftime("%b %d, %Y");
        collection.append(x)

    myclient.close()

    return collection