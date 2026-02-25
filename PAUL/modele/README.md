# BraTS2020 — Segmentation de Tumeurs Cérébrales par U-Net 3D

Segmentation binaire (tumeur vs. fond) sur données IRM BraTS2020 avec **PyTorch + MONAI**.

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Structure du projet](#structure-du-projet)
3. [Installation](#installation)
4. [Données](#données)
5. [Utilisation](#utilisation)
6. [Pipeline de prétraitement](#pipeline-de-prétraitement)
7. [Métriques](#métriques)
8. [Troubleshooting](#troubleshooting)

---

## Prérequis

| Outil | Version minimum | Vérifier |
|-------|----------------|----------|
| **Python** | 3.10+ | `python --version` |
| **pip** | 21+ | `python -m pip --version` |
| **GPU NVIDIA** (recommandé) | CUDA 11.8+ | `nvidia-smi` |

> ⚠️ L'entraînement **fonctionne sur CPU** mais est très lent (~30 min/epoch vs ~2 min/epoch sur GPU).

---

## Structure du projet

```
archive/
├── pipeline_service.py          # Prétraitement (canonicalize, normalize, crop, pad, stack 4ch)
├── requirements.txt             # Dépendances Python
├── README.md                    # Ce fichier
├── src/
│   ├── __init__.py
│   ├── dataset.py               # Scan dossiers patients, split par patient, PyTorch Dataset
│   ├── preprocess.py            # Wrapper autour de pipeline_service
│   ├── model.py                 # MONAI 3D U-Net (in_channels=4, out_channels=1)
│   ├── utils.py                 # Seed, logging, métriques (Dice, IoU, Precision, Recall, HD95)
│   ├── train.py                 # Boucle d'entraînement + validation + checkpointing
│   ├── infer.py                 # Inférence + export NIfTI + PNG
│   ├── visualize.py             # Visualisation interactive des données / prédictions
│   └── preprocess_all.py        # Prétraitement offline → .npz compressés
├── BraTS2020_TrainingData/
│   └── MICCAI_BraTS2020_TrainingData/
│       └── BraTS20_Training_XXX/    # 369 patients (flair, t1, t1ce, t2, seg)
└── BraTS2020_ValidationData/
    └── MICCAI_BraTS2020_ValidationData/
        └── BraTS20_Validation_YYY/  # 125 patients (flair, t1, t1ce, t2, PAS de seg)
├── data_preprocessed/               # (optionnel) données pré-traitées .npz
│   ├── train/                       # Généré par preprocess_all.py
│   └── val/
```

---

## Installation

Ouvrir **PowerShell**, se placer dans le dossier `archive/` :

```powershell
cd "C:\chemin\vers\archive"
```

### Étape 1 — Installer PyTorch (avec support GPU si NVIDIA disponible)

```powershell
# Avec GPU NVIDIA (CUDA 12.1) — recommandé :
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# OU sans GPU (CPU uniquement) :
python -m pip install torch torchvision
```

### Étape 2 — Installer les autres dépendances

```powershell
python -m pip install -r requirements.txt
```

### Étape 3 — Vérifier l'installation

```powershell
python -c "import torch; print('PyTorch', torch.__version__); print('CUDA:', torch.cuda.is_available())"
python -c "import monai; print('MONAI', monai.__version__)"
python -c "import nibabel; print('nibabel', nibabel.__version__)"
```

Vous devriez voir les versions s'afficher sans erreur. `CUDA: True` si GPU disponible.

---

## Données

Le dataset **BraTS2020** doit être dans `archive/`. Chaque patient contient 5 fichiers NIfTI :

| Fichier | Description |
|---------|-------------|
| `*_flair.nii` | IRM FLAIR |
| `*_t1.nii` | IRM T1 |
| `*_t1ce.nii` | IRM T1 avec agent de contraste |
| `*_t2.nii` | IRM T2 |
| `*_seg.nii` | Masque de segmentation (uniquement training) |

Les modalités sont détectées automatiquement par le **dernier token** du nom de fichier (après `_`, avant `.nii`).

---

## Utilisation

Toutes les commandes se lancent depuis le dossier `archive/`.

### 🔍 Visualiser les données d'un patient

```powershell
python src/visualize.py --patient_dir "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData/BraTS20_Training_001"
```

Affiche les 4 modalités + le masque ground truth sur 5 coupes axiales.

### ⚡ Étape 1 — Prétraitement offline (une seule fois)

Prétraiter toutes les données et sauvegarder en `.npz` compressé :

```powershell
# Training data
python src/preprocess_all.py `
    --data_root "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData" `
    --out_dir "data_preprocessed/train" `
    --target_shape 160 160 128

# Validation data
python src/preprocess_all.py `
    --data_root "BraTS2020_ValidationData/MICCAI_BraTS2020_ValidationData" `
    --out_dir "data_preprocessed/val" `
    --target_shape 160 160 128
```

Avantages :
- **3-5× moins d'espace disque** que les `.nii` bruts
- **5-10× plus rapide** par epoch (pas de rechargement NIfTI + pipeline)
- Après prétraitement, les dossiers `BraTS2020_*Data/` peuvent être supprimés

### 🧪 Étape 2a — Test rapide (vérifier que tout fonctionne)

```powershell
python src/train.py `
    --preprocessed_dir "data_preprocessed/train" `
    --epochs 1 `
    --batch_size 1 `
    --roi_size 64 64 64 `
    --sample_pct 0.05 `
    --out_dir "outputs_test"
```

Utilise ~18 patients sur 1 epoch. Durée : **~2 min (GPU)** / **~10 min (CPU)**.

### 🏋️ Étape 2b — Entraînement complet

```powershell
python src/train.py `
    --preprocessed_dir "data_preprocessed/train" `
    --epochs 100 `
    --roi_size 96 96 96 `
    --batch_size 1 `
    --out_dir "outputs"
```

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `--preprocessed_dir` | Chemin vers les `.npz` prétraités | *obligatoire* |
| `--epochs` | Nombre d'epochs | 100 |
| `--batch_size` | Taille du batch | 1 |
| `--roi_size` | Taille du patch pour sliding window (D H W) | 96 96 96 |
| `--lr` | Learning rate | 1e-4 |
| `--patience` | Early stopping (epochs sans amélioration) | 15 |
| `--seed` | Graine pour reproductibilité | 42 |
| `--sample_pct` | Fraction de patients à utiliser | 1.0 |
| `--num_workers` | Workers DataLoader | 0 |

**Sorties** dans `outputs/` :
- `best.pt` — meilleur modèle (par val Dice)
- `last.pt` — dernier checkpoint
- `train.log` — logs complets

### 🔮 Inférence sur les données de validation

```powershell
python src/infer.py `
    --data_root "BraTS2020_ValidationData/MICCAI_BraTS2020_ValidationData" `
    --ckpt "outputs/best.pt" `
    --out_dir "outputs/preds"
```

**Sorties** par patient dans `outputs/preds/` :
- `<patient_id>_pred.nii.gz` — masque binaire prédit
- `png/<patient_id>_sliceXXX.png` — visualisation FLAIR + overlay (5 coupes)

### 📊 Visualiser les prédictions vs ground truth

```powershell
python src/visualize.py `
    --patient_dir "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData/BraTS20_Training_001" `
    --pred_path "outputs/preds/BraTS20_Training_001_pred.nii.gz"
```

---

## Pipeline de prétraitement

```
NIfTI brut (4 modalités)
    │
    ├─ pipeline_0 : Orientation canonique (RAS) + resampling 1mm iso + normalisation intensité
    │
    └─ pipeline_1 : Crop foreground → Pad to target_shape → Center crop exact → Stack 4 canaux
                                                                                    │
                                                                          Tensor (4, D, H, W)
```

**Labels BraTS** : `{0, 1, 2, 4}` → convertis en **binaire** : toute tumeur (1, 2 ou 4) → 1, fond → 0.

---

## Métriques

| Métrique | Description |
|----------|-------------|
| **Dice** (principal) | Mesure de recouvrement entre prédiction et ground truth |
| **IoU / Jaccard** | Intersection sur Union |
| **Precision** | TP / (TP + FP) pour la classe tumeur |
| **Recall** | TP / (TP + FN) pour la classe tumeur |
| **HD95** | Distance de Hausdorff au 95e percentile (mm) |

L'évaluation se fait sur **volumes complets** via `sliding_window_inference` (pas sur des patches isolés).

---

## Troubleshooting

| Problème | Solution |
|----------|----------|
| **`CUDA out of memory`** | Réduire `--roi_size` (ex: `64 64 64`) et/ou `--target_shape` (ex: `128 128 96`) |
| **`torch.cat` shape mismatch** | Vérifier que `--target_shape` est divisible par 8 sur chaque dimension |
| **`ModuleNotFoundError: No module named 'torch'`** | Relancer `pip install -r requirements.txt` |
| **`FileNotFoundError: Training root not found`** | Vérifier le chemin et lancer depuis le dossier `archive/` |
| **Patient skipped (missing modalities)** | Normal si un fichier `.nii` manque dans le dossier patient |
| **Dice très bas (< 0.1) après 1 epoch** | Normal, il faut ~20-50 epochs pour converger |
| **Entraînement très lent** | Installer PyTorch avec CUDA : `pip install torch --index-url https://download.pytorch.org/whl/cu121` |
| **`CUDA: False` alors que GPU NVIDIA présent** | Réinstaller PyTorch avec la bonne version CUDA |

---

## Auteurs

Projet PFE — B3IA, 2026.
