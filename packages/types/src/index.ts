export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  namespace: string; // User or Organization namespace
  name: string;
  description: string | null;
  isPrivate: boolean;
  isOfficial: boolean; // Docker Official Image
  isVerified: boolean; // Verified Publisher
  pullCount: number;
  starCount: number;
  lastUpdated: string;
  readme: string | null;
  dockerfile: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  stars?: Star[];
  maintainerName?: string;
  maintainerAvatar?: string;
  categories?: string[];
  architectures?: string[]; // e.g. ["amd64", "arm64"]
  operatingSystems?: string[]; // e.g. ["linux", "windows"]
}

export interface Tag {
  id: string;
  repositoryId: string;
  name: string; // e.g. "latest", "20.10"
  digest: string;
  compressedSize: number;
  lastPushed: string;
  pushedBy: string | null;
  os: string; // e.g. "linux"
  arch: string; // e.g. "amd64"
  layers: number;
}

export interface Star {
  userId: string;
  repositoryId: string;
  createdAt: string;
}

export interface Pull {
  id: string;
  repositoryId: string;
  timestamp: string;
  pullCount: number;
}

export interface SecurityScanResult {
  vulnerabilityId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  packageName: string;
  installedVersion: string;
  fixedVersion: string | null;
  description: string | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string; // "PUSH", "PULL", "CREATE_REPO", "DELETE_REPO", "LOGIN"
  details: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  createdAt: string;
}

export interface SearchQuery {
  q?: string;
  type?: "all" | "official" | "verified" | "community";
  operatingSystem?: string[];
  architecture?: string[];
  sort?: "stars" | "pulls" | "updated";
  page?: number;
  limit?: number;
}
