from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import onnxruntime as ort
import time

app = Flask(__name__)
CORS(app)

# Boot up the ONNX Neural Engine
MODEL_PATH = "deepfake_detector_YUHUY.onnx"  # Your new model
session = ort.InferenceSession(MODEL_PATH)

# Check what the model expects
input_name = session.get_inputs()[0].name
input_shape = session.get_inputs()[0].shape
print(f"✅ Model loaded: {input_name} with shape {input_shape}")

# Face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def crop_face(image_bgr):
    """Finds the largest face and crops it with 10% padding."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        pad = int(0.10 * min(w, h))
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(image_bgr.shape[1], x + w + pad), min(image_bgr.shape[0], y + h + pad)
        return image_bgr[y1:y2, x1:x2]
    
    return image_bgr  # Return whole image if no face found


def create_fft_channel(image_bgr, size=224):
    """
    Create FFT power spectrum as 4th channel.
    This replaces the old 152-dim frequency features.
    """
    # Convert to grayscale and resize
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (size, size)).astype(np.float32)
    
    # Compute FFT
    f = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f)
    
    # Power spectrum (log-scaled)
    ps = np.log1p(np.abs(f_shift) ** 2)
    
    # Normalize to [0, 1]
    ps = (ps - ps.min()) / (ps.max() - ps.min() + 1e-8)
    
    return ps  # Shape: (224, 224)


def preprocess_image(image_bgr):
    """
    Preprocess for NEW model: 4-channel input (RGB + FFT)
    Returns shape: (1, 4, 224, 224)
    """
    # 1. Crop face
    face = crop_face(image_bgr)
    
    # 2. Resize to 224x224
    face_resized = cv2.resize(face, (224, 224))
    
    # 3. Convert BGR to RGB
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    
    # 4. Normalize to [0, 1]
    img_array = face_rgb.astype(np.float32) / 255.0
    
    # 5. Apply ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_normalized = (img_array - mean) / std
    
    # 6. Create FFT channel (4th channel)
    fft_channel = create_fft_channel(face_resized)  # Use cropped face
    
    # 7. Stack: RGB (3 channels) + FFT (1 channel) = 4 channels
    img_4ch = np.dstack([img_normalized, fft_channel])  # Shape: (224, 224, 4)
    
    # 8. Transpose to (C, H, W) and add batch dimension
    img_transposed = np.transpose(img_4ch, (2, 0, 1))  # Shape: (4, 224, 224)
    final_input = np.expand_dims(img_transposed, axis=0)  # Shape: (1, 4, 224, 224)
    
    return final_input.astype(np.float32)


@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "online", 
        "message": "SynthScan Neural Engine v2.0 is awake!",
        "model": "4-channel EfficientNet-B0 (RGB + FFT)",
        "version": "2.0"
    }), 200


@app.route('/api/scan', methods=['POST'])
def scan_image():
    # 1. Get uploaded file
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files['file']
    
    # 2. Convert to OpenCV image
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    if img_bgr is None:
        return jsonify({"status": "error", "message": "Invalid image format"}), 400

    try:
        # 3. Preprocess (NEW: single 4-channel input)
        model_input = preprocess_image(img_bgr)
        
        # 4. Run inference
        # NEW: Only one input, not two!
        # 4. Run inference
        raw_output = session.run(None, {input_name: model_input})[0]
        
        # 5. Convert to probability
        # Flatten safely grabs the number regardless of whether it's [2.4], [[2.4]], or just 2.4
        raw_val = float(np.array(raw_output).flatten()[0])
        
        prob_fake = 1 / (1 + np.exp(-raw_val))
        prob_real = 1 - prob_fake
        
        # 6. Determine result
        if prob_fake > 0.5:
            final_result = "Deepfake"
            confidence = round(prob_fake * 100, 1)
        else:
            final_result = "Real"
            confidence = round(prob_real * 100, 1)
        
        # 7. Return result
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