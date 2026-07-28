from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import tensorflow as tf
import io
from PIL import Image

app = FastAPI(title="Predicción de Camisetas de Fútbol IA")

# Configurar CORS para que React pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta del modelo entrenado
MODEL_PATH = "modelo_camisetas.h5"
model = None

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("🧠 ¡Modelo de TensorFlow cargado exitosamente!")
except Exception as e:
    print(
        "⚠️ No se pudo cargar 'modelo_camisetas.h5'. "
        "El servidor funcionará en modo simulación."
    )
    print("Detalle:", str(e))

# Las etiquetas deben estar exactamente en el mismo orden
# utilizado durante el entrenamiento del modelo
LABELS = ["ARG", "BRA", "GER", "MEX"]


@app.get("/")
def home():
    return {
        "status": "Servidor corriendo",
        "modelo_cargado": model is not None,
        "etiquetas": LABELS
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelo_cargado": model is not None
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # 1. Validar el tipo de archivo recibido
        if file.content_type not in [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ]:
            raise HTTPException(
                status_code=400,
                detail="El archivo enviado no es una imagen válida."
            )

        # 2. Leer los bytes enviados por React
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="La imagen recibida está vacía."
            )

        # 3. Abrir la imagen y convertirla a RGB
        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        # 4. Convertir PIL a arreglo NumPy
        open_cv_image = np.array(image)

        # No es necesario convertir a BGR si el modelo fue entrenado
        # usando imágenes RGB con TensorFlow/Keras
        resized_image = cv2.resize(
            open_cv_image,
            (224, 224)
        )

        # 5. Normalización
        normalized_image = resized_image.astype(
            np.float32
        ) / 255.0

        # Añadir dimensión de lote:
        # (224, 224, 3) -> (1, 224, 224, 3)
        input_tensor = np.expand_dims(
            normalized_image,
            axis=0
        )

        # 6. Ejecutar la red neuronal
        if model is not None:
            predictions = model.predict(
                input_tensor,
                verbose=0
            )

            predicted_class_idx = int(
                np.argmax(predictions[0])
            )

            confidence = float(
                predictions[0][predicted_class_idx]
            )

            if predicted_class_idx >= len(LABELS):
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "El modelo devolvió una clase que no existe "
                        "en la lista LABELS."
                    )
                )

            result = LABELS[predicted_class_idx]

            print(
                f"🧠 Predicción: {result} "
                f"- Confianza: {confidence:.2%}"
            )

        else:
            # Modo simulación
            import random

            result = random.choice(LABELS)
            confidence = 0.0

            print(
                f"⚠️ Modo simulación. Resultado aleatorio: {result}"
            )

        return {
            "prediction": result,
            "confidence": confidence,
            "modelo_cargado": model is not None
        }

    except HTTPException:
        raise

    except Image.UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="No se pudo interpretar el archivo como imagen."
        )

    except Exception as e:
        print("❌ Error durante la predicción:", str(e))

        raise HTTPException(
            status_code=500,
            detail=f"Error durante la predicción: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )