# Deployment Guide: Meenuin SaaS (Existing Database)

This guide is tailored for deploying Meenuin to a production server where **PostgreSQL is already installed and running**.

## Step 0: Initial Server Setup & Code Upload

Before running connecting anything, you need to set up the project folder on your server and upload the code.

1.  **Create Project Directory**:
    Log in to your server via SSH and create a folder for the application.
    ```bash
    ssh user@your-server-ip
    sudo mkdir -p /opt/meenuin
    sudo chown $USER:$USER /opt/meenuin
    cd /opt/meenuin
    ```

2.  **Upload Code**:
    Since you have already pushed to GitHub, you can just pull it on the server:
    ```bash
    # On server
    git clone https://github.com/your-username/your-repo.git .
    # OR if already cloned:
    git pull origin main
    ```

## Step 1: Environment Variables

Create a `.env` file on your server inside the project folder.

```bash
nano .env
```
Paste and fill in your details:
```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secure_random_string

# Database Connection (External)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
# Important: If Postgres is on the same server, use "host.docker.internal" (if enabled) or the Docker bridge IP "172.17.0.1"
DATABASE_URL="postgresql://myuser:mypassword@172.17.0.1:5432/mydb?schema=public"
```

## Step 2: Deploy with Docker Compose

Use the provided `docker-compose.prod.yml` which excludes the internal Postgres container.

1.  **Run the Container**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

## Step 3: Database Migration (Critical)

Apply the schema to your existing database.

1.  Run migration:
    ```bash
    docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
    ```
    *This creates/updates the tables in your existing PostgreSQL database.*

2.  (Optional) Seed initial data (Admins/Plans) if the DB is empty:
    ```bash
    docker compose -f docker-compose.prod.yml exec app npx prisma db seed
    ```

## Step 4: Nginx Setup (Reverse Proxy)

The `nginx.conf` file is already included in the project root. 
If you cloned the repo, it should be there.

Ensure it exists on the server:
```bash
ls -l nginx.conf
```
*If missing, you can create it with the content below:*

```nginx
events { worker_connections 1024; }
# ... (rest of config)


http {
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Troubleshooting: "nginx.conf is a directory"

**Cause**: Docker couldn't find `nginx.conf` in the root, so it made a folder. Your file is actually in `nginx/nginx.conf`.

**Solution:**

1.  **Remove the incorrect root folder**:
    ```bash
    sudo rm -rf nginx.conf
    ```
    *(Do NOT remove the `nginx` folder, that one is correct)*.

2.  **Pull changes**:
    I have updated `docker-compose.prod.yml` to look in the right place (`./nginx/nginx.conf`).
    ```bash
    git pull origin main
    ```

3.  **Restart**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

### Reference: correct nginx.conf content
### Troubleshooting: Port Conflicts

**Update:** To avoid conflicts with existing services on port 80/443, we have moved the application to alternative ports:
*   **HTTP**: Port **8080**
*   **HTTPS**: Port **8443**

**Accessing the App:**
*   Browser: `https://meenuin.biz.id:8443`
*   Ensure your server firewall (UFW/Security Group) allows inbound traffic on **8080** and **8443**.

### Troubleshooting: Cloudflare Error 521 "Web server is down"

This error means Cloudflare cannot connect to your server.

**Possible Causes & Fixes:**

1.  **Firewall Blocking Ports (Most Likely)**:
    Your server's firewall might be blocking port 8080 and 8443.
    *Action:* Allow these ports.
    ```bash
    sudo ufw allow 8080/tcp
    sudo ufw allow 8443/tcp
    sudo ufw reload
    ```

2.  **Nginx Container Crashing**:
    If Nginx config is wrong or SSL certs are missing, the container keeps restarting.
    *Action:* Check status:
    ```bash
    docker ps -a
    ```
    *   If status is `Restarting ...`, check logs:
        ```bash
        docker logs meenuin-nginx
        ```
### Troubleshooting: SSL Certificates Missing (Nginx Crash)

If Docker logs show "cannot load certificate", you need to generate them.

**Method A: Instant Fix (Self-Signed)**
Since you use Cloudflare, you can use a self-signed cert if you set Cloudflare SSL mode to **Full**.

1.  **Run the generator script**:
    ```bash
    chmod +x generate_ssl.sh
    ./generate_ssl.sh
    ```
2.  **Restart Nginx**:
    ```bash
    docker compose -f docker-compose.prod.yml restart nginx
    ```

**Method B: Cloudflare Origin CA (Recommended for Prod)**
1.  Go to Cloudflare > SSL/TLS > Origin Server > Create Certificate.
2.  Save the Key as `ssl/certs/meenuin.key`.
3.  Save the Cert as `ssl/certs/meenuin.crt`.



## Step 6: Database Migration (Existing Production DB)

Since your App container (`meenuin-app`) is already running (checked via `docker ps`), you can run the migration now:

1.  **Run Migration**:
    ```bash
    docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
    ```
2.  **Verify**:
    If the command succeeds, your tables are created. You can verify logs:
    ```bash
    docker logs meenuin-app
    ```

