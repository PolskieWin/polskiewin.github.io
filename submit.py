import urllib.request
import json

url = "https://api.indexnow.org/indexnow"
payload = {
    "host": "polskiewin.github.io",
    "key": "39ec81be-8a53-48aa-a725-babe41c8bf65",
    "keyLocation": "https://polskiewin.github.io/39ec81be-8a53-48aa-a725-babe41c8bf65.txt",
    "urlList": [
        "https://polskiewin.github.io/",
        "https://polskiewin.github.io/libre-launcher/",
        "https://polskiewin.github.io/minecraft-java-android/",
        "https://polskiewin.github.io/libre-launcher-vs-pojavlauncher/"
    ]
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("SUCCESS! Status code:", response.status)
except Exception as e:
    print("Error:", e)
