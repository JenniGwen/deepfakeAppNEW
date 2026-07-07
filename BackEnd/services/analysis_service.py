import os
import cv2
import numpy as np
import onnxruntime as ort
import time
from scipy import ndimage
from core.db_connector import get_db

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CNN_PATH = os.path.join(BASE_DIR, "ml_models", "cnn_features_v5.onnx")
SVM_PATH = os.path.join(BASE_DIR, "ml_models", "rbf_svm_v5.onnx")

cnn = None
svm = None
CNN_INPUT = None

try:
    if not os.path.exists(CNN_PATH) or not os.path.exists(SVM_PATH):
        print(f"❌ File model tidak ditemukan.")
    else:
        cnn = ort.InferenceSession(CNN_PATH, providers=['CPUExecutionProvider'])
        svm = ort.InferenceSession(SVM_PATH, providers=['CPUExecutionProvider'])
        CNN_INPUT = cnn.get_inputs()[0].name
        print(f"✅ V5 ONNX models loaded successfully.")
except Exception as e:
    print(f"❌ Gagal memuat ONNX model: {e}")

FAKE_IDX = 1
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
FFT_SIZE = 256

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def crop_face(image_bgr):
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=8, minSize=(80, 80)
    )
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        pad = int(0.10 * min(w, h))
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2 = min(image_bgr.shape[1], x + w + pad)
        y2 = min(image_bgr.shape[0], y + h + pad)
        return image_bgr[y1:y2, x1:x2]
    return image_bgr

def _azimuthal(spec):
    h, w = spec.shape
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    r = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2).astype(int)
    return ndimage.mean(spec, labels=r, index=np.arange(0, min(cy, cx)))

def extract_features(img_bgr):
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    r = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_LINEAR)
    norm = (r.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    t3 = norm.transpose(2, 0, 1)

    gray224 = cv2.cvtColor(r, cv2.COLOR_RGB2GRAY).astype(np.float32)
    fs0 = np.fft.fftshift(np.fft.fft2(gray224))
    ps = np.log1p(np.abs(fs0) ** 2)
    ps = (ps - ps.min()) / (ps.max() - ps.min() + 1e-8)
    fft_ch = ps.astype(np.float32)[None, :, :]

    x = np.concatenate([t3, fft_ch], axis=0)[None, :].astype(np.float32)
    cnn_feat = cnn.run(None, {CNN_INPUT: x})[0]

    g = cv2.resize(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY),
                   (FFT_SIZE, FFT_SIZE)).astype(np.float32)
    fs = np.fft.fftshift(np.fft.fft2(g))
    az = _azimuthal(np.log1p(np.abs(fs) ** 2)).astype(np.float32)

    ns = g - cv2.GaussianBlur(g, (5, 5), 1.0)
    nfs = np.fft.fftshift(np.fft.fft2(ns))
    nz = _azimuthal(np.log1p(np.abs(nfs) ** 2)).astype(np.float32)

    feat = np.concatenate([cnn_feat[0], az, nz]).astype(np.float32)[None, :]
    return feat

def run_deepfake_analysis(file_bytes):
    start_time = time.time()
    face_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if face_bgr is None:
        raise ValueError("Invalid image format")

    cropped = crop_face(face_bgr)
    feat = extract_features(cropped)

    label, proba = svm.run(["label", "probabilities"], {"float_input": feat})
    proba = np.asarray(proba)[0]

    prob_fake = float(proba[FAKE_IDX])
    prob_real = float(proba[1 - FAKE_IDX])
    fake_percent = round(prob_fake * 100, 1)
    real_percent = round(prob_real * 100, 1)

    if prob_fake >= 0.5:
        final_result, confidence = "Deepfake", fake_percent
    else:
        final_result, confidence = "Real", real_percent

    print(f"P(fake): {fake_percent}% | Result: {final_result} ({confidence}%)")
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