from django.contrib import admin

# Register your models here.
from .models import *
admin.site.register(Product)
admin.site.register(ProductComment)
admin.site.register(Category)
admin.site.register(User)   
admin.site.register(UserOTP)
admin.site.register(Cart)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Payment)




                                                                                                                                 