import os,sys,base64,requests
url=os.environ['SHAREPOINT_FILE_URL']; tenant=os.environ['MS_TENANT_ID']; client=os.environ['MS_CLIENT_ID']; secret=os.environ['MS_CLIENT_SECRET']
t=requests.post(f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',data={'client_id':client,'client_secret':secret,'scope':'https://graph.microsoft.com/.default','grant_type':'client_credentials'},timeout=60); t.raise_for_status(); token=t.json()['access_token']
share='u!'+base64.urlsafe_b64encode(url.encode()).decode().rstrip('=')
r=requests.get(f'https://graph.microsoft.com/v1.0/shares/{share}/driveItem/content',headers={'Authorization':f'Bearer {token}'},timeout=180); r.raise_for_status(); open(sys.argv[1],'wb').write(r.content)
