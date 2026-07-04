import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean old data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.accessToken.deleteMany();
  await prisma.pull.deleteMany();
  await prisma.star.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@docker.clone",
      passwordHash,
      fullName: "System Admin",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop",
    },
  });

  const devUser = await prisma.user.create({
    data: {
      username: "john_doe",
      email: "john@docker.clone",
      passwordHash,
      fullName: "John Doe",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop",
    },
  });

  const dockerUser = await prisma.user.create({
    data: {
      username: "docker",
      email: "docker@docker.clone",
      passwordHash,
      fullName: "Docker Official Team",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop",
    },
  });

  console.log("Users created.");

  // Create Orgs
  const libraryOrg = await prisma.organization.create({
    data: {
      name: "library",
      displayName: "Official Library",
      description: "Official Docker Hub core repository library",
      ownerId: admin.id,
      avatarUrl: "https://assets.docker.com/logos/docker-logo-blue.svg",
    },
  });

  const bitnamiOrg = await prisma.organization.create({
    data: {
      name: "bitnami",
      displayName: "Bitnami by VMware",
      description: "Verified packages and secure container solutions",
      ownerId: admin.id,
      avatarUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop",
    },
  });

  const circleciOrg = await prisma.organization.create({
    data: {
      name: "circleci",
      displayName: "CircleCI",
      description: "Continuous integration and delivery containers",
      ownerId: admin.id,
      avatarUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=80&auto=format&fit=crop",
    },
  });

  console.log("Organizations created.");

  // Repositories Data
  const repos = [
    {
      namespace: "library",
      name: "ubuntu",
      description: "Ubuntu is a Debian-based Linux operating system, with desktop, server, and cloud editions.",
      isPrivate: false,
      isOfficial: true,
      isVerified: false,
      pullCount: 12500000,
      starCount: 15420,
      categories: ["Operating Systems", "Base Images"],
      architectures: ["amd64", "arm64", "arm32v7", "ppc64le", "s390x"],
      operatingSystems: ["linux"],
      readme: `# Ubuntu Official Image

Ubuntu is a complete Linux operating system, freely available with both community and professional support.

## How to use this image

### Run Ubuntu interactive shell:
\`\`\`bash
docker run -it ubuntu:latest bash
\`\`\`

### Update packages inside:
\`\`\`bash
apt-get update && apt-get upgrade -y
\`\`\`
`,
      dockerfile: `FROM scratch
ADD ubuntu-noble-core-cloudimg-amd64-root.tar.gz /
CMD ["/bin/bash"]`
    },
    {
      namespace: "library",
      name: "nginx",
      description: "Official build of Nginx. High performance HTTP and reverse proxy server.",
      isPrivate: false,
      isOfficial: true,
      isVerified: false,
      pullCount: 45000000,
      starCount: 18910,
      categories: ["Web Servers", "Application Infrastructure"],
      architectures: ["amd64", "arm64", "i386", "mips64le", "ppc64le"],
      operatingSystems: ["linux", "windows"],
      readme: `# NGINX Official Image

NGINX is an open source web server, reverse proxy, load balancer, HTTP cache, and mail proxy.

## How to run Nginx

Run server on port 80:
\`\`\`bash
docker run --name my-nginx -p 8080:80 -d nginx
\`\`\`

### Copy custom configuration:
\`\`\`nginx
# /etc/nginx/nginx.conf
events { worker_connections 1024; }
http {
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
        }
    }
}
\`\`\`
`,
      dockerfile: `FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`
    },
    {
      namespace: "library",
      name: "redis",
      description: "Redis is an open source key-value store that functions as a database, cache and message broker.",
      isPrivate: false,
      isOfficial: true,
      isVerified: false,
      pullCount: 32000000,
      starCount: 12430,
      categories: ["Databases", "Cache", "Key-Value Stores"],
      architectures: ["amd64", "arm64"],
      operatingSystems: ["linux"],
      readme: `# Redis Official Image

Redis is an in-memory database structure store used as a database, cache, and message broker.

## Running Redis
\`\`\`bash
docker run --name my-redis -d redis
\`\`\`

Connect with CLI:
\`\`\`bash
docker run -it --link my-redis:redis --rm redis redis-cli -h redis -p 6379
\`\`\`
`,
      dockerfile: `FROM alpine:3.19
RUN apk add --no-cache redis
EXPOSE 6379
CMD ["redis-server"]`
    },
    {
      namespace: "library",
      name: "alpine",
      description: "A minimal Docker image based on Alpine Linux with a complete package index.",
      isPrivate: false,
      isOfficial: true,
      isVerified: false,
      pullCount: 28000000,
      starCount: 9820,
      categories: ["Operating Systems", "Base Images"],
      architectures: ["amd64", "arm64", "riscv64", "s390x"],
      operatingSystems: ["linux"],
      readme: `# Alpine Official Image

Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and busybox.

## Features
- Minimal: Under 5MB in size!
- Package Manager: APK (Alpine Package Keeper)

## Usage
\`\`\`bash
docker run --rm alpine cat /etc/os-release
\`\`\`
`,
      dockerfile: `FROM scratch
ADD alpine-minirootfs-3.19.1-x86_64.tar.gz /
CMD ["/bin/sh"]`
    },
    {
      namespace: "bitnami",
      name: "wordpress",
      description: "Bitnami Docker Image for WordPress. High-performance development and production ready.",
      isPrivate: false,
      isOfficial: false,
      isVerified: true,
      pullCount: 1200000,
      starCount: 2310,
      categories: ["CMS", "Web Applications"],
      architectures: ["amd64", "arm64"],
      operatingSystems: ["linux"],
      readme: `# WordPress packaged by Bitnami

WordPress is a free, open-source content management system (CMS) written in PHP and paired with a MySQL or MariaDB database.

## Running with Compose
\`\`\`yaml
version: '3'
services:
  mariadb:
    image: docker.io/bitnami/mariadb:10.6
  wordpress:
    image: docker.io/bitnami/wordpress:latest
    ports:
      - '80:8080'
\`\`\`
`,
      dockerfile: `FROM docker.io/bitnami/minideb:bookworm
RUN apt-get update && apt-get install -y wordpress
EXPOSE 8080
CMD ["/run.sh"]`
    },
    {
      namespace: "circleci",
      name: "runner",
      description: "CircleCI Runner agent image for running enterprise self-hosted CI/CD workflows.",
      isPrivate: false,
      isOfficial: false,
      isVerified: true,
      pullCount: 450000,
      starCount: 520,
      categories: ["CI/CD", "Developer Tools"],
      architectures: ["amd64", "arm64"],
      operatingSystems: ["linux"],
      readme: `# CircleCI Runner Image

The runner container lets you host build agents on your own infrastructure.

## Configuration
Requires a Registration Token from CircleCI dashboard.
\`\`\`bash
docker run -e LAUNCH_AGENT_TOKEN="YOUR_TOKEN" circleci/runner:latest
\`\`\`
`,
      dockerfile: `FROM ubuntu:22.04
RUN curl -s https://circleci.com/install.sh | bash
CMD ["circleci-agent", "start"]`
    },
    {
      namespace: "john_doe",
      name: "custom-website",
      description: "My personal portfolio React website containerized.",
      isPrivate: false,
      isOfficial: false,
      isVerified: false,
      pullCount: 250,
      starCount: 12,
      categories: ["Web Applications"],
      architectures: ["amd64"],
      operatingSystems: ["linux"],
      readme: `# John's Custom Portfolio Website
Built with React, Vite, and Tailwind CSS.

## Run locally:
\`\`\`bash
docker run -p 3000:80 john_doe/custom-website:latest
\`\`\`
`,
      dockerfile: `FROM nginx:alpine
COPY ./build /usr/share/nginx/html
EXPOSE 80`
    }
  ];

  for (const repoData of repos) {
    const createdRepo = await prisma.repository.create({
      data: {
        namespace: repoData.namespace,
        name: repoData.name,
        description: repoData.description,
        isPrivate: repoData.isPrivate,
        isOfficial: repoData.isOfficial,
        isVerified: repoData.isVerified,
        pullCount: repoData.pullCount,
        starCount: repoData.starCount,
        categories: repoData.categories,
        architectures: repoData.architectures,
        operatingSystems: repoData.operatingSystems,
        readme: repoData.readme,
        dockerfile: repoData.dockerfile,
      },
    });

    // Create tags for each repo
    const defaultTags = [
      { name: "latest", compressedSize: 45210984, digest: `sha256:d15a51adbaef${Math.floor(Math.random() * 100000)}`, layers: 6 },
      { name: "alpine", compressedSize: 5210920, digest: `sha256:a24e99fca3ab${Math.floor(Math.random() * 100000)}`, layers: 2 },
      { name: "slim", compressedSize: 22108740, digest: `sha256:b590e8a71bca${Math.floor(Math.random() * 100000)}`, layers: 4 },
      { name: "1.0.0", compressedSize: 43280010, digest: `sha256:e795bc99aef3${Math.floor(Math.random() * 100000)}`, layers: 6 }
    ];

    for (const tag of defaultTags) {
      await prisma.tag.create({
        data: {
          repositoryId: createdRepo.id,
          name: tag.name,
          digest: tag.digest,
          compressedSize: tag.compressedSize,
          os: "linux",
          arch: "amd64",
          layers: tag.layers,
          pushedBy: "docker",
        },
      });
    }

    // Create pulls logs for graphs (last 10 days)
    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      await prisma.pull.create({
        data: {
          repositoryId: createdRepo.id,
          timestamp: date,
          pullCount: Math.floor(Math.random() * 5000) + 500,
        },
      });
    }

    // Create mock stars from users
    await prisma.star.create({
      data: {
        userId: devUser.id,
        repositoryId: createdRepo.id,
      },
    });
  }

  console.log("Repositories, tags, pulls, and stars seeded.");

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: devUser.id,
      title: "Welcome to Docker Hub!",
      message: "Start by pushing your first docker image: docker push john_doe/custom-website:latest",
      type: "SUCCESS",
    },
  });

  await prisma.notification.create({
    data: {
      userId: devUser.id,
      title: "Security Warning",
      message: "No Access Tokens generated. Please create an Access Token for CLI authentication.",
      type: "WARNING",
    },
  });

  // Seed Activity logs
  await prisma.activityLog.create({
    data: {
      userId: devUser.id,
      username: devUser.username,
      action: "LOGIN",
      details: "User logged in from IP 192.168.1.1",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
