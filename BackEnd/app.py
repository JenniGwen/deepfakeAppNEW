from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import torch
import torch.nn as nn
import timm

app = Flask(__name__)
CORS(app)

# ============================================================
# MODEL ARCHITECTURE (exact copy from training notebook Cell 34)
# ============================================================
class DeepfakeDetector(nn.Module):
    def __init__(self, use_fft_channel=True):
        super().__init__()
        self.use_fft = use_fft_channel
        self.backbone = timm.create_model(
            'efficientnet_b0', pretrained=False, num_classes=0
        )

        if self.use_fft:
            old_conv = self.backbone.conv_stem
            new_conv = nn.Conv2d(
                4, old_conv.out_channels,
                kernel_size=old_conv.kernel_size,
                stride=old_conv.stride,
                padding=old_conv.padding,
                bias=old_conv.bias is not None
            )
            self.backbone.conv_stem = new_conv

        self.head = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(1280, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.head(features).squeeze(1)


# ============================================================
# LOAD THE TRAINED WEIGHTS
# ============================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "best_model.pth"

model = DeepfakeDetector(use_fft_channel=True)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()
print(f"Model loaded on {DEVICE}")
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")

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
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
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
    1. RGB 224x224 → ImageNet normalize → tensor
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
    img_tensor = torch.tensor(
        np.transpose(img_normalized, (2, 0, 1)), dtype=torch.float32
    )

    # --- FFT channel ---
    fft_ch = make_fft_channel(face_bgr, size=224)
    fft_tensor = torch.tensor(fft_ch, dtype=torch.float32).unsqueeze(0)

    # --- Combine: (4, 224, 224) -> (1, 4, 224, 224) ---
    combined = torch.cat([img_tensor, fft_tensor], dim=0).unsqueeze(0)
    return combined


# ============================================================
# ROUTES
# ============================================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "SynthScan Neural Engine is awake and ready!",
        "version": "2.0 (PyTorch)"
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
        # 1. Crop face
        cropped_face = crop_face(face_bgr)

        # 2. Preprocess (matching training notebook exactly)
        input_tensor = preprocess_image(cropped_face).to(DEVICE)

        # 3. Inference
        with torch.no_grad():
            logit = model(input_tensor)
            prob_fake = torch.sigmoid(logit).item()

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

        print(f"Logit: {logit.item():.4f} | P(fake): {fake_percent}% | Result: {final_result} ({confidence}%)")

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