from collections import Counter
from pathlib import Path
from typing import Tuple

import nibabel as nib
import numpy as np
from nibabel.processing import resample_to_output, resample_from_to

def list_files(path : Path) -> list[Path]:
    return [p for p in path.iterdir() if p.is_file()]
def load_nifti(path : Path):
    """
    nii: has header + affine (metadata)
    data: the actual 3D array
    """
    nii = nib.load(str(path))
    data = nii.get_fdata(dtype=np.float32)
    return nii, data
def inspect_volume(name: str, nii):
    data = nii.get_fdata(dtype=np.float32)
    spacing = nii.header.get_zooms()[:3]   # (sx, sy, sz) in mm
    print(f"\n[{name}]")
    print("  shape:", data.shape)
    print("  spacing(mm):", spacing)
    print("  dtype:", data.dtype)
    """
    min/max -> smallest and largest voxel value in the volume
    why do we care ?
    Detect background convention
    - Many MRIs use 0 as background. Some use -1024, some use tiny noise.
    Catch broken scaling
    - If you expect MRI-like values and see min=-3e9, something is wrong.
    Differentiate image vs mask
    - Image: wide range (hundreds or thousands)
    - Mask: tiny discrete range (e.g. {0,1,2,3})

    Example
        min=0, max=2069 → looks like MRI intensity
        min=0, max=3 → almost certainly a segmentation mask
    """
    print("  min/max:", float(np.min(data)), float(np.max(data)))
    """
    mean / std
    What it is
        Average intensity and spread of intensities.
    
    Why you care
        This tells you about intensity distribution, which matters a lot in MRI.
        
    You use it to:
        Detect dataset shift between sources
        Decide normalization strategy
        Catch volumes that are:
            mostly empty
            saturated
            badly preprocessed
    
    Subtle but important
        MRI intensities are not standardized.
        So:
            Different scanners → different mean/std     
            Different sequences → wildly different stats
            
            That’s exactly why you inspect them.
    
    Example
        Dataset A: mean=80, std=180
        Dataset B: mean=400, std=900
            → if you don’t normalize, your model learns scanner identity instead of tumors.
    Do you need it?
        Yes to design preprocessing
        No to log every batch forever
    """
    print("  mean/std:", float(np.mean(data)), float(np.std(data)))
    print("  unique (mask-ish check):", np.unique(data)[:10])
class Patient:
    def __init__(self,patient_id,images):
        self.id = patient_id
        self.images = images #dict
    def get_modalities(self):
        return list(self.images.keys())
    def get_image(self,modality):
        return self.images.get(modality)
    
def load_patients(p_path : Path, sample_percentage : float = 1.0):
    #collect folder only
    patients_folder = [f for f in p_path.iterdir() if f.is_dir()]
    total = len(patients_folder)
    if total == 0 :
        return []
    #validate and get sample size
    if sample_percentage is None :
        sample_percentage = 1.0
    if not(0 < sample_percentage <= 1) :
        raise ValueError("sample_percentage must be in (0, 1].")
    sample_size = max(1,int(sample_percentage*total)) if sample_percentage < 1 else total

    #get patients
    patients = []
    for folder in patients_folder[:sample_size]:
        files = list_files(folder)
        dict_files = {}
        for file in files :
            try :
                dict_files[file.name] = nib.load(str(file))
            except :
                #skip file that's not .nii (nifti)
                continue
        patients.append(Patient(folder.name,dict_files))
    return patients
def get_img_by_type(images : dict,typeImg : str):
    fnames = list(images.keys())
    typeImg = typeImg.lower()
    files = []
    for fn in fnames :
        if typeImg in fn.lower() :
            #print(fn)
            files.append((fn,images[fn]))
        #print(fn)
    #t1ce_files = [images[fn] for fn in fnames if "t1ce" in fnames]
    if len(files) == 1 :
        return files[0]
    elif len(files) > 1 :
        raise ValueError(f"Multiple {typeImg}")
    else :
        raise ValueError(f"Missing/Negative {typeImg}")
    
def canonicalize_volume(
    image: nib.Nifti1Image,
    order: int = 1, #1 for image, 0 for mask (segmentation)
    template_ref: nib.Nifti1Image | None = None,
):
    """
    1) Reorient to closest canonical (RAS-like) using affine
    2) Resample either:
       - onto a reference grid (sample_ref) using resample_from_to, or
       - to a global voxel spacing (1,1,1) using resample_to_output

    order: interpolation order
      - 1 for images (linear)
      - 0 for masks (nearest)
    """
    out = nib.as_closest_canonical(image)

    if template_ref is not None:
        ref = nib.as_closest_canonical(template_ref)
        out = resample_from_to(out, ref, order=order)
    else:
        out = resample_to_output(out, voxel_sizes=(1.0, 1.0, 1.0), order=order)

    return out

def extract_metadata(image: nib.Nifti1Image, canonical: bool = True,
                     expect_axcodes=('R','A','S'),
                     affine_mismatch_tol: float = 1e-3):
    """
    Inspection helper:
    - Extract metadata (shape/spacing/fov/affine/origin)
    - Emit warnings if header/world-xform looks suspicious
    - Does NOT raise exceptions (inspection only)
    """

    report = {"warnings": [], "ok": True}
    img = image

    # 1) Basic header codes BEFORE canonical (useful diagnostic)
    qcode0 = int(img.header['qform_code'])
    scode0 = int(img.header['sform_code'])
    ax0 = nib.aff2axcodes(img.affine)

    if qcode0 == 0 and scode0 == 0:
        report["warnings"].append("NO_WORLD_XFORM: qform_code=0 and sform_code=0 (world mapping may be unreliable)")
        report["ok"] = False

    # 2) Optional: check qform vs sform disagreement (only if both exist)
    # (This is a warning, not a failure by itself.)
    if qcode0 > 0 and scode0 > 0:
        qaff = img.get_qform()
        saff = img.get_sform()
        if qaff is not None and saff is not None:
            diff = np.linalg.norm(qaff - saff)
            if diff > affine_mismatch_tol:
                report["warnings"].append(f"QFORM_SFORM_MISMATCH: ||qform-sform||={diff:.4g} (may indicate inconsistent headers)")

    # 3) Canonicalize if requested
    if canonical:
        img_can = nib.as_closest_canonical(img)
    else:
        img_can = img

    shape = img_can.shape[:3]
    spacing = img_can.header.get_zooms()[:3]
    affine = img_can.affine
    origin = affine[:3, 3]
    ax1 = nib.aff2axcodes(affine)
    fov_mm = (np.array(shape, dtype=np.float32) * np.array(spacing, dtype=np.float32)).tolist()

    # 4) After canonical checks
    if canonical and (ax1 != expect_axcodes):
        report["warnings"].append(f"AXCODES_AFTER_CANONICAL_UNEXPECTED: {ax1} (expected {expect_axcodes})")
        # not necessarily fatal, but suspicious
        report["ok"] = False

    # 5) Basic sanity checks
    if any(s <= 0 for s in spacing):
        report["warnings"].append(f"BAD_SPACING: spacing={spacing}")
        report["ok"] = False

    if any(d <= 0 for d in shape):
        report["warnings"].append(f"BAD_SHAPE: shape={shape}")
        report["ok"] = False

    # Pack results
    report.update({
        "shape": tuple(shape),
        "spacing": tuple(spacing),
        "fov_mm": tuple(fov_mm),
        "axcodes_before": ax0,
        "axcodes_after": ax1,
        "origin_mm": tuple(origin.tolist()),
        "affine": affine,
        "qform_code_before": qcode0,
        "sform_code_before": scode0,
    })

    return report

def compute_spatial_targets(patients : list[Patient]):
    def get_spacingMode(values, step=0.1):
        q = [tuple(round(v/step)*step for v in t) for t in values]
        return Counter(q).most_common(1)[0][0]
    def get_fovMode(fovs_mm, step=5.0):
        q = [tuple(int(round(v/step)*step) for v in f) for f in fovs_mm]
        return Counter(q).most_common(1)[0][0]
    def percentile_triplets(values, p=90):
        arr = np.array(values, dtype=np.float32)   # shape (N,3)
        return tuple(np.percentile(arr, p, axis=0).tolist())
    def shape_from_fov_and_spacing(fov_mm, spacing_mm):
        fov = np.array(fov_mm, dtype=np.float32)
        sp  = np.array(spacing_mm, dtype=np.float32)
        shape = np.ceil(fov / sp).astype(int)
        return tuple(shape.tolist())
    def get_originTarget(spacing:tuple,shape:tuple):
        spacing = np.array(spacing,dtype=np.float32)
        shape = np.array(shape,dtype=np.float32)
        return tuple((-0.5 * spacing * shape).tolist())#require further explaination on this calculation
    list_spacings = []
    list_fovs = []
    origin_target = None
    for patient in patients :
        for fname, image in patient.images.items():
            if not "seg" in fname.lower():
                metadata = extract_metadata(image=image)
                list_spacings.append(metadata["spacing"])
                list_fovs.append(metadata["fov_mm"])
                if origin_target is None :
                    origin_target = metadata["origin_mm"]
    spacingMode = get_spacingMode(list_spacings)
    fovP90 = percentile_triplets(list_fovs, p=90)
    shape_target = shape_from_fov_and_spacing(fovP90, spacingMode)
    #origin_target = get_originTarget(spacing=spacingMode, shape = shape_target)
    assert all(s > 0 for s in spacingMode), "Bad spacing target"
    assert all(n > 0 for n in shape_target), "Bad shape target"
    return {
        "spacing_target" : spacingMode,
        "fov_target" : fovP90,
        "shape_target" : shape_target,
        "origin_target" : origin_target
    }

def get_globalSpatialTemplate(patients : list[Patient]):
    spatialTargets = compute_spatial_targets(patients = patients)
    def make_affineRasTemplate(spacing_target, origin_mm=(0.0,0.0,0.0)):
        affine = np.eye(4,dtype=np.float32)
        affine[0,0] = spacing_target[0]
        affine[1,1] = spacing_target[1]
        affine[2,2] = spacing_target[2]
        affine[:3,3] = np.array(origin_mm,dtype=np.float32)
        return affine
    affine = make_affineRasTemplate(spacing_target = spatialTargets["spacing_target"],
                                   origin_mm = spatialTargets["origin_target"])
    data = np.zeros(spatialTargets["shape_target"], dtype=np.uint8)
    template_ref = nib.Nifti1Image(data,affine)
    return template_ref

def zscore_intensity(
    image: nib.Nifti1Image,
    epsilon: float = 1e-8
):
    #get mask
    data = image.get_fdata(dtype=np.float32)
    data[~np.isfinite(data)] = 0.0

    fg = data != 0
    if not np.any(fg) :
        out = nib.Nifti1Image(data.astype(np.float32), image.affine, header=image.header.copy())
        out.set_data_dtype(np.float32)
        return out

    #compute zscore
    mean = data[fg].mean()
    std = data[fg].std()

    data[fg] = (data[fg] - mean)/(std + epsilon)
    data[~fg] = 0.0
    data = data.astype(np.float32)

    out = nib.Nifti1Image(data,image.affine, header =  image.header.copy())
    out.set_data_dtype(np.float32)
    return out  

def pipeline_0(
    modalities : dict,
    template_ref_bool: bool = False,
    allowed_modality_types : set | None = None
):
    reference_shape_3d = None
    
    preprocessed_modalities = {}        

    template_ref = None
    if template_ref_bool :
        template_patient = Patient(patient_id = "", images = modalities)
        template_ref = get_globalSpatialTemplate(patients = [template_patient])
    
    if not allowed_modality_types is None :
        allowed_modalities = {}
        for typeImg in allowed_modality_types :
            fname,image = get_img_by_type(images=modalities, typeImg=typeImg)
            allowed_modalities[fname] = image
        modalities = allowed_modalities
    for fname,image in modalities.items():
        is_seg = True if "seg" in fname.lower() else False
        interpolation_order = 0 if is_seg else 1
        preprocessed_modalities[fname] = canonicalize_volume(
            image = image,
            order = interpolation_order,
            template_ref = template_ref
        )
        if not is_seg :
            preprocessed_modalities[fname] = normalize_intensity(preprocessed_modalities[fname])
        #check if shape match reference shape (first modal shape)
        if reference_shape_3d is None :
            reference_shape_3d = preprocessed_modalities[fname].shape[:3]#first 3dims
        else :
            if reference_shape_3d != preprocessed_modalities[fname].shape[:3]:
                return { 
                    "preprocessed" : None,
                    "error" : "Unmatched canonicalized shape [:3] within same multimodal"
                       }
        
    return {
        "preprocessed" : preprocessed_modalities,
        "success" : True
    }
def normalize_intensity(image: nib.Nifti1Image):
    #extract data and cast to np.float32
    data = image.get_fdata(dtype=np.float32)
    #set all voxels that has inf value to 0
    data[~np.isfinite(data)] = 0.0
    #foreground mask
    #we need mask because we don't want too much background voxels to be included in our calculation which can produce statistical error
    nonzero = data != 0
    if not np.any(nonzero):
        return nib.Nifti1Image(data.astype(np.float32), image.affine, header=image.header.copy())
    #Use only nonzero voxels to compute percentiles
    p1 = np.percentile(data[nonzero], 1)
    mask = (data > p1) & nonzero
    #clip outliers
    lo = np.percentile(data[mask],1)
    hi = np.percentile(data[mask],99)
    data = np.clip(data,lo,hi)
    #Recompute mask after clipping
    p1 = np.percentile(data[nonzero], 1)
    mask = (data > p1) & nonzero
    #apply background = 0
    data[~mask] = 0.0
    data = data.astype(np.float32)
    #wrap back in nifti
    out = nib.Nifti1Image(data, image.affine, header=image.header.copy())
    out.set_data_dtype(np.float32)
    return out
def crop(modalities:dict, margins = (10,10,10), threshold = 0):
    x_mins = []
    x_maxs = []
    y_mins = []
    y_maxs = []
    z_mins = []
    z_maxs = []
    preprocessed_modalities = {}
    for _,image in modalities.items():
        data = np.asanyarray(image.dataobj)
        fg = data > threshold
        if not np.any(fg):
            #nothing to crop
            continue
            #crop_slices = (slice(0,data.shape[0]),slice(0,data.shape[1]),slice(0,data.shape[2]))
            #return data,crop_slices
        xs,ys,zs = np.where(fg)
        mx,my,mz = margins
    
        x_mins.append(max(xs.min() - mx,0))
        x_maxs.append(min(xs.max() + mx + 1,data.shape[0]))
        y_mins.append(max(ys.min() - my,0))
        y_maxs.append(min(ys.max() + my + 1,data.shape[1]))
        z_mins.append(max(zs.min() - mz,0))
        z_maxs.append(min(zs.max() + mz + 1,data.shape[2]))

    if len(x_mins) == len(x_maxs) == len(y_mins) == len(y_maxs) == len(z_mins) == len(z_maxs) == 0 :
        for fname,image in modalities.items():
            data = np.asanyarray(image.dataobj)
            crop_slices = (slice(0,data.shape[0]),slice(0,data.shape[1]),slice(0,data.shape[2]))
            cropped = data[crop_slices]
            new_affine = image.affine.copy()
            cropped_nifti = nib.Nifti1Image(cropped, new_affine, header=image.header.copy())
            preprocessed_modalities[fname] = cropped_nifti
        return preprocessed_modalities,crop_slices
    
    x_min = min(x_mins)
    x_max = max(x_maxs)
    y_min = min(y_mins)
    y_max = max(y_maxs)
    z_min = min(z_mins)
    z_max = max(z_maxs)
    crop_slices = (slice(x_min,x_max),
                   slice(y_min,y_max),
                   slice(z_min,z_max))
    #get reference image to create new affine
    ref_image = None
    for fname, img in modalities.items():
        if "seg" not in fname.lower():
            ref_image = img
            break
    # fallback: if only seg exists, then just use it
    if ref_image is None:
        ref_image = next(iter(modalities.values()))
    new_affine = ref_image.affine.copy()
    new_affine[:3,3] = (ref_image.affine @ np.array([x_min,y_min,z_min,1.0]))[:3]

    for fname,image in modalities.items():
        data = np.asanyarray(image.dataobj)
        cropped = data[crop_slices]
        cropped_nifti = nib.Nifti1Image(cropped, new_affine, header=image.header.copy())
        preprocessed_modalities[fname] = cropped_nifti

    return preprocessed_modalities,crop_slices

def compute_pad_widths(modalities: dict, target_shape):
    ref_image = None
    for fname, img in modalities.items():
        if "seg" not in fname.lower():
            ref_image = img
            break
    if ref_image is None:
        ref_image = next(iter(modalities.values()))

    current_shape = ref_image.shape[:3]

    pad_widths = []
    for c, t in zip(current_shape, target_shape):
        diff = t - c
        if diff <= 0:
            pad_widths.append((0, 0))
        else:
            left = diff // 2
            right = diff - left
            pad_widths.append((left, right))

    return tuple(pad_widths)

def pipeline_1(
    modalities : dict,
    is_seg: bool = False,
    z_score_bool: bool = False,
    epsilon: float = 1e-8,
    margins: Tuple[int, int, int] = (10, 10, 10),
    threshold: float = 0,
    target_shape: Tuple[int, int, int] = (160, 160, 128),
    allowed_modality_types : set | None = None
):
    preprocessed_modalities = {}

    if not allowed_modality_types is None :
        allowed_modalities = {}
        for typeImg in allowed_modality_types :
            fname, image = get_img_by_type(images=modalities, typeImg=typeImg)
            allowed_modalities[fname] = image
        modalities = allowed_modalities

    # z-score (images only)
    if z_score_bool:
        for fname, image in modalities.items():
            if "seg" in fname.lower():
                preprocessed_modalities[fname] = image
            else:
                preprocessed_modalities[fname] = zscore_intensity(image, epsilon=epsilon)
    else:
        preprocessed_modalities = modalities

    # crop (dict -> dict)
    out, crop_slices = crop(preprocessed_modalities, margins=margins, threshold=threshold)

    # shared pad widths from a reference modality inside the dict
    pad_widths = compute_pad_widths(out, target_shape)

    # pad every modality, and update affine translation for left padding
    padded_modalities = {}
    pxL, pyL, pzL = pad_widths[0][0], pad_widths[1][0], pad_widths[2][0]
    shift_vox = np.array([-pxL, -pyL, -pzL, 1.0], dtype=np.float64)

    for fname, img in out.items():
        data = np.asanyarray(img.dataobj)

        padded = np.pad(data, pad_widths, mode="constant", constant_values=0)

        new_affine = img.affine.copy()
        new_affine[:3, 3] = (img.affine @ shift_vox)[:3]

        # keep dtype sensible: float32 for images, keep seg integer-ish
        if "seg" in fname.lower():
            padded_nifti = nib.Nifti1Image(padded, new_affine, header=img.header.copy())
        else:
            padded_nifti = nib.Nifti1Image(padded.astype(np.float32), new_affine, header=img.header.copy())
            padded_nifti.set_data_dtype(np.float32)

        padded_modalities[fname] = padded_nifti

    # build stacked tensor in fixed order: FLAIR, T1, T1CE, T2  (4 channels)
    def _find_by_suffix(mods: dict, suffix: str):
        """Match modality by the last token before .nii in the filename.
        E.g. suffix='t1' matches 'xxx_t1.nii' but NOT 'xxx_t1ce.nii'.
        """
        suffix_lower = suffix.lower()
        for fname, img in mods.items():
            stem = fname.lower().replace(".nii.gz", "").replace(".nii", "")
            last_token = stem.rsplit("_", 1)[-1]
            if last_token == suffix_lower:
                return fname, img
        return None, None

    REQUIRED_MODALITIES = ["flair", "t1", "t1ce", "t2"]
    found = {}
    missing = []
    for mod in REQUIRED_MODALITIES:
        fname, img = _find_by_suffix(padded_modalities, mod)
        if img is None:
            missing.append(mod)
        else:
            found[mod] = (fname, img)

    if missing:
        meta = {
            "crop_slices": crop_slices,
            "pad_widths": pad_widths,
            "target_shape": target_shape,
            "error": f"Missing required modalities for stacking: {missing}. "
                     f"Found: {list(found.keys())}."
        }
        return None, None, meta

    channels = []
    used_files = {}
    for mod in REQUIRED_MODALITIES:
        fname, img = found[mod]
        channels.append(np.asanyarray(img.dataobj).astype(np.float32, copy=False))
        used_files[mod] = fname

    x = np.stack(channels, axis=0)  # (C, D, H, W) with C=4

    # optional seg output
    seg_name, seg_img = _find_by_suffix(padded_modalities, "seg")
    y = None
    if seg_img is not None:
        y = np.asanyarray(seg_img.dataobj)
    used_files["seg"] = seg_name

    meta = {
        "crop_slices": crop_slices,
        "pad_widths": pad_widths,
        "target_shape": target_shape,
        "stack_order": REQUIRED_MODALITIES,
        "used_files": used_files,
    }

    return {"x" : x, "y" : y, "meta" : meta}
