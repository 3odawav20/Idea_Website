# livefree.support image editing runtime — 2026-11-02

The live browser sends image jobs to `/idea-accounts-api/platform.php`, not `/api/platform.php`. The included `idea-accounts-api/platform-ai.php` records the PHP adapter deployed through cPanel at `/home/lsenet5/public_html/idea-accounts-api/platform-ai.php`. This directory is a deployment record, not the newer repository frontend's `/api/visualize.php` adapter.

Runpod endpoint: `google-nano-banana-2-edit`, request `resolution: 1k`, PNG provider output. Existing application storage and downloads remain JPEG. Credentials stay in the private server configuration and are not included in this commit. Existing quotas are preserved.

Verified from the public website UI using a real uploaded bathroom image: jobs `14dec5752eba63e8b38cab4af68b7ded` and `0884104a54e791902d606a29c8279389` completed. The process responses confirmed `image_model: google-nano-banana-2-edit` and `adapter_revision: 20261102-nano-v1`. The final image was viewed and downloaded. Both walls and floor were tiled; doors, windows and exposed plumbing remained recognizable. The model removed floor debris, tools and a cardboard box, so exact preservation of all unselected content is not certified.

Operational limitation: synchronous requests have exhibited an InMotion 504 gateway timeout in another test. Asynchronous provider submission/status polling is still required for robust long-running work. The existing manual polygon compositor re-encodes JPEG; it does not provide pixel-exact preservation. Automatic segmentation and strict lossless composition are not implemented by this change.

Verified server rollback copy, outside the web root: `/home/lsenet5/idea-deploy-backups/idea-accounts-platform-ai.php.before-20261102`. It contains the prior runtime, with its original quotas and Qwen endpoint. Restore only this file to roll back the model adapter; do not overwrite private configuration or databases.
