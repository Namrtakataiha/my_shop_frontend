
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
from django.utils import timezone

class User(AbstractUser):
     ROLE_CHOICES=[
        ('admin','admin'),('user','user')
    ]
    
     mobile_no = models.CharField(max_length=15,blank=True, null=True)
     address = models.TextField(blank=True, null=True)
     is_verified = models.BooleanField(default=False)
     is_admin = models.BooleanField(default=False)
     email = models.EmailField(unique=True)
     
     role=models.CharField(max_length=10,choices=ROLE_CHOICES,default='user')


class UserOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        expiry_minutes = 3 
        return timezone.now() > self.created_at + timezone.timedelta(minutes=expiry_minutes)

    def __str__(self):
        return f"{self.user.username} - {self.otp}"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name 
       

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    stock_quantity = models.PositiveIntegerField(default=0)
    image = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="products",null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def is_in_stock(self):
        return self.stock_quantity > 0


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} x{self.quantity}"
    
    def get_total_price(self):
        return self.product.price * self.quantity


class ProductComment(models.Model):
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('neutral',  'Neutral'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    user=models.ForeignKey(User,on_delete=models.CASCADE,related_name='product_comments')
    parent=models.ForeignKey('self',on_delete=models.CASCADE,blank=True,null=True,related_name='replies')
    comment=models.TextField()
    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES, default='neutral', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
    
    
    
    
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipping_address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} x{self.quantity}"
    
    def get_total_price(self):
        return self.price * self.quantity


class Payment(models.Model):

    PAYMENT_METHOD = [
        ('cod','Cash On Delivery'),
        ('online','Online Payment')
    ]

    PAYMENT_STATUS = [
        ('pending','Pending'),
        ('success','Success'),
        ('failed','Failed')
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE)

    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD)

    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')

    transaction_id = models.CharField(max_length=200, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist of {self.user.username} - {self.product.name}"
    
    
class ReturnRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='return_requests')
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='return_requests', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    reason = models.TextField()
    request_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('denied', 'Denied'),
            ('pickup_in_progress', 'Pickup In Progress'),
            ('completed', 'Completed'),
        ],
        default='pending'
    )
    pickup_date = models.DateTimeField(null=True, blank=True)
    refund_status = models.CharField(
        max_length=20,
        choices=[('none', 'None'), ('pending', 'Pending'), ('processed', 'Processed')],
        default='none'
    )

    def __str__(self):
        return f"Return request for {self.product.name} by {self.user.username}"
    


class ProductRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    review = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for {self.product.name} by {self.user.username} - {self.rating} stars"    
    