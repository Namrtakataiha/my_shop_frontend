from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
   class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'mobile_no', 'is_admin', 'is_verified','role']
        extra_kwargs = {'password': {'write_only': True}}
        
   def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   
        user.save()
        return user

        
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RecursiveSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data


class ProductCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    replies = RecursiveSerializer(many=True, read_only=True)

    class Meta:
        model = ProductComment
        fields = [
            'id', 'product', 'user', 'user_name', 'comment', 'sentiment',
            'parent', 'replies', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'product', 'user', 'parent', 'replies', 'sentiment', 'created_at', 'updated_at',
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    comments = ProductCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category_name', 'category_id', 'stock_quantity', 'image', 'is_active', 'created_at', 'updated_at', 'comments', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']
        read_only_fields = ['id']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'user', 'total_amount', 'status', 'shipping_address', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['order', 'payment_method', 'payment_status', 'transaction_id', 'created_at']


class ReturnRequestSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.URLField(source='product.image', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True, default=None)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'order', 'order_number',
            'product', 'product_name', 'product_image',
            'reason', 'status', 'pickup_date', 'refund_status', 'request_date',
        ]
 