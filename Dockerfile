FROM node:24.22.2-alpine
WORKDIR /app
RUN mkdir -p /app/.local /app/public && chown -R node:node /app
COPY --chown=node:node package.json ./
COPY --chown=node:node server/ ./server/
COPY --chown=node:node public/content.js ./public/content.js
USER node
ENV NODE_ENV=production PORT=8788 DB_PATH=/app/.local/learning-room.sqlite SERVE_STATIC=false
EXPOSE 8788
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8788/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]
