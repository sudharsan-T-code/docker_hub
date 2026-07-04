import { Router, Response } from "express";
import prisma from "../db";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Search & List Repositories
router.get("/", async (req, res) => {
  try {
    const { q, type, operatingSystem, architecture, sort, page = "1", limit = "10" } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query clauses
    const whereClause: any = {};

    // 1. Text Query Search (name, namespace, or description)
    if (q) {
      const searchStr = q as string;
      whereClause.OR = [
        { name: { contains: searchStr, mode: "insensitive" } },
        { namespace: { contains: searchStr, mode: "insensitive" } },
        { description: { contains: searchStr, mode: "insensitive" } },
      ];
    }

    // 2. Type Filter (official, verified, community)
    if (type === "official") {
      whereClause.isOfficial = true;
    } else if (type === "verified") {
      whereClause.isVerified = true;
    } else if (type === "community") {
      whereClause.isOfficial = false;
      whereClause.isVerified = false;
    }

    // 3. Operating System Filter
    if (operatingSystem) {
      const osList = Array.isArray(operatingSystem) 
        ? (operatingSystem as string[]) 
        : [operatingSystem as string];
      whereClause.operatingSystems = { hasSome: osList };
    }

    // 4. Architecture Filter
    if (architecture) {
      const archList = Array.isArray(architecture) 
        ? (architecture as string[]) 
        : [architecture as string];
      whereClause.architectures = { hasSome: archList };
    }

    // 5. Sorting Options
    let orderBy: any = { lastUpdated: "desc" };
    if (sort === "stars") {
      orderBy = { starCount: "desc" };
    } else if (sort === "pulls") {
      orderBy = { pullCount: "desc" };
    } else if (sort === "updated") {
      orderBy = { lastUpdated: "desc" };
    }

    // Query DB
    const [repositories, totalCount] = await prisma.$transaction([
      prisma.repository.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limitNum,
        include: {
          tags: {
            take: 1, // Get latest tag preview
            orderBy: { lastPushed: "desc" }
          }
        }
      }),
      prisma.repository.count({ where: whereClause })
    ]);

    res.json({
      repositories,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Repository (Authenticated)
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, namespace, description, isPrivate, readme, dockerfile, categories, architectures, operatingSystems } = req.body;

    if (!name || !namespace) {
      return res.status(400).json({ error: "Name and Namespace are required" });
    }

    // Ensure user matches namespace OR they are admin
    if (req.user?.username !== namespace) {
      // Allow only if they are creating in their own namespace or admin (simplification)
      const isOrgOwner = await prisma.organization.findFirst({
        where: { name: namespace, ownerId: req.user?.id }
      });

      if (!isOrgOwner && req.user?.username !== "admin") {
        return res.status(403).json({ error: "Access denied. Cannot write to namespace: " + namespace });
      }
    }

    const existingRepo = await prisma.repository.findUnique({
      where: {
        namespace_name: { namespace, name }
      }
    });

    if (existingRepo) {
      return res.status(400).json({ error: "Repository already exists inside namespace" });
    }

    const repository = await prisma.repository.create({
      data: {
        name,
        namespace,
        description,
        isPrivate: !!isPrivate,
        readme: readme || `# ${namespace}/${name}\n\nYour docker image readme.`,
        dockerfile: dockerfile || "FROM alpine:latest\nCMD [\"echo\", \"Hello World!\"]",
        categories: categories || [],
        architectures: architectures || ["amd64"],
        operatingSystems: operatingSystems || ["linux"],
      }
    });

    // Create a default latest tag so there is something pulls refer to
    await prisma.tag.create({
      data: {
        repositoryId: repository.id,
        name: "latest",
        digest: `sha256:${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`,
        compressedSize: 1024 * 1024 * 12, // 12 MB
        os: "linux",
        arch: "amd64",
        layers: 2,
        pushedBy: req.user?.username || "unknown",
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        username: req.user!.username,
        action: "CREATE_REPO",
        details: `Created repository ${namespace}/${name}`,
      }
    });

    res.status(201).json(repository);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Specific Repository Detail
router.get("/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;

    const repository = await prisma.repository.findUnique({
      where: {
        namespace_name: { namespace, name }
      },
      include: {
        tags: {
          orderBy: { lastPushed: "desc" }
        },
        pulls: {
          orderBy: { timestamp: "asc" },
          take: 30
        }
      }
    });

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    res.json(repository);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Repository (Authenticated)
router.put("/:namespace/:name", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { namespace, name } = req.params;
    const { description, readme, dockerfile, isPrivate } = req.body;

    const repo = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } }
    });

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    // Auth validation
    if (req.user?.username !== namespace && req.user?.username !== "admin") {
      const isOrgOwner = await prisma.organization.findFirst({
        where: { name: namespace, ownerId: req.user?.id }
      });
      if (!isOrgOwner) {
        return res.status(403).json({ error: "Permission denied to update repository" });
      }
    }

    const updatedRepo = await prisma.repository.update({
      where: { id: repo.id },
      data: {
        description: description !== undefined ? description : repo.description,
        readme: readme !== undefined ? readme : repo.readme,
        dockerfile: dockerfile !== undefined ? dockerfile : repo.dockerfile,
        isPrivate: isPrivate !== undefined ? isPrivate : repo.isPrivate,
      }
    });

    res.json(updatedRepo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Star/Unstar Repository
router.post("/:namespace/:name/star", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { namespace, name } = req.params;
    const userId = req.user!.id;

    const repository = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } }
    });

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const existingStar = await prisma.star.findUnique({
      where: {
        userId_repositoryId: { userId, repositoryId: repository.id }
      }
    });

    let starred = false;
    if (existingStar) {
      // Unstar
      await prisma.star.delete({
        where: {
          userId_repositoryId: { userId, repositoryId: repository.id }
        }
      });
      starred = false;
    } else {
      // Star
      await prisma.star.create({
        data: {
          userId,
          repositoryId: repository.id
        }
      });
      starred = true;
    }

    // Recalculate starCount
    const starCount = await prisma.star.count({
      where: { repositoryId: repository.id }
    });

    const updatedRepo = await prisma.repository.update({
      where: { id: repository.id },
      data: { starCount }
    });

    res.json({ starred, starCount: updatedRepo.starCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Star status check
router.get("/:namespace/:name/star-status", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { namespace, name } = req.params;
    const userId = req.user!.id;

    const repository = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } }
    });

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const star = await prisma.star.findUnique({
      where: {
        userId_repositoryId: { userId, repositoryId: repository.id }
      }
    });

    res.json({ starred: !!star });
  } catch (error: any) {
    res.status(500).json({ error: 0 });
  }
});

// Delete Repository (Authenticated)
router.delete("/:namespace/:name", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { namespace, name } = req.params;

    const repo = await prisma.repository.findUnique({
      where: { namespace_name: { namespace, name } }
    });

    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    if (req.user?.username !== namespace && req.user?.username !== "admin") {
      const isOrgOwner = await prisma.organization.findFirst({
        where: { name: namespace, ownerId: req.user?.id }
      });
      if (!isOrgOwner) {
        return res.status(403).json({ error: "Permission denied" });
      }
    }

    await prisma.repository.delete({
      where: { id: repo.id }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        username: req.user!.username,
        action: "DELETE_REPO",
        details: `Deleted repository ${namespace}/${name}`,
      }
    });

    res.json({ message: "Repository successfully deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
