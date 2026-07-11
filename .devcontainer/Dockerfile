FROM mcr.microsoft.com/devcontainers/universal:linux

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER codespace

RUN curl -fsSL https://deno.land/install.sh | sh -s -- v2

ENV DENO_INSTALL="/home/codespace/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

RUN npm install -g supabase

RUN mkdir -p /home/codespace/.npm /workspaces/Financia/.cache && \
    npm config set cache /home/codespace/.npm

USER root
RUN chown -R codespace:codespace /home/codespace/.npm /workspaces/Financia/.cache
USER codespace
