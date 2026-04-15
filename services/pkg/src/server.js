import http from "http";
import { Storage } from "@google-cloud/storage";

const PORT = parseInt(process.env.PORT || "8080", 10);
const BUCKET = process.env.GCS_PKG_BUCKET || "sunriseobx-proj-packages";

let storage;
try {
  storage = new Storage();
} catch {
  console.warn("GCS not available, serving static responses only");
}

const INSTALL_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail

BINARY="sunrise-cli"
INSTALL_DIR="\${HOME}/.local/bin"

echo ""
echo "  ☀  Sunrise Construction CLI"
echo ""

OS="\$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="\$(uname -m)"
case "\$ARCH" in
  x86_64|amd64) ARCH="x86_64" ;;
  aarch64|arm64) ARCH="aarch64" ;;
  *) echo "Unsupported architecture: \$ARCH"; exit 1 ;;
esac
case "\$OS" in
  linux) PLATFORM="unknown-linux-gnu" ;;
  darwin) PLATFORM="apple-darwin" ;;
  *) echo "Unsupported OS: \$OS"; exit 1 ;;
esac

TARGET="\${ARCH}-\${PLATFORM}"
URL="https://pkg.sunriseobx.co/cli/\${TARGET}/sunrise-cli"

echo "  Platform: \${OS}/\${ARCH}"
mkdir -p "\$INSTALL_DIR"
echo "  Downloading..."
curl -fsSL "\$URL" -o "\${INSTALL_DIR}/\${BINARY}" || wget -qO "\${INSTALL_DIR}/\${BINARY}" "\$URL"
chmod +x "\${INSTALL_DIR}/\${BINARY}"

# Add to PATH if not already there
if [[ ":$PATH:" != *":\$INSTALL_DIR:"* ]]; then
  SHELL_RC="\$HOME/.bashrc"
  [ -f "\$HOME/.zshrc" ] && SHELL_RC="\$HOME/.zshrc"
  echo 'export PATH="\$HOME/.local/bin:\$PATH"' >> "\$SHELL_RC"
  export PATH="\$INSTALL_DIR:\$PATH"
  echo "  Added \$INSTALL_DIR to PATH in \$SHELL_RC"
fi

echo ""
echo "  ✓ Installed to \${INSTALL_DIR}/\${BINARY}"
echo "  Run: sunrise-cli --help"
echo ""
`;

const INSTALL_PS1 = [
  "# Sunrise Construction CLI - Windows Installer",
  "# Run: irm https://pkg.sunriseobx.co/install.ps1 | iex",
  "",
  '$ErrorActionPreference = "Stop"',
  'Write-Host ""',
  'Write-Host "  Sunrise Construction CLI" -ForegroundColor Yellow',
  'Write-Host ""',
  "",
  '$InstallDir = "$env:USERPROFILE\\.sunrise\\bin"',
  '$Binary = "sunrise-cli.exe"',
  '$Url = "https://pkg.sunriseobx.co/cli/x86_64-pc-windows-msvc/sunrise-cli.exe"',
  "",
  'Write-Host "  Downloading..." -ForegroundColor Cyan',
  'New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null',
  'Invoke-WebRequest -Uri $Url -OutFile "$InstallDir\\$Binary" -UseBasicParsing',
  "",
  "# Add to User PATH if not there",
  '$UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")',
  'if ($UserPath -notlike "*$InstallDir*") {',
  '    [Environment]::SetEnvironmentVariable("PATH", "$UserPath;$InstallDir", "User")',
  '    $env:PATH = "$env:PATH;$InstallDir"',
  '    Write-Host "  Added $InstallDir to PATH" -ForegroundColor Green',
  "}",
  "",
  'Write-Host ""',
  'Write-Host "  Installed to $InstallDir\\$Binary" -ForegroundColor Green',
  'Write-Host "  Run: sunrise-cli --help" -ForegroundColor Cyan',
  'Write-Host ""',
  'Write-Host "  NOTE: Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow',
  'Write-Host ""',
].join("\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (path === "/install-cli.sh" || path === "/install.sh") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(INSTALL_SCRIPT);
    return;
  }

  if (path === "/install.ps1") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(INSTALL_PS1);
    return;
  }

  // CLI binary downloads from GCS
  if (path.startsWith("/cli/") && storage) {
    try {
      const file = storage.bucket(BUCKET).file("cli/" + path.slice(5));
      const [exists] = await file.exists();
      if (!exists) { res.writeHead(404); res.end("Not found"); return; }
      const [metadata] = await file.getMetadata();
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": metadata.size, "Cache-Control": "public, max-age=3600" });
      file.createReadStream().pipe(res);
    } catch (err) { console.error("CLI download error:", err); res.writeHead(500); res.end("Internal server error"); }
    return;
  }

  // Package info
  if (path === "/@sunriseobx/ts-sdk") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ name: "@sunriseobx/ts-sdk", version: "0.1.0", description: "TypeScript SDK for the Sunrise OBX Platform API", dist: { tarball: "https://pkg.sunriseobx.co/dist/@sunriseobx/ts-sdk" } }));
    return;
  }

  if (path === "/@sunriseobx/darecounty") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ name: "@sunriseobx/darecounty", version: "0.1.0", description: "Dare County GIS property data library (WASM + TypeScript)", dist: { tarball: "https://pkg.sunriseobx.co/dist/@sunriseobx/darecounty" } }));
    return;
  }

  // SDK tarballs from GCS
  if (path.startsWith("/dist/") && storage) {
    try {
      const pkgName = path.slice(6);
      const version = url.searchParams.get("v") || "latest";
      const file = storage.bucket(BUCKET).file(`sdk/${pkgName}-${version}.tgz`);
      const [exists] = await file.exists();
      if (!exists) { res.writeHead(404); res.end("Version not found"); return; }
      res.writeHead(200, { "Content-Type": "application/gzip", "Cache-Control": "public, max-age=3600" });
      file.createReadStream().pipe(res);
    } catch (err) { console.error("SDK download error:", err); res.writeHead(500); res.end("Internal server error"); }
    return;
  }

  if (path === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Sunrise OBX Package Server",
      packages: ["@sunriseobx/ts-sdk", "@sunriseobx/darecounty"],
      cli: { install: "curl -fsSL https://pkg.sunriseobx.co/install-cli.sh | bash" },
    }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log("sunriseobx-pkg listening on port " + PORT));
