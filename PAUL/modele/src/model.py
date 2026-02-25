"""
model.py – MONAI 3D U-Net for binary brain tumor segmentation.
"""

import torch
from monai.networks.nets import UNet


def get_model(
    in_channels: int = 4,
    out_channels: int = 1,
    features: tuple = (32, 64, 128, 256),
    device: str | torch.device = "cpu",
) -> UNet:
    """Create a MONAI 3D U-Net.

    Parameters
    ----------
    in_channels : int
        Number of input channels (4 = flair + t1 + t1ce + t2).
    out_channels : int
        Number of output channels (1 for binary segmentation).
    features : tuple
        Channel sizes at each encoder level.
    device : str or torch.device
        Device to place the model on.

    Returns
    -------
    model : UNet
    """
    model = UNet(
        spatial_dims=3,
        in_channels=in_channels,
        out_channels=out_channels,
        channels=features,
        strides=(2, 2, 2),
        num_res_units=2,
    )
    model = model.to(device)
    return model
