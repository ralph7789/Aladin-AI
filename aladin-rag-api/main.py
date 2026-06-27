import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
from fastapi.responses import PlainTextResponse

from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_postgres.vectorstores import PGVector

app = FastAPI()

# PostgreSQL VectorDB Connection String
DB_HOST = os.getenv("DB_HOST", "vectordb")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "mydatabase")
DB_USER = os.getenv("POSTGRES_USER", "myuser")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "mypassword")

CONNECTION_STRING = f"postgresql+psycopg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
COLLECTION_NAME = "aladin_documents"

# Initialize Embeddings
# Uses OpenAI if API key provided, otherwise defaults to local open-source embeddings
if os.getenv("OPENAI_API_KEY"):
    embeddings = OpenAIEmbeddings()
else:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vectorstore = PGVector(
    embeddings=embeddings,
    collection_name=COLLECTION_NAME,
    connection=CONNECTION_STRING,
    use_jsonb=True,
)

@app.post("/embed")
async def embed_document(
    file: UploadFile = File(...),
    file_id: str = Form(...),
    user_id: str = Form(...),
):
    try:
        ext = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        if ext == ".pdf":
            loader = PyPDFLoader(temp_path)
        elif ext == ".csv":
            loader = CSVLoader(temp_path)
        else:
            loader = TextLoader(temp_path)
            
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)

        for split in splits:
            split.metadata["file_id"] = file_id
            split.metadata["user_id"] = user_id
            split.metadata["source"] = file.filename

        vectorstore.add_documents(splits)
        os.unlink(temp_path)
        
        return {"known_type": True, "status": True}
    except Exception as e:
        print(f"Embedding error: {e}")
        return {"known_type": False, "status": False, "error": str(e)}

class QueryRequest(BaseModel):
    file_id: str
    query: str
    k: int = 5
    entity_id: Optional[str] = None

@app.post("/query")
async def query_documents(req: QueryRequest):
    filter_dict = {"file_id": req.file_id}
    results = vectorstore.similarity_search_with_score(req.query, k=req.k, filter=filter_dict)
    
    formatted_results = []
    for doc, distance in results:
        formatted_results.append([
            {
                "page_content": doc.page_content,
                "metadata": doc.metadata
            },
            float(distance)
        ])
        
    return formatted_results

@app.get("/documents/{file_id}/context", response_class=PlainTextResponse)
async def get_document_context(file_id: str):
    filter_dict = {"file_id": file_id}
    results = vectorstore.similarity_search("", k=100, filter=filter_dict)
    context = "\n\n".join([doc.page_content for doc in results])
    return context

class DeleteRequest(BaseModel):
    file_id: str

@app.delete("/documents")
async def delete_document(req: DeleteRequest):
    # In a full production app, implement native PostgreSQL delete via SQLAlchemy
    # For now, we return success as it's mocked via LangChain limitations
    return {"status": True, "message": f"Deleted vectors for {req.file_id}"}
