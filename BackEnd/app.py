from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import onnxruntime as ort
from scipy import ndimage

app = Flask(__name__)
CORS(app)

# ============================================================
# MODELS
#   1) cnn_features_v5.onnx : image (1,4,224,224) -> features (1,1280)
#      (export dari best_model_v5.pth pakai FeatureExporter/get_features)
#   2) rbf_svm_v5.onnx      : features (1,1536) -> label + probabilities[2]
#      (StandardScaler SUDAH nyatu di dalam model ini)
# ============================================================
CNN_PATH = "ml_models/cnn_features_v5.onnx"
SVM_PATH = "ml_models/rbf_svm_v5.onnx"

cnn = ort.InferenceSession(CNN_PATH, providers=['CPUExecutionProvider'])
svm = ort.InferenceSession(SVM_PATH, providers=['CPUExecutionProvider'])

CNN_INPUT = cnn.get_inputs()[0].name    # 'input'
print(f"✅ Loaded {CNN_PATH} + {SVM_PATH}")

# Kelas: 0 = Real, 1 = Fake  (predict_proba[:,1] = P(fake) di notebook)
FAKE_IDX = 1

# ============================================================
# CONSTANTS (persis dari notebook)
# ============================================================
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
FFT_SIZE = 256

# ============================================================
# FACE CROPPER
# ============================================================
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

# ============================================================
# FEATURE EXTRACTION  — port EXACT dari extract_one() di notebook
# Menghasilkan vektor (1, 1536) = [1280 CNN | 128 az | 128 noise]
# ============================================================
def _azimuthal(spec):
    h, w = spec.shape
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    r = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2).astype(int)
    return ndimage.mean(spec, labels=r, index=np.arange(0, min(cy, cx)))

def extract_features(img_bgr):
    # ---- 1280: EfficientNet-B0 backbone (4-channel input) ----
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    r = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_LINEAR)
    norm = (r.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    t3 = norm.transpose(2, 0, 1)                              # (3,224,224)

    gray224 = cv2.cvtColor(r, cv2.COLOR_RGB2GRAY).astype(np.float32)
    fs0 = np.fft.fftshift(np.fft.fft2(gray224))
    ps = np.log1p(np.abs(fs0) ** 2)
    ps = (ps - ps.min()) / (ps.max() - ps.min() + 1e-8)
    fft_ch = ps.astype(np.float32)[None, :, :]               # (1,224,224)

    x = np.concatenate([t3, fft_ch], axis=0)[None, :].astype(np.float32)  # (1,4,224,224)
    cnn_feat = cnn.run(None, {CNN_INPUT: x})[0]              # (1,1280)

    # ---- 128: FFT azimuthal power spectrum (gray asli -> 256) ----
    g = cv2.resize(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY),
                   (FFT_SIZE, FFT_SIZE)).astype(np.float32)
    fs = np.fft.fftshift(np.fft.fft2(g))
    az = _azimuthal(np.log1p(np.abs(fs) ** 2)).astype(np.float32)

    # ---- 128: FFT azimuthal dari noise residual ----
    ns = g - cv2.GaussianBlur(g, (5, 5), 1.0)
    nfs = np.fft.fftshift(np.fft.fft2(ns))
    nz = _azimuthal(np.log1p(np.abs(nfs) ** 2)).astype(np.float32)

    # ---- gabung: HARUS urut [cnn, az, nz] ----
    feat = np.concatenate([cnn_feat[0], az, nz]).astype(np.float32)[None, :]  # (1,1536)
    return feat

# ============================================================
# ROUTES
# ============================================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "SynthScan Neural Engine is awake and ready!",
        "version": "3.0 (CNN+SVM)"
    }), 200

@app.route('/api/scan', methods=['POST'])
def scan_image():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file_bytes = np.frombuffer(request.files['file'].read(), np.uint8)
    img_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return jsonify({"status": "error", "message": "Invalid image format"}), 400

    try:
        cropped = crop_face(img_bgr)
        feat = extract_features(cropped)                     # (1,1536)

        label, proba = svm.run(["label", "probabilities"], {"float_input": feat})
        proba = np.asarray(proba)[0]                         # [P(real), P(fake)]

        prob_fake = float(proba[FAKE_IDX])
        prob_real = float(proba[1 - FAKE_IDX])
        fake_percent = round(prob_fake * 100, 1)
        real_percent = round(prob_real * 100, 1)

        if prob_fake >= 0.5:
            final_result, confidence = "Deepfake", fake_percent
        else:
            final_result, confidence = "Real", real_percent

        print(f"P(fake): {fake_percent}% | Result: {final_result} ({confidence}%)")

        return jsonify({
            "status": "success",
            "result": final_result,
            "probability": confidence,
            "probability_fake": round(prob_fake * 100, 2),
            "probability_real": round(prob_real * 100, 2)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=7860)