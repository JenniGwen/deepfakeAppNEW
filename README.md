---
title: Isitfake
emoji: 🔍
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 7860
---
# IsItFake?

**An intelligent deepfake media detection platform for ASEAN.**

Deepfakes are cheap to generate and increasingly hard to tell apart from real media, driving fraud, identity theft, and misinformation across Indonesia, Malaysia, and the wider ASEAN region. Most existing detectors are expensive, computationally heavy, or built for enterprise pipelines only, leaving ordinary users with no easy way to check what they see.

**IsItFake?** is a free, web-based deepfake detection platform. Anyone can upload an image and instantly get a probability score of whether it's real or AI-generated, powered by a lightweight hybrid CNN + classical machine learning pipeline that runs entirely on CPU.

## Main Features

- **Instant probability score**: Upload an image through the web app and get a real/fake probability in seconds, no technical knowledge required.
- **Privacy by design**: Uploaded media is processed for detection only and is never stored, keeping the platform low-risk and low-cost to run.
- **Enterprise model licensing**: The trained detection model can be licensed to enterprises and government bodies for integration into their own pipelines.
- **Built for real-world media**: Trained to stay robust on the degraded, recompressed images typical of sharing on WhatsApp and Telegram.
- **Regional & multilingual**: Launching in Bahasa Indonesia and English, with Malay planned as the platform scales across ASEAN.

## Technology Used

**Frontend**
- React (Vite)
- CSS / HTML

**Backend**
- Python

**AI / Machine Learning**
- PyTorch: model training and fine-tuning
- OpenCV & Albumentations: image preprocessing and augmentation
- EfficientNet-B0: CNN backbone, adapted to a 4-channel input
- 2D Discrete Fourier Transform (2D-DFT): frequency-domain feature extraction
- Scikit-learn: classical ML classifiers (Random Forest, SVM) and feature scaling
- ONNX Runtime: fast, CPU-only inference at serving time

**Training infrastructure**
- Google Colab with an NVIDIA Tesla T4 GPU
- Dataset: 120,000 images from 10 sources spanning 11 manipulation methods, split 70/15/15 with a leakage-free identity split

## AI Model Pipeline

The detection model combines spatial and frequency-domain evidence rather than relying on pixel patterns alone, since deepfakes leave behind spectral artifacts that persist even after compression.

```
Input face image (224×224 RGB)
        │
        ▼
┌───────────────────────────────┐        ┌───────────────────────────────────────┐
│  Spatial stream                │        │  Frequency stream                     │
│  RGB tensor, ImageNet-normalized│        │  Grayscale → 2D-DFT → power spectrum  │
│                                 │        │  → azimuthal average (128-dim)        │
│                                 │        │  + noise-residual spectrum (128-dim)  │
└───────────────────────────────┘        └───────────────────────────────────────┘
        │                                              │
        └─────────────────┬────────────────────────────┘
                           ▼
        4-channel input (3 RGB + 1 FFT power-spectrum channel)
                           │
                           ▼
    EfficientNet-B0, fine-tuned end-to-end then frozen
              as a feature extractor → 1280-dim CNN vector
                           │
                           ▼
     Concatenated with 256-dim frequency features
        → 1536-dim feature vector (StandardScaler-normalized)
                           │
                           ▼
     ┌─────────────────────┴─────────────────────┐
     ▼                     ▼                     ▼
Random Forest         Linear SVM             RBF SVM
92.97% accuracy       92.96% accuracy        92.74% accuracy
AUC 0.9757            AUC 0.9757             AUC 0.9727
     │                     │                     │
     └─────────────────────┴─────────────────────┘
                           ▼
              Real / Fake + probability score
```

**Result:** on a held-out test set of 18,000 images, the pipeline reaches up to **92.97% accuracy** and **0.9757 AUC**, with Random Forest giving the best accuracy and precision, and Linear SVM giving the best balance between false positives and false negatives.

## Team

Group Cerberus (BINUS University)
Aviel Aquino · Jennifer Gwen Tanadi · Jiovanny Lim
