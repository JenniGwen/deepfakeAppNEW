from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import onnxruntime as ort

app = Flask(__name__)
CORS(app)

# ============================================================
# LOAD ONNX MODEL
# ============================================================
MODEL_PATH = "best_model.onnx"
session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name
print(f"ONNX model loaded: {MODEL_PATH}")

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
# ROUTES
# ============================================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "SynthScan Neural Engine is awake and ready!",
        "version": "2.0 (ONNX)"
    }), 200


@app.route('/api/scan', methods=['POST'])
def scan_image():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files['file']
    file_bytes = np.frombuffer(file.read(), np.uint8)
    face_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if face_bgr is None:
        return jsonify({"status": "error", "message": "Invalid image format"}), 400

    try:
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

        print(f"Logit: {logit:.4f} | P(fake): {fake_percent}% | Result: {final_result} ({confidence}%)")

        return jsonify({
            "status": "success",
            "result": final_result,
            "probability": confidence,
            "probability_fake": round(prob_fake * 100, 2),
            "probability_real": round(prob_real * 100, 2)
        })

    except Exception as e:
        print("ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)