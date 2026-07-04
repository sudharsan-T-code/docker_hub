import { Router, Response } from "express";
import prisma from "../db";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get My Organizations
router.get("/my", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        ownerId: req.user!.id
      },
      include: {
        teams: true
      }
    });
    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Organization
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, displayName, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization namespace name is required" });
    }

    const normalizedName = name.trim().toLowerCase();

    // Check if name is taken in users or orgs
    const takenInUser = await prisma.user.findUnique({ where: { username: normalizedName } });
    const takenInOrg = await prisma.organization.findUnique({ where: { name: normalizedName } });

    if (takenInUser || takenInOrg) {
      return res.status(400).json({ error: "Namespace is already in use by another user or organization" });
    }

    const org = await prisma.organization.create({
      data: {
        name: normalizedName,
        displayName: displayName || name,
        description,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${normalizedName}`,
        ownerId: req.user!.id
      }
    });

    // Create default "Owners" and "Developers" teams
    await prisma.team.create({
      data: {
        name: "Owners",
        description: "Full administrative access to the organization",
        orgId: org.id
      }
    });

    await prisma.team.create({
      data: {
        name: "Developers",
        description: "Can push and pull repositories",
        orgId: org.id
      }
    });

    res.status(201).json(org);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Organization Details
router.get("/:name", async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { name: req.params.name },
      include: {
        teams: true
      }
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(org);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Organization
router.put("/:name", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { name: req.params.name }
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (org.ownerId !== req.user!.id && req.user!.username !== "admin") {
      return res.status(403).json({ error: "Only the organization owner can edit it" });
    }

    const { displayName, description, avatarUrl } = req.body;

    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: {
        displayName: displayName !== undefined ? displayName : org.displayName,
        description: description !== undefined ? description : org.description,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : org.avatarUrl,
      }
    });

    res.json(updatedOrg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Teams management inside organization
router.post("/:name/teams", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamName, description } = req.body;
    if (!teamName) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const org = await prisma.organization.findUnique({
      where: { name: req.params.name }
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (org.ownerId !== req.user!.id && req.user!.username !== "admin") {
      return res.status(403).json({ error: "Only the organization owner can create teams" });
    }

    const existingTeam = await prisma.team.findUnique({
      where: {
        orgId_name: {
          orgId: org.id,
          name: teamName
        }
      }
    });

    if (existingTeam) {
      return res.status(400).json({ error: "Team already exists in organization" });
    }

    const team = await prisma.team.create({
      data: {
        name: teamName,
        description,
        orgId: org.id
      }
    });

    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
