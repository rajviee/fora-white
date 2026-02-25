import subprocess
import os
import signal
import asyncio
import httpx
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, Response
from contextlib import asynccontextmanager

NODE_BACKEND_PORT = 3333
NODE_BACKEND_URL = f"http://127.0.0.1:{NODE_BACKEND_PORT}"
node_process = None

def start_node_backend():
    global node_process
    env = os.environ.copy()
    env["PORT"] = str(NODE_BACKEND_PORT)
    node_process = subprocess.Popen(
        ["node", "server.js"],
        cwd="/app/foratask-backend",
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    print(f"Node.js backend started on port {NODE_BACKEND_PORT} (PID: {node_process.pid})")

def stop_node_backend():
    global node_process
    if node_process:
        os.killpg(os.getpgid(node_process.pid), signal.SIGTERM)
        node_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_node_backend()
    await asyncio.sleep(2)
    yield
    stop_node_backend()

app = FastAPI(lifespan=lifespan)

@app.api_route("/api/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"])
async def proxy(path: str, request: Request):
    url = f"{NODE_BACKEND_URL}/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    params = dict(request.query_params)
    body = await request.body()
    content_type = request.headers.get("content-type", "")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            params=params,
            content=body,
        )
    excluded = {"content-encoding", "content-length", "transfer-encoding"}
    resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
    return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)

@app.get("/api")
async def api_root():
    return {"status": "ok", "message": "ForaTask API proxy running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
