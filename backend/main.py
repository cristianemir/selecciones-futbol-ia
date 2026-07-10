from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import tensorflow as tf
import io
from PIL import Image

app = FastAPI(title="Predicción de Camisetas de Fútbol IA")

# Configurar CORS para que tu React (localhost:5173) pueda conectarse sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiaremos esto por tu link de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir como marcador de posición para cuando arrastres tu modelo entrenado de Colab
MODEL_PATH = "modelo_camisetas.h5"
model = None

try:
    # Intentar cargar el modelo si ya existe en la carpeta
    model = tf.keras.models.load_model(MODEL_PATH)
    print("🧠 ¡Modelo de TensorFlow cargado exitosamente!")
except Exception as e:
    print("⚠️ Nota: El archivo 'modelo_camisetas.h5' aún no está en la carpeta. Usando modo simulación.")

# Lista oficial de tus etiquetas ordenadas alfabéticamente (como las maneja Keras)
LABELS = ["ARG", "BRA", "GER", "MEX"]

@app.get("/")
def home():
    return {"status": "Servidor corriendo", "modelo_cargado": model is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Leer los bytes de la imagen enviados por la webcam de React
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    
    # 2. Procesamiento de Imagen con OpenCV (python-headless)
    # Convertir a arreglo de numpy y cambiar de canal RGB a BGR para OpenCV
    open_cv_image = np.array(image)
    open_cv_image = open_cv_image[:, :, ::-1].copy()
    
    # Redimensionar matemáticamente a 224x224 (lo que pide MobileNetV2)
    resized_image = cv2.resize(open_cv_image, (224, 224))
    
    # Normalizar los píxeles (escalar de 0-255 a un rango de 0 a 1 o de -1 a 1)
    normalized_image = resized_image / 255.0
    input_tensor = np.expand_dims(normalized_image, axis=0) # Añadir dimensión de lote (batch)

    # 3. Ejecución de la Red Neuronal
    if model is not None:
        predictions = model.predict(input_tensor)
        predicted_class_idx = np.argmax(predictions[0])
        result = LABELS[predicted_class_idx]
    else:
        # Modo simulación si aún estás entrenando en Colab
        import random
        result = random.choice(LABELS)

    return {"prediction": result}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)