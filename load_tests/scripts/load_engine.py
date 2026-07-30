import os
import json
import time
import asyncio
import random
import httpx
from datetime import datetime

# Add local path to sys.path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import load_config

class LoadTestingEngine:
    def __init__(self):
        self.results = []
        self.payloads = self._load_payloads()
        
    def _load_payloads(self):
        data_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            "data", 
            "payload_data.json"
        )
        try:
            with open(data_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"login_payloads": [], "intention_payloads": []}

    async def worker_task(self, worker_id, start_time, duration, client):
        # 10s ramp-up delay: spread VUs evenly over 10 seconds
        initial_delay = worker_id * (load_config.RAMP_UP / load_config.VUS)
        await asyncio.sleep(initial_delay)
        
        while time.time() - start_time < duration:
            # Pick a weighted endpoint
            endpoint = self._pick_weighted_endpoint()
            path = endpoint["path"]
            method = endpoint["method"]
            name = endpoint["name"]

            # Set up headers & payload
            headers = {"Content-Type": "application/json"}
            payload = None
            if method == "POST":
                if "login" in path:
                    payloads_list = self.payloads.get("login_payloads", [])
                    if payloads_list:
                        payload = random.choice(payloads_list)
                elif "intentions" in path:
                    payloads_list = self.payloads.get("intention_payloads", [])
                    if payloads_list:
                        payload = random.choice(payloads_list)
            
            # Send HTTP request
            req_start = time.time()
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
            status_code = 0
            error_details = ""
            
            try:
                if method == "GET":
                    response = await client.get(f"{load_config.BASE_URL}{path}", headers=headers, timeout=5.0)
                else:
                    response = await client.post(f"{load_config.BASE_URL}{path}", headers=headers, json=payload, timeout=5.0)
                status_code = response.status_code
            except Exception as e:
                error_details = str(e)
                
            req_latency = time.time() - req_start
            
            # Record result
            self.results.append({
                "path": path,
                "method": method,
                "name": name,
                "latency": req_latency,
                "status_code": status_code,
                "error": error_details,
                "timestamp": timestamp_str
            })
            
            # Realistic user think-time/pacing (between 0.3s and 0.8s)
            think_time = random.uniform(0.3, 0.8)
            await asyncio.sleep(think_time)

    def _pick_weighted_endpoint(self):
        endpoints = load_config.ENDPOINTS
        weights = [e["weight"] for e in endpoints]
        return random.choices(endpoints, weights=weights, k=1)[0]

    async def run(self):
        duration = load_config.DURATION
        print(f"[Engine] Simulating {load_config.VUS} VUs for {duration}s on {load_config.BASE_URL}...")
        
        start_time = time.time()
        
        # Configure client with connection pooling
        limits = httpx.Limits(max_keepalive_connections=50, max_connections=200)
        async with httpx.AsyncClient(limits=limits) as client:
            tasks = []
            for i in range(load_config.VUS):
                tasks.append(
                    asyncio.create_task(
                        self.worker_task(i, start_time, duration, client)
                    )
                )
            
            # Wait for all workers to complete
            await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        print(f"[Engine] Load test execution complete in {total_time:.2f} seconds.")
        return self.results
