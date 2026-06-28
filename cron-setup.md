# Cron Job Setup for Auto-Deploy

This document describes how to configure the cron job that triggers the auto-deploy script on the VPS.

## Cron Entry

```cron
*/5 * * * * /home/ubuntu/bambusilver/vps-auto-deploy.sh
```

This runs the auto-deploy script every 5 minutes, which checks for new commits on the `main` branch and rebuilds the Docker container if changes are detected.

## VPS Setup Instructions

### Prerequisites

Before installing the cron job, verify the following on the VPS (`150.109.15.108`):

1. **Git is installed and configured**
   ```bash
   git --version
   ```

2. **Docker and Docker Compose are installed**
   ```bash
   docker --version
   docker compose version
   ```

3. **The project repository is cloned**
   ```bash
   ls /home/ubuntu/bambusilver
   ```

4. **The auto-deploy script exists and is executable**
   ```bash
   ls -la /home/ubuntu/bambusilver/vps-auto-deploy.sh
   ```
   If not executable, run:
   ```bash
   chmod +x /home/ubuntu/bambusilver/vps-auto-deploy.sh
   ```

5. **The logs directory exists**
   ```bash
   mkdir -p /home/ubuntu/bambusilver/logs
   ```

6. **`flock` is available** (used by the deploy script to prevent concurrent executions)
   ```bash
   which flock
   ```
   On Ubuntu this is provided by the `util-linux` package (installed by default).

### Installing the Cron Job

1. Open the crontab editor for the `ubuntu` user:
   ```bash
   crontab -e
   ```

2. Add the following line at the end of the file:
   ```cron
   */5 * * * * /home/ubuntu/bambusilver/vps-auto-deploy.sh
   ```

3. Save and exit. Verify the entry was saved:
   ```bash
   crontab -l
   ```

   You should see the `*/5 * * * *` entry in the output.

### Verifying the Cron Job

1. **Check cron service is running:**
   ```bash
   systemctl status cron
   ```

2. **Watch the deploy log for activity:**
   ```bash
   tail -f /home/ubuntu/bambusilver/logs/deploy.log
   ```

3. **Manually test the script:**
   ```bash
   /home/ubuntu/bambusilver/vps-auto-deploy.sh
   ```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not running | Check `crontab -l` output and verify the cron service is active |
| Permission denied | Run `chmod +x /home/ubuntu/bambusilver/vps-auto-deploy.sh` |
| Git pull fails | Ensure SSH keys or credentials are configured for the `ubuntu` user |
| Docker build fails | Check `/home/ubuntu/bambusilver/logs/deploy.log` for error details |
| Concurrent execution issues | The script uses `flock` to prevent overlapping runs — check if a stale lock file exists |

### Removing the Cron Job

To disable auto-deploy, edit the crontab and remove or comment out the line:

```bash
crontab -e
```

Comment out with `#`:
```cron
# */5 * * * * /home/ubuntu/bambusilver/vps-auto-deploy.sh
```
