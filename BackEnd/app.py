from flask import Flask, request
from flask_cors import CORS
import time
import numpy as np
import cv2
import joblib
from sklearn.preprocessing import StandardScaler
import os

app = Flask(__name__)
CORS(app)

svm_model = joblib.load("svm_model.pkl")

size = (256, 256) 
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
def extract_dft_features(image_path, img_size=size):
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    gray_detect = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_detect, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    if len(faces) > 0:
        # crop to the largest detected face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        img = img[y:y+h, x:x+w]
    # if no face detected, fall back to full image

    # Resize & grayscale
    img = cv2.resize(img, img_size)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # 2D-DFT (from spatial -> freq)
    dft_shift = np.fft.fftshift(np.fft.fft2(gray))

    # power spectrum (how strong each freq) 
    power_spectrum = np.log1p(np.abs(dft_shift)**2)

    # azimuthal avg (2D->1D)
    rows, cols = power_spectrum.shape
    center_y, center_x = (rows // 2, cols // 2)
    max_radius = min(center_y, center_x)

    y_coords, x_coords = np.ogrid[:rows, :cols]  # grid of y and x indices
    dist_map = np.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)  # distance of each pixel from center

    radial_profile = [
        power_spectrum[(dist_map >= r) & (dist_map < r + 1)].mean()
        for r in range(max_radius)
    ]

    low_mask  = dist_map < max_radius * 0.2
    mid_mask  = (dist_map >= max_radius * 0.2) & (dist_map < max_radius * 0.6)
    high_mask = dist_map >= max_radius * 0.6

    def band_stats(mask):
        vals = power_spectrum[mask]
        return np.array([
            vals.mean(), 
            vals.std(),
            float(np.mean((vals - vals.mean())**3) / (vals.std()**3 + 1e-8)),  # skewness
            float(np.mean((vals - vals.mean())**4) / (vals.std()**4 + 1e-8))   # kurtosis
        ])

    dft_band_features = np.concatenate([
        band_stats(low_mask), 
        band_stats(mid_mask), 
        band_stats(high_mask)
    ]) 
    dct = cv2.dct(gray)
    dct_log = np.log1p(np.abs(dct))

    h, w = dct_log.shape
    dct_low  = dct_log[:h//4,   :w//4]
    dct_mid  = dct_log[h//4:h//2, w//4:w//2]
    dct_high = dct_log[h//2:,   w//2:]

    def dct_band_stats(region):
        vals = region.flatten()
        return np.array([
            vals.mean(), 
            vals.std(),
            float(np.mean((vals - vals.mean())**3) / (vals.std()**3 + 1e-8)),
            float(np.mean((vals - vals.mean())**4) / (vals.std()**4 + 1e-8))
        ])

    dct_features = np.concatenate([
        dct_band_stats(dct_low), 
        dct_band_stats(dct_mid), 
        dct_band_stats(dct_high)
    ])  # 12 values

    return np.array(radial_profile)


@app.route('/api/scan', methods=['POST'])
def scan_image():
    # 1. Open the delivery box and grab the photograph
    file = request.files['file']
    
    # 2. Save it temporarily to the hard drive
    temp_path = "temp_scan.jpg"
    file.save(temp_path)
    
    # 3. Run your friend's complex math function
    features = extract_dft_features(temp_path)
    
    # 4. Clean up the evidence (delete the temporary file)
    os.remove(temp_path)
    
    # 5. Safety check: Did the face scanner fail?
    if features is None:
        return {"status": "error", "message": "Could not read image or find features."}
    
    # 6. Prepare the math for the SVM (from Cell #10)
    features = features.reshape(1, -1)
    
    pred = svm_model.predict(features)[0]
    prob = svm_model.predict_proba(features)[0][1]
    
    # 7. Package the final result to send back to React
    return {
        "status": "success", 
        "result": "Deepfake" if pred == 1 else "Real",
        "probability": round(float(prob) * 100, 2)
    }


    

if __name__ == '__main__':
    app.run(debug=True, port=5001)