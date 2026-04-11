import urllib.request, json, urllib.error
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=json.dumps({'username':'superadmin', 'password':'Admin@123456'}).encode(), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['access_token']
print("Got token:", token)
req2 = urllib.request.Request('http://localhost:8000/api/auth/me', headers={'Authorization': 'Bearer ' + token})
try:
    print(urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print("Body:", e.read().decode())
