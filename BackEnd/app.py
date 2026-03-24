from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import onnxruntime as ort

app = Flask(__name__)
CORS(app)

# Load ONNX model
MODEL_PATH = "deepfake_detector_YUHUY.onnx"
session = ort.InferenceSession(MODEL_PATH)

# Print expected inputs on startup
input_names = [inp.name for inp in session.get_inputs()]
print("Model expects inputs:", input_names)

# Face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def crop_face(image_bgr):
    """Finds the largest face and crops it with 10% padding. Falls back to full image."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        pad = int(0.10 * min(w, h))
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image_bgr.shape[1], x + w + pad)
        y2 = min(image_bgr.shape[0], y + h + pad)
        return image_bgr[y1:y2, x1:x2]

    return image_bgr


def preprocess_for_onnx(face_bgr):
    """Builds the 4-channel fused tensor (RGB + FFT) expected by the model."""
    # Resize to 224x224
    face_resized = cv2.resize(face_bgr, (224, 224))

    # BGR -> RGB, normalize to [0,1]
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    img_array = face_rgb.astype(np.float32) / 255.0

    # ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_normalized = (img_array - mean) / std

    # FFT channel from grayscale
    gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY).astype(np.float32)
    dft = np.fft.fftshift(np.fft.fft2(gray))
    fft_channel = np.log1p(np.abs(dft))
    fft_channel = (fft_channel - fft_channel.mean()) / (fft_channel.std() + 1e-8)

    # Concatenate: (224, 224, 3) + (224, 224, 1) -> (224, 224, 4)
    fft_channel = np.expand_dims(fft_channel, axis=-1)
    fused = np.concatenate([img_normalized, fft_channel], axis=-1)

    # (224, 224, 4) -> (1, 4, 224, 224)
    fused = np.transpose(fused, (2, 0, 1))
    return np.expand_dims(fused, axis=0).astype(np.float32)


@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "IsItFake Neural Engine is awake and ready!",
        "version": "1.0"
    }), 200


@app.route('/api/scan', methods=['POST'])
def scan_image():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files['file']
    file_bytes = np.frombuffer(file.read(), np.uint8)
    image_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if image_bgr is None:
        return jsonify({"status": "error", "message": "Invalid image format"}), 400

    try:
        # Step 1: Crop face
        cropped_face = crop_face(image_bgr)

        # Step 2: Preprocess into 4-channel fused tensor
        image_input = preprocess_for_onnx(cropped_face)

        # Step 3: Run ONNX inference
        raw_output = session.run(None, {'image_with_fft': image_input})[0]
        print("raw output:", raw_output)
        print("shape:", raw_output.shape)

        # Step 4: Parse output
        # Model uses sigmoid -> single value between 0 and 1
        raw_score = float(np.squeeze(raw_output))
        fake_prob = raw_score * 100
        real_prob = (1 - raw_score) * 100

        # Step 5: Final decision
        if fake_prob > 50.0:
            final_result = "Deepfake"
            confidence = round(fake_prob, 1)
        else:
            final_result = "Real"
            confidence = round(real_prob, 1)

        print(f"Result: {final_result} | Confidence: {confidence}%")

        return jsonify({
            "status": "success",
            "result": final_result,
            "probability": confidence
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)