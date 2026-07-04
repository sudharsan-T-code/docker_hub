import { Router, Request, Response } from "express";
import prisma from "../db";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Base OCI V2 check
router.get("/", (req, res) => {
  res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
  res.status(200).json({ status: "OK", service: "Docker Hub Clone OCI Simulator" });
});

// List tags for repository
router.get("/:namespace/:name/tags/list", async (req, res) => {
  const { namespace, name } = req.params;

  try {
    const repository = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } },
      include: { tags: true }
    });

    if (!repository) {
      return res.status(404).json({ errors: [{ code: "NAME_UNKNOWN", message: "repository not found" }] });
    }

    const tags = repository.tags.map((t: any) => t.name);
    res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
    res.json({
      name: `${namespace}/${name}`,
      tags
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET manifest (simulates docker pull manifest check)
router.get("/:namespace/:name/manifests/:reference", async (req, res) => {
  const { namespace, name, reference } = req.params;

  try {
    const repository = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } },
      include: { tags: true }
    });

    if (!repository) {
      return res.status(404).json({ errors: [{ code: "NAME_UNKNOWN", message: "repository not found" }] });
    }

    // Find by tag or digest
    const tag = repository.tags.find((t: any) => t.name === reference || t.digest === reference);
    if (!tag) {
      return res.status(404).json({ errors: [{ code: "MANIFEST_UNKNOWN", message: "manifest not found" }] });
    }

    // Increment pull metrics in DB!
    await prisma.$transaction([
      prisma.repository.update({
        where: { id: repository.id },
        data: { pullCount: { increment: 1 } }
      }),
      prisma.pull.create({
        data: {
          repositoryId: repository.id,
          pullCount: 1
        }
      })
    ]);

    // Send mock schema2 manifest response
    const mockManifest = {
      schemaVersion: 2,
      mediaType: "application/vnd.docker.distribution.manifest.v2+json",
      config: {
        mediaType: "application/vnd.docker.container.image.v1+json",
        size: 1510,
        digest: "sha256:config8f14e8a71bca452109848f14e8a71bca45210984"
      },
      layers: Array.from({ length: tag.layers }).map((_, i) => ({
        mediaType: "application/vnd.docker.image.rootfs.diff.tar.gzip",
        size: Math.floor(tag.compressedSize / tag.layers),
        digest: `sha256:layer${i}ab${tag.digest.substring(12, 32)}`
      }))
    };

    res.setHeader("Content-Type", "application/vnd.docker.distribution.manifest.v2+json");
    res.setHeader("Docker-Content-Digest", tag.digest);
    res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
    res.json(mockManifest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT manifest (simulates docker push manifest upload)
router.put("/:namespace/:name/manifests/:reference", async (req, res) => {
  const { namespace, name, reference } = req.params;
  const manifestBody = req.body;

  try {
    let repository = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } }
    });

    // Auto-create repository if not exists (simulates docker push behavior)
    if (!repository) {
      repository = await prisma.repository.create({
        data: {
          namespace,
          name,
          description: `Automatically pushed repository for ${namespace}/${name}`,
          isPrivate: false,
          isOfficial: false,
          isVerified: false,
        }
      });
    }

    const digest = manifestBody.config?.digest || `sha256:digest${uuidv4().replace(/-/g, "")}`;
    const layersCount = manifestBody.layers?.length || 4;
    const totalSize = manifestBody.layers?.reduce((acc: number, l: any) => acc + (l.size || 5000000), 0) || 45000000;

    // Create or update tag
    const tag = await prisma.tag.upsert({
      where: {
        repositoryId_name: {
          repositoryId: repository.id,
          name: reference // e.g. "latest"
        }
      },
      update: {
        digest,
        compressedSize: totalSize,
        layers: layersCount,
        lastPushed: new Date()
      },
      create: {
        repositoryId: repository.id,
        name: reference,
        digest,
        compressedSize: totalSize,
        layers: layersCount,
        pushedBy: "docker-cli"
      }
    });

    res.setHeader("Docker-Content-Digest", digest);
    res.setHeader("Location", `/v2/${namespace}/${name}/manifests/${reference}`);
    res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
    res.status(201).json({ status: "Created", tag });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST initiate blob upload
router.post("/:namespace/:name/blobs/uploads/", async (req, res) => {
  const { namespace, name } = req.params;
  const uploadUuid = uuidv4();

  res.setHeader("Location", `/v2/${namespace}/${name}/blobs/uploads/${uploadUuid}`);
  res.setHeader("Range", "0-0");
  res.setHeader("Docker-Upload-UUID", uploadUuid);
  res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
  res.status(202).end();
});

// PATCH upload layer chunk
router.patch("/:namespace/:name/blobs/uploads/:uuid", (req, res) => {
  const { namespace, name, uuid } = req.params;

  res.setHeader("Location", `/v2/${namespace}/${name}/blobs/uploads/${uuid}`);
  res.setHeader("Range", "0-1000000"); // Mock size range
  res.setHeader("Docker-Upload-UUID", uuid);
  res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
  res.status(202).end();
});

// PUT finalize layer upload
router.put("/:namespace/:name/blobs/uploads/:uuid", (req, res) => {
  const { namespace, name, uuid } = req.params;
  const digest = req.query.digest as string || `sha256:${uuid.replace(/-/g, "")}`;

  res.setHeader("Location", `/v2/${namespace}/${name}/blobs/${digest}`);
  res.setHeader("Docker-Content-Digest", digest);
  res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
  res.status(201).end();
});

// GET download layer blob
router.get("/:namespace/:name/blobs/:digest", (req, res) => {
  res.setHeader("Docker-Distribution-API-Version", "registry/2.0");
  res.setHeader("Content-Type", "application/octet-stream");
  // Return dummy empty stream/bytes for layer mock
  res.status(200).send(Buffer.alloc(1024)); 
});

export default router;
