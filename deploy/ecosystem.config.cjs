// PM2 process file — started by deploy/deploy.sh
module.exports = {
  apps: [
    {
      name: process.env.APP_NAME || "the-morrow",
      script: ".next/standalone/server.js",
      cwd: __dirname + "/..",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3010,
        HOSTNAME: process.env.HOSTNAME || "127.0.0.1",
      },
      max_memory_restart: "600M",
    },
  ],
};
