from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
import random
import time
import json
from .models import UserDetails
from django.views.decorators.csrf import csrf_exempt

# Create your views here.

def getToken(request):
    appId ="0c1d0dae73034ff6a0f5813ccedc13fe"
    appCertificate = "fd9bc5ed350a495b8e9cf94e06838ba4"
    channelName = request.GET.get('channel')
    uid = random.randint(1,230)
    expirationTimeInSeconds = 3600*24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role = 1
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token': token, "uid": uid}, safe = False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

@csrf_exempt
def createUser(request):
    data = json.loads(request.body)
    user, created = UserDetails.objects.get_or_create(
        username = data['username'],
        UID = data['UID'],
        room_name = data['room_name']
    )
    return JsonResponse({'username': data['username']}, safe = False)

def getUser(request):
    UID = request.GET.get('UID')
    room_name = request.GET.get('room_name')
    user = UserDetails.objects.get(
        UID = UID,
        room_name = room_name
    )

    name = user.username
    return JsonResponse({'username': user.username}, safe = False)

@csrf_exempt
def deleteUser(request):
    data = json.loads(request.body)
    obj = UserDetails.objects.get(UID = data["UID"], username = data["username"], room_name = data['room_name'])
    obj.delete()
    return JsonResponse("User was deleted", safe = False) 