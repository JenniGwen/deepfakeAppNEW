# File: BackEnd/app/services/analysis_service.py
import os

import cv2
import numpy as np
import onnxruntime as ort
import time

from core.db_connector import get_db

# ============================================================
# LOAD ONNX MODEL
# ============================================================

# Gunakan base directory agar path selalu benar dimanapun server dijalankan
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "best_model.onnx")

# Inisialisasi session sebagai None dulu agar tidak NameError
session = None
input_name = None
try:
    if not os.path.exists(MODEL_PATH):
        print(f"❌ File model tidak ditemukan di: {MODEL_PATH}")
    else:
        session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
        input_name = session.get_inputs()[0].name
        print(f"✅ ONNX model loaded successfully from: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Gagal memuat ONNX model: {e}")


# ============================================================
# FACE CROPPER
# ============================================================
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def crop_face(image_bgr):
    """Finds the largest face in the image and crops it with 10% padding"""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=8, minSize=(80, 80)
    )
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        pad = int(0.10 * min(w, h))
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image_bgr.shape[1], x + w + pad)
        y2 = min(image_bgr.shape[0], y + h + pad)
        return image_bgr[y1:y2, x1:x2]
    return image_bgr

# ============================================================
# PREPROCESSING (exact copy from training notebook Cell 27 + 37)
# ============================================================
def make_fft_channel(image_bgr, size=224):
    """
    Exact copy of training notebook's make_fft_channel.
    Power spectrum: log1p(|F|^2), normalized to [0,1].
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (size, size)).astype(np.float32)
    f = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f)
    ps = np.log1p(np.abs(f_shift) ** 2)
    ps = (ps - ps.min()) / (ps.max() - ps.min() + 1e-8)
    return ps

def preprocess_image(face_bgr):
    """
    Matches training notebook's predict_image() (Cell 37):
    1. RGB 224x224 -> ImageNet normalize -> numpy array
    2. FFT power spectrum channel
    3. Concatenate to 4 channels
    """
    # --- RGB channels ---
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    img_input = cv2.resize(face_rgb, (224, 224)).astype(np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_normalized = (img_input - mean) / std

    # (224,224,3) -> (3,224,224)
    img_chw = np.transpose(img_normalized, (2, 0, 1))

    # --- FFT channel ---
    fft_ch = make_fft_channel(face_bgr, size=224)
    fft_ch = np.expand_dims(fft_ch, axis=0)  # (1, 224, 224)

    # --- Combine: (4, 224, 224) -> (1, 4, 224, 224) ---
    combined = np.concatenate([img_chw, fft_ch], axis=0)
    combined = np.expand_dims(combined, axis=0).astype(np.float32)
    return combined

# ============================================================
# MAIN INFERENCE SERVICE
# ============================================================
def run_deepfake_analysis(file_bytes):
    start_time = time.time()

    face_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if face_bgr is None:
        raise ValueError("Invalid image format")

    # 1. Crop the largest face
    cropped_face = crop_face(face_bgr)

    # 2. Preprocess (matching training notebook exactly)
    input_array = preprocess_image(cropped_face)

    # 3. Inference
    logit = float(session.run(None, {input_name: input_array})[0][0])
    prob_fake = 1.0 / (1.0 + np.exp(-max(-50, min(50, logit))))

    prob_real = 1.0 - prob_fake
    fake_percent = round(prob_fake * 100, 1)
    real_percent = round(prob_real * 100, 1)

    # Training notebook: prob >= 0.5 = FAKE, prob < 0.5 = REAL
    if prob_fake >= 0.5:
        final_result = "Deepfake"
        confidence = fake_percent
    else:
        final_result = "Real"
        confidence = real_percent

    # Print logit persis seperti kode lamamu untuk debugging di terminal
    print(f"Logit: {logit:.4f} | P(fake): {fake_percent}% | Result: {final_result} ({confidence}%)")

    processing_time = round(time.time() - start_time, 2)

    return {
        "result": final_result,
        "probability": confidence,
        "probability_fake": round(prob_fake * 100, 2),
        "probability_real": round(prob_real * 100, 2),
        "processing_time": processing_time
    }

# ============================================================
# DATABASE INSERTION SERVICE
# ============================================================
def save_scan_history(user_id, file_name, result, confidence_score, processing_time):
    db = get_db()
    data = {
        "user_id": user_id,
        "file_name": file_name,
        "url_file": f"/uploads/{file_name}",
        "result": result,
        "confidence_score": confidence_score,
        "processing_time": processing_time
    }
    db.table("scan_histories").insert(data).execute()