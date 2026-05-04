FROM oven/bun:1

WORKDIR /app

# OS packages:
#   openssl, ca-certificates - required by Prisma's query engine
#   postgresql-client        - pg_isready + psql for the entrypoint to wait on / probe the DB
#   python3, build-essential - bufferutil (transitive dep of @vercel/postgres) ships no
#                              prebuild for linux/arm64 + Bun, so node-gyp compiles from source
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       openssl \
       ca-certificates \
       postgresql-client \
       python3 \
       build-essential \
  && rm -rf /var/lib/apt/lists/*

# Install deps with the lockfile to leverage Docker layer caching.
# The full source tree is bind-mounted at runtime; we only need the manifest, the
# lockfile, and the Prisma schema here so `postinstall` (which runs `prisma generate`)
# has what it needs. Copying just schema.prisma — not the whole prisma/ dir — keeps
# this layer cache valid across migration commits.
COPY package.json bun.lock ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN bun install --frozen-lockfile

CMD ["bun", "run", "dev"]
