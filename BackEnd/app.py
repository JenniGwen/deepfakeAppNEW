from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import onnxruntime as ort
import time

def numpy_softmax(x):
    """Converts raw neural network math into percentages that add up to 1.0"""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=1, keepdims=True)

app = Flask(__name__)
CORS(app)

# Boot up the ONNX Neural Engine
MODEL_PATH = "deepfake_detector.onnx" # Make sure this file is in your BackEnd folder!
session = ort.InferenceSession(MODEL_PATH)
# --- FACE CROPPER SETUP ---
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def crop_face(image_bgr):
    """Finds the largest face in the image and crops it with a 10% padding"""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    
    if len(faces) > 0:
        # Grab the largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        # Add a 10% padding just like your teammate's PyTorch notebook did!
        pad = int(0.10 * min(w, h))
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(image_bgr.shape[1], x + w + pad), min(image_bgr.shape[0], y + h + pad)
        return image_bgr[y1:y2, x1:x2]
    
    # If no face is found, just return the whole image and hope for the best
    return image_bgr

# Let's ask the model what it expects to eat!
input_names = [input.name for input in session.get_inputs()]
print("The ONNX model is expecting these inputs:", input_names)

# --- FREQUENCY EXTRACTION MATH (From the PyTorch Notebook) ---
IMG_SIZE = (256, 256)
_rows, _cols = IMG_SIZE[1], IMG_SIZE[0]
_cy, _cx = _rows // 2, _cols // 2
_MAX_RADIUS = min(_cy, _cx)
_y, _x = np.ogrid[:_rows, :_cols]
_DIST = np.sqrt((_x - _cx)**2 + (_y - _cy)**2)
_RBINS = _DIST.astype(np.int32)
_LO = _DIST < _MAX_RADIUS * 0.2
_MI = (_DIST >= _MAX_RADIUS * 0.2) & (_DIST < _MAX_RADIUS * 0.6)
_HI = _DIST >= _MAX_RADIUS * 0.6

def _bs(v):
    m = v.mean(); s = v.std() + 1e-8; c = v - m
    return np.array([m, v.std(), np.mean(c**3)/s**3, np.mean(c**4)/s**4], dtype=np.float32)

def _az(ps, mr):
    mask = _RBINS < mr
    s = np.bincount(_RBINS[mask], weights=ps[mask], minlength=mr)
    c = np.bincount(_RBINS[mask], minlength=mr).astype(np.float32)
    c[c==0] = 1
    return (s/c).astype(np.float32)

def extract_freq(face_bgr):
    """Extracts exactly 152 frequency features for the ONNX model"""
    f = cv2.resize(face_bgr, IMG_SIZE)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32)
    dft = np.fft.fftshift(np.fft.fft2(g))
    ps = np.log1p(np.abs(dft)**2).astype(np.float32)
    r = _az(ps, _MAX_RADIUS)
    db = np.concatenate([_bs(ps[_LO]), _bs(ps[_MI]), _bs(ps[_HI])])
    dc = np.log1p(np.abs(cv2.dct(g))).astype(np.float32)
    h, w = dc.shape
    dcb = np.concatenate([_bs(dc[:h//4,:w//4].ravel()), _bs(dc[h//4:h//2,w//4:w//2].ravel()), _bs(dc[h//2:,w//2:].ravel())])
    return np.concatenate([r, db, dcb])

def preprocess_for_onnx(face_bgr, freq_features):
    # --- 1. PREPARE THE IMAGE ---
    # Resize to EfficientNet's expected 224x224
    face_resized = cv2.resize(face_bgr, (224, 224))
    
    # Convert BGR (OpenCV) to RGB (What the AI trained on)
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    
    # Scale pixel values from [0, 255] down to [0.0, 1.0]
    img_array = face_rgb.astype(np.float32) / 255.0
    
    # Apply the exact ImageNet Normalization the model expects
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_normalized = (img_array - mean) / std
    
    # Shift dimensions from (Height, Width, Channels) -> (Channels, Height, Width)
    img_transposed = np.transpose(img_normalized, (2, 0, 1))
    
    # Add a "batch" dimension -> Final shape: (1, 3, 224, 224)
    image_input = np.expand_dims(img_transposed, axis=0)
    
    # --- 2. PREPARE THE FREQUENCIES ---
    # Add a "batch" dimension to our 152 freq features -> Final shape: (1, 152)
    freq_input = np.expand_dims(freq_features, axis=0).astype(np.float32)
    
    return image_input, freq_input

@app.route('/', methods=['GET'])
def health_check():
    """The Front Door to prove the server is awake!"""
    return jsonify({
        "status": "online", 
        "message": "SynthScan Neural Engine is awake and ready!",
        "version": "1.0"
    }), 200

@app.route('/api/scan', methods=['POST'])
def scan_image():
    time.sleep(3)
    # 1. Catch the image from the React Frontend
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files['file']
    
    # Convert the uploaded file into an OpenCV image
    file_bytes = np.frombuffer(file.read(), np.uint8)
    face_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    if face_bgr is None:
        return jsonify({"status": "error", "message": "Invalid image format"}), 400

    try:
       # 1.5 CROP THE FACE FIRST!
        cropped_face = crop_face(face_bgr)
        
        # 2. Extract the 152 Frequency Features (Using the CROPPED face)
        freq_features = extract_freq(cropped_face) 
        
        # 3. Preprocess the data into the exact format ONNX demands
        image_input, freq_input = preprocess_for_onnx(cropped_face, freq_features)
        
        # 4. RUN THE NEURAL ENGINE!
        onnx_inputs = {
            'image': image_input,
            'freq_features': freq_input
        }
        raw_output = session.run(None, onnx_inputs)[0] 
        
        # 5. Convert raw math into human percentages
        probabilities = numpy_softmax(raw_output)[0]
        
        # Index 0 is Real, Index 1 is Fake (Based on how the model was trained)
        real_prob = float(probabilities[0]) * 100
        fake_prob = float(probabilities[1]) * 100
        
        # 6. Make the final decision
        if fake_prob > 50.0:
            final_result = "Deepfake"
            confidence = round(fake_prob, 1)
        else:
            final_result = "Real"
            confidence = round(real_prob, 1)
            
        # 7. Teleport the answer back to React!
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