import http.client, json, uuid

boundary = uuid.uuid4().hex
body = (
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"name\"\r\n\r\n"
    f"Dharanish M\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"age\"\r\n\r\n"
    f"25\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"id_number\"\r\n\r\n"
    f"AADH1234567\r\n"
    f"--{boundary}--\r\n"
).encode()

conn = http.client.HTTPConnection("localhost", 8000)
conn.request(
    "POST", "/api/register", body=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)
resp = conn.getresponse()
data = resp.read()
reg = json.loads(data)
print("REGISTER:", json.dumps(reg, indent=2))

uid = reg["user_id"]

# Generate credential
conn2 = http.client.HTTPConnection("localhost", 8000)
conn2.request(
    "POST", "/api/generate-credential",
    body=json.dumps({"user_id": uid}).encode(),
    headers={"Content-Type": "application/json"}
)
r2 = conn2.getresponse()
cred = json.loads(r2.read())
print("CREDENTIAL:", cred.get("signature_short"))

# Generate proof
conn3 = http.client.HTTPConnection("localhost", 8000)
conn3.request(
    "POST", "/api/generate-proof",
    body=json.dumps({"user_id": uid, "condition": "age > 18"}).encode(),
    headers={"Content-Type": "application/json"}
)
r3 = conn3.getresponse()
proof = json.loads(r3.read())
print("PROOF:", json.dumps(proof, indent=2))

# Verify proof
conn4 = http.client.HTTPConnection("localhost", 8000)
conn4.request(
    "POST", "/api/verify-proof",
    body=json.dumps({"proof_id": proof["proof_id"]}).encode(),
    headers={"Content-Type": "application/json"}
)
r4 = conn4.getresponse()
verify = json.loads(r4.read())
print("VERIFY:", json.dumps(verify, indent=2))
