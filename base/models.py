from django.db import models

class UserDetails(models.Model):
    username = models.CharField(max_length = 50, null = True)
    UID = models.CharField(max_length = 200)
    room_name = models.CharField(max_length =200)

    def __str__(self):
        return self.username
