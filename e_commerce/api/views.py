
from django.shortcuts import render
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from .models import *
from .serializers import *
from  rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from .utils import *
from .permissions import *
from rest_framework.filters import SearchFilter, OrderingFilter 
from .tasks import *
from django.core.cache import cache
import uuid
from django.db.models import Q
from recommendation.recommendation import *







@api_view(['GET'])
def test_ip(request):
    ip = getattr(request, 'client_ip', 'IP not found')
    print(request)
    return Response({
        "client_ip": ip,
        "message": "IP fetched successfully!"
    })

@api_view(['POST'])
def register(request):
    data = request.data
    required_fields = ['username', 'email', 'password', 'mobile_no', 'address', 'role']
    
    for field in required_fields:
        if not data.get(field):
            return Response({field: "this is required."}, status=status.HTTP_400_BAD_REQUEST)


    email = data.get('email')
    try:
        user = User.objects.get(email=email)
        if user.is_verified:
            return Response({"user registered and verified .you can login"}, status=status.HTTP_400_BAD_REQUEST)
        else:
           
            otp = generate_otp()
            UserOTP.objects.create(user=user, otp=otp)
            
            email_sent = send_email(
                subject='your user otp verification code',
                message=f'your otp is {otp}',
                recipient_email=user.email
            )
           
            
            if email_sent:
                return Response({ "user already registered but not verified. OTP resent to your email."}, status=status.HTTP_200_OK)
            else:
                return Response({ "Oops, something went wrong"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except User.DoesNotExist:
        pass
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        role=user.role
        if role=='user':
            user.is_admin=False
            user.role='user'
        else:
            user.is_admin=True
            user.role='admin'
 
        otp = generate_otp()
        UserOTP.objects.create(user=user, otp=otp)
        
        email_sent = send_email(
            subject='your User OTP Verification Code',
            message=f'your OTP is {otp}',
            recipient_email=user.email
        )
        
        if email_sent:
            return Response({"your are  registered. OTP sent to your email for verification."}, status=status.HTTP_201_CREATED)
        else:
            return Response({"your are  registered but failed to send OTP email."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    if not email or not otp:
        return Response({ "Email and OTP are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"The page cannot be found"}, status=404)

    try:
        user_otp = UserOTP.objects.filter(user=user).latest('created_at')
    except UserOTP.DoesNotExist:
        return Response({"OTP not found"}, status=404)
    
    if user_otp.is_expired():
        user_otp.delete()  
        return Response({"OTP expired. Please request a new one."}, status=400)
    if user_otp.otp != otp:
        return Response({"wrong OTP"}, status=400)

    user.is_verified = True
    user.save()
    user_otp.delete()

    return Response({"you are verified successfully"}, status=200)



@api_view(['POST'])

def login(request):
    # username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if not email or not password :
        return Response({ "email and password are required"}, status=404)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"User not found"}, status=404)
    
    
    if not user.is_verified:
        return Response({"you are not verified"}, status=403)


    if not user.check_password(password):
         return Response({"Incorrect password"}, status=400)
    
    otp=request.data.get('otp')
    if not otp:
        otp_code = generate_otp()
        UserOTP.objects.create(user=user, otp=otp_code)
        
        email_sent = send_email(
            subject='Your Login OTP Code',
            message=f'Your login OTP is {otp_code}',
            recipient_email=user.email
        )
        if email_sent:
            return Response({
                "OTP sent to your email. Please provide OTP to complete login."

            }, status=status.HTTP_200_OK)
        else:
            return Response({"Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

   

@api_view(['POST'])
def resend_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({ "email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"Oops, something went wrong"}, status=status.HTTP_404_NOT_FOUND)
    otp = generate_otp()
    UserOTP.objects.create(user=user, otp=otp)
    user_type = "Admin" if user.is_admin or user.role == 'admin' else "User"
    email_sent = send_email(
        subject=f'your {user_type} OTP Verification Code'
        ,message=f'your OTP is {otp}',
        recipient_email=user.email)
    if email_sent:
        return Response({ f"OTP resent to your email."}, status=status.HTTP_200_OK)
    else:
        return Response({"Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def reset_password(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    if not email:
        return Response({"Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"your are not register with this email so Please register first."}, status=status.HTTP_404_NOT_FOUND)
    
    
    if not otp or not new_password:
        otp_code = generate_otp()
        UserOTP.objects.create(user=user, otp=otp_code)
        
        email_sent = send_email(
            subject='your Password Reset OTP',
            message=f'your OTP code for password reset is {otp_code}',
            recipient_email=user.email
        )
        
        if email_sent:
            return Response({
                 f"OTP sent to your registered email: {user.email}. Please provide new OTP and reset your new password."
            }, status=status.HTTP_200_OK)
        else:
            return Response({ "Oops, something went wrong"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if not new_password:
        return Response({"Give new password.password is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_otp = UserOTP.objects.filter(user=user).latest('created_at')
    except UserOTP.DoesNotExist:
        return Response({ "no OTP found. Please request again."}, status=status.HTTP_404_NOT_FOUND)
    
    if user_otp.is_expired():
        user_otp.delete()
        return Response({"OTP expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
    
    if user_otp.otp != otp:
        return Response({"Invalid OTP. Please try again."}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    user_otp.delete()
    
    return Response({"Password reset successful. now you can login with your new password."}, status=status.HTTP_200_OK)


@api_view(['POST'])
def verify_otp_2f(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"email not found"}, status=404)

    if not email or not otp:
        return Response({ "Email and OTP are required"}, status=400)
    try:
        user_otp = UserOTP.objects.filter(user=user).latest('created_at')
    except UserOTP.DoesNotExist:
        return Response({ "OTP not found. Please login again."}, status=status.HTTP_404_NOT_FOUND)
    
    if user_otp.is_expired():
        user_otp.delete()
        return Response({"OTP expired. Please request login again."}, status=status.HTTP_400_BAD_REQUEST)
    
    if user_otp.otp != otp:
        return Response({"wrong OTP"}, status=status.HTTP_400_BAD_REQUEST)
   
    user_otp.delete()
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': ' login successfully',
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'role': user.role,
        'username': user.username
    }, status=status.HTTP_200_OK)
   
@api_view(['GET'])
@permission_classes([IfAdmin])
def admin_dashboard(request):
    
    # total_users = User.objects.filter(role='user').count()
    # total_admins = User.objects.filter(role='admin').count()
    total_products = Product.objects.count()
    total_categories = Category.objects.count()
    total_order= Order.objects.count()
   

 
    
    return Response({
        # 'total_users': total_users,
        # 'total_admins': total_admins,
        'total_products': total_products,
        'total_categories': total_categories,
        'total_orders': total_order,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IfAdmin])
def admin_user_list(request):
    users = User.objects.all()
    search_filter = SearchFilter()
    users = search_filter.filter_queryset(request, users, admin_user_list)

    search_filter.search_fields = ['username', 'email']
    users = search_filter.filter_queryset(request, users, admin_user_list)
    ordering_filter = OrderingFilter()
    
    users = ordering_filter.filter_queryset(request, users, admin_user_list)

    ordering_filter.ordering_fields = ['username', 'email', 'date_joined'] 
    ordering_filter.ordering_url_kwarg = 'ordering' 
    users = ordering_filter.filter_queryset(request, users, admin_user_list)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IfAdmin])
def admin_user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except :
      
        return Response(
            { 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = UserSerializer(user)
    users = User.objects.filter(user=user)
    # orders_data = OrderSerializer(orders, many=True).data
    return Response({
        'user': serializer.data,
       
    }, status=status.HTTP_200_OK)
    
    
@api_view(['GET'])
def public_category_list(request):
    categories = Category.objects.all().order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([IfAdmin])
def category_create(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        _invalidate_product_list_cache()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IfAdmin])
def category_detail_admin(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CategorySerializer(category)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IfAdmin])
def category_update(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CategorySerializer(category, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        _invalidate_product_list_cache()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IfAdmin])
def category_delete(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if category.products.exists():
        return Response({'error': 'Cannot delete category because it has products'}, status=status.HTTP_400_BAD_REQUEST)
    
    category.delete()
    _invalidate_product_list_cache()
    return Response({'message': 'Category deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IfAdmin])
def product_list_create(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({ 'Category not available'}, status=404)
    if request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product=serializer.save(category=category,created_by=request.user)
            _invalidate_product_list_cache()
            notify_product_created.delay(product.id, "created")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
def _invalidate_product_list_cache():
    """Bump version so all product list cache keys are instantly stale."""
    v = cache.get('product_list_v', 0)
    cache.set('product_list_v', v + 1, timeout=None)


@api_view(['GET'])
def find_products(request):
    # Extracting filter params from the request
    category_id = request.query_params.get('category_id', None)
    product_name = request.query_params.get('product_name', None)
    category_name = request.query_params.get('category_name', None)
    min_price = request.query_params.get('min_price', None)
    max_price = request.query_params.get('max_price', None)
    ordering = request.query_params.get('ordering', None)  # Can be "price", "name", "-price", "-name"

    # Version-tagged cache key — bumped on every product write
    v = cache.get('product_list_v', 0)
    cache_key = f"products_v{v}_{category_id}_{product_name}_{category_name}_{min_price}_{max_price}_{ordering}"
    cached_products = cache.get(cache_key)

    if cached_products:
        return Response(cached_products, status=status.HTTP_200_OK)

    # Start with all products
    products = Product.objects.all()

    # Filtering by category if provided
    if category_name:
        try:
            category = Category.objects.get(name=category_name)
            products = products.filter(category=category)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    # Filtering by product name if provided
    if product_name:
        products = products.filter(name__icontains=product_name)

    # Filtering by category name if provided
    if category_name:
        products = products.filter(category__name__icontains=category_name)

    # Filtering by price range if provided
    if min_price:
        try:
            min_price = float(min_price)
            products = products.filter(price__gte=min_price)
        except ValueError:
            return Response({'error': 'Invalid min_price value'}, status=status.HTTP_400_BAD_REQUEST)

    if max_price:
        try:
            max_price = float(max_price)
            products = products.filter(price__lte=max_price)
        except ValueError:
            return Response({'error': 'Invalid max_price value'}, status=status.HTTP_400_BAD_REQUEST)

    # Ordering products based on the 'ordering' parameter
    if ordering:
        if ordering == 'price':
            products = products.order_by('price')
        elif ordering == '-price':
            products = products.order_by('-price')
        elif ordering == 'name':
            products = products.order_by('name')
        elif ordering == '-name':
            products = products.order_by('-name')
        else:
            return Response({'error': 'Invalid ordering parameter'}, status=status.HTTP_400_BAD_REQUEST)

    # If no products found
    if not products.exists():
        return Response({'message': 'No products found with the given filters'}, status=status.HTTP_404_NOT_FOUND)

    # Serialize the product data
    serializer = ProductSerializer(products, many=True)

    # Cache the result for 60 seconds
    cache.set(cache_key, serializer.data, timeout=60)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IfAdmin])
def product_modify(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if category name is provided to change the category
    new_category_name = request.data.get('category', None)
    if new_category_name:
        try:
            # Get the category by name
            category = Category.objects.get(name=new_category_name)
            product.category = category  # Update the product's category
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Update the product with the new data (including category if provided)
    serializer = ProductSerializer(product, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()  # Save updated product
        cache.delete(f"product_{product_id}")  # Clear the cached product data
        _invalidate_product_list_cache()       # Bust all product list caches immediately
        warmup_product_cache.delay(product_id)  # Re-cache the product data
        notify_product_created.delay(product.id, "updated")  # Notify that the product was updated

        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['DELETE'])
@permission_classes([IfAdmin])
def product_delete(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    product.delete()
    cache.delete(f"product_{product_id}")
    cache.delete(f"product_comments_{product_id}")
    _invalidate_product_list_cache()
    return Response({'Product deleted successfully..thankyou'}, status=status.HTTP_200_OK)



    

@api_view(['GET'])
@permission_classes([IfUser])
def cart_list(request):
    cart_items = Cart.objects.filter(user=request.user).select_related('product')
    serializer = CartSerializer(cart_items, many=True)

    total = sum(float(item.product.price) * item.quantity for item in cart_items)

    return Response({
        'items': serializer.data,
        'total': total
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IfUser])
def cart_add(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    if not product_id:
        return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({'error': 'quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

    if quantity <= 0:
        return Response({'error': 'quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'product not found'}, status=status.HTTP_404_NOT_FOUND)

    if quantity > product.stock_quantity:
        return Response({'error': f'Only {product.stock_quantity} items available'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if the product is already in the cart
    cart_item, created = Cart.objects.get_or_create(user=request.user, product=product, defaults={'quantity': quantity})

    # If product already exists, update its quantity
    if not created:
        new_quantity = cart_item.quantity + quantity
        if new_quantity > product.stock_quantity:
            return Response({'error': f'Cannot add more. Only {product.stock_quantity} available'}, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = new_quantity
        cart_item.save()

    serializer = CartSerializer(cart_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IfUser])
def update_cart_item_quantity(request, cart_id):
    try:
        cart_item = Cart.objects.get(id=cart_id, user=request.user)
    except Cart.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    new_quantity = request.data.get('quantity', 1)

    if new_quantity <= 0:
        return Response({'error': 'Quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    if new_quantity > cart_item.product.stock_quantity:
        return Response({'error': f'Only {cart_item.product.stock_quantity} available'}, status=status.HTTP_400_BAD_REQUEST)

    cart_item.quantity = new_quantity
    cart_item.save()

    serializer = CartSerializer(cart_item)
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['DELETE'])
@permission_classes([IfUser])
def clear_cart(request):
    Cart.objects.filter(user=request.user).delete()
    return Response({'message': 'All items removed from cart'}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IfUser])
def delete_product_from_cart(request, cart_id):
    try:
        cart_item = Cart.objects.get(id=cart_id, user=request.user)
    except Cart.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    cart_item.delete()
    return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)






@api_view(['post'])
@permission_classes([IfUser| IfAdmin])
def add_product_comment(request, product_id):
    
    user_id = request.user.id
    cache_key = f"user_comment_{user_id}_{product_id}"

    comment_count = cache.get(cache_key, 0)

    if comment_count >= 2:
        return Response(
            {"error": "You can add only 2 comments on this product"},
            status=403
        )
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({ 'Product not available'}, status=404)

    serializer = ProductCommentSerializer(data=request.data)
    if serializer.is_valid():
        comment = serializer.save(
            product=product,
            user=request.user,
            parent=None
        )
        from .ml_utils import get_sentiment
        comment.sentiment = get_sentiment(comment.comment)
        comment.save(update_fields=['sentiment'])
        cache.set(cache_key, comment_count + 1, timeout=86400)
        notify_comment_added.delay(comment.id)
        return Response(ProductCommentSerializer(comment).data, status=201)

    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IfUser | IfAdmin])
def reply_to_comment(request, product_id, comment_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'Product not available'},
            status=404
        )

   
    try:
        parent_comment = ProductComment.objects.get(
            id=comment_id,
            product=product
        )
    except ProductComment.DoesNotExist:
        return Response(
            {'Parent comment not found'},
            status=404
        )

   
    serializer = ProductCommentSerializer(data=request.data)

    if serializer.is_valid():
        comment=serializer.save(
            product=product,
            user=request.user,
            parent=parent_comment  
        )
        from .ml_utils import get_sentiment
        comment.sentiment = get_sentiment(comment.comment)
        comment.save(update_fields=['sentiment'])
        cache.delete(f"product_comments_{product_id}")
        warmup_product_comments_cache.delay(product_id)
        notify_comment_added.delay(comment.id)
        return Response(ProductCommentSerializer(comment).data, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
def all_comments(request, product_id):
    cache_key = f"product_comments_{product_id}"
    cached_comments = cache.get(cache_key)

    if cached_comments:
        return Response(cached_comments, status=200)
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'Product not available'}, status=404)

    comments = ProductComment.objects.filter(
        product=product,
        parent=None
    ).order_by('-created_at')
    serializer = ProductCommentSerializer(comments, many=True)
    cache.set(cache_key, serializer.data, timeout=300)
    return Response(serializer.data, status=200)




@api_view(['PUT'])
@permission_classes([IfUser])
def update_comment_by_user(request, comment_id):
    user_id = request.user.id
    edit_key = f"user_edit_{user_id}_{comment_id}"

    edit_count = cache.get(edit_key, 0)

    if edit_count >= 5:
        return Response(
            {"error": "You can edit this comment only 5 times"},
            status=403
        )
    try:
        comment = ProductComment.objects.get(id=comment_id)
    except ProductComment.DoesNotExist:
        return Response(
            {'Comment not found'},
            status=404
        )

    if comment.user != request.user:
        return Response(
            {'You can update only your comment'},
            status=403
        )

    serializer = ProductCommentSerializer(
        comment,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        cache.delete(f"product_comments_{comment.product.id}")
        warmup_product_comments_cache.delay(comment.product.id)
        cache.set(edit_key, edit_count + 1, timeout=604800)
        # recompute sentiment on edit
        from .ml_utils import get_sentiment
        comment.sentiment = get_sentiment(comment.comment)
        comment.save(update_fields=['sentiment'])
        return Response(ProductCommentSerializer(comment).data, status=200)

    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IfUser])
def delete_comment_by_user(request, comment_id):
    try:
        comment = ProductComment.objects.get(id=comment_id)
    except ProductComment.DoesNotExist:
        return Response(
            {'Comment not found'},
            status=404
        )

    if comment.user != request.user:
        return Response(
            {'You can not delete this comment'},
            status=403
        )

    comment.delete()
    cache.delete(f"product_comments_{comment.product.id}")

    warmup_product_comments_cache.delay(comment.product.id)
    return Response(
        { 'Comment deleted successfully'},
        status=200
    )



@api_view(['DELETE'])
@permission_classes([IfAdmin])
def admin_delete_comment(request, comment_id):
    try:
        comment = ProductComment.objects.get(id=comment_id)
    except ProductComment.DoesNotExist:
        return Response(
            {'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    comment.delete()

    return Response(
        {'comment deleted successfully....thank you'},
        status=status.HTTP_200_OK
    )
    
    
    
@api_view(['PUT'])
@permission_classes([IfAdmin])
def admin_update_order_status(request, order_id):

    try:
        order = Order.objects.get(id=order_id)

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    status_value = request.data.get("status")

    if status_value not in dict(Order.STATUS_CHOICES):
        return Response({"error": "Invalid status"}, status=400)

    # check admin permission
    order_items = order.items.select_related("product")

    allowed = False

    for item in order_items:
        if item.product.created_by == request.user:
            allowed = True
            break

    if not allowed:
        return Response(
            {"error": "You can only manage orders for your own products"},
            status=403
        )

    order.status = status_value
    order.save()
    notify_order_status_updated.delay(order.id, status_value)
    return Response(
        {"message": "Order status updated successfully"}
    )


# @api_view(['GET'])
# @permission_classes([IfAdmin])
# def admin_my_orders(request):

    orders = Order.objects.filter(
        items__product__created_by=request.user
    ).distinct().prefetch_related('items__product', 'user')

    data = []
    for order in orders:
        payment = Payment.objects.filter(order=order).first()
        items_data = []
        for item in order.items.all():
            items_data.append({
                'id': item.id,
               
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price': str(item.price),
            })
        data.append({
            'id': order.id,
            'order_number': order.order_number,
            'user': order.user.id,
            'user_name': order.user.username,
            'user_email': order.user.email,
            'total_amount': str(order.total_amount),
            'status': order.status,
            'shipping_address': order.shipping_address,
            'payment_status': payment.payment_status if payment else None,
            'created_at': order.created_at,
            'items': items_data,
        })

    return Response(data)
@api_view(['GET'])
@permission_classes([IfAdmin])
def admin_my_orders(request):

    orders = Order.objects.filter(
        items__product__created_by=request.user
    ).distinct().prefetch_related('items__product', 'user')

    data = []
    for order in orders:
        payment = Payment.objects.filter(order=order).first()

        items_data = []
        for item in order.items.all():
            items_data.append({
                'id': item.id,
                'product_name': item.product.name,
                'product_image': item.product.image, 
                'quantity': item.quantity,
                'price': str(item.price),
            })

        data.append({
            'id': order.id,
            'order_number': order.order_number,
            'user': order.user.id,
            'user_name': order.user.username,
            'user_email': order.user.email,
            'total_amount': str(order.total_amount),
            'status': order.status,
            'shipping_address': order.shipping_address,
            'payment_status': payment.payment_status if payment else None,
            'created_at': order.created_at,
            'items': items_data,
        })

  
    return Response(data)


@api_view(['POST'])
@permission_classes([IfUser])
def checkout(request):
    cart_items = Cart.objects.filter(user=request.user)

    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    shipping_address = request.data.get('shipping_address')
    payment_method = request.data.get('payment_method', 'cod')

    if not shipping_address:
        return Response({'error': 'shipping_address is required'}, status=status.HTTP_400_BAD_REQUEST)

    if payment_method != 'cod':  
        return Response({'error': 'Only COD is allowed for payment'}, status=status.HTTP_400_BAD_REQUEST)

  
    total_amount = 0
    for item in cart_items:
        total_amount += item.product.price * item.quantity

    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order = Order.objects.create(
        user=request.user,
        order_number=order_number,
        total_amount=total_amount,
        shipping_address=shipping_address
    )
    notify_order_placed.delay(order.id)

    # Create Order Items
    for cart_item in cart_items:
        if cart_item.quantity > cart_item.product.stock_quantity:
            order.delete()
            return Response({'error': f'Insufficient stock for {cart_item.product.name}'}, status=status.HTTP_400_BAD_REQUEST)

        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.price
        )

        # Reduce product stock
        cart_item.product.stock_quantity -= cart_item.quantity
        cart_item.product.save()

    # Payment Creation (COD only)
    Payment.objects.create(
        order=order,
        payment_method='cod',
        payment_status='pending'
    )

    # Clear Cart
    cart_items.delete()

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)



@api_view(['PUT'])
@permission_classes([IfAdmin])
def update_payment_status(request, order_id):

    try:
        order = Order.objects.get(id=order_id)

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    try:
        payment = Payment.objects.get(order=order)

    except Payment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=404)

    # Check admin permission
    order_items = order.items.select_related("product")

    allowed = False

    for item in order_items:
        if item.product.created_by == request.user:
            allowed = True
            break

    if not allowed:
        return Response(
            {"error": "You can only update payment for your own products"},
            status=403
        )

    if payment.payment_method != "cod":
        return Response(
            {"error": "Invalid payment method"},
            status=400
        )

    payment.payment_status = "success"
    payment.save()
    notify_payment_success.delay(order.id)
    return Response(
        {"message": "Payment status updated successfully"},
        status=200
    )
    
@api_view(['POST'])
@permission_classes([IfUser])
def cancel_order(request, order_id):
    try:
        order = Order.objects.prefetch_related('items__product').get(
            id=order_id, user=request.user
        )
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


    if order.status == 'cancelled':
        return Response({'error': 'Order already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

   
    if order.status in ['shipped', 'delivered']:
        return Response({'error': 'Order cannot be cancelled after shipping'}, status=status.HTTP_400_BAD_REQUEST)

   
    order.status = 'cancelled'
    order.save()

    
    for item in order.items.all():
        product = item.product
        product.stock_quantity += item.quantity
        product.save()

    return Response({
        "message": "Order cancelled successfully",
        "order_id": order.id,
        "status": order.status
    }, status=status.HTTP_200_OK) 


@api_view(['GET'])
@permission_classes([IfAdmin])
def admin_all_orders_payment_status(request):

    payments = Payment.objects.select_related("order")

    data = []

    for payment in payments:

        data.append({
            "order_id": payment.order.id,
            "order_number": payment.order.order_number,
            "customer": payment.order.user.username,
            "total_amount": payment.order.total_amount,
            "order_status": payment.order.status,
            "payment_method": payment.payment_method,
            "payment_status": payment.payment_status
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IfUser])
def customer_order_status(request):
    orders = Order.objects.filter(user=request.user).prefetch_related(
        'items__product', 'items__product__category'
    ).distinct()
    
    data = []

    for order in orders:
        payment = Payment.objects.filter(order=order).first()

        items_data = []
        for item in order.items.all():
            items_data.append({
                'id': item.id,
                'product_id': item.product.id,
                'product_name': item.product.name,
                'product_image': item.product.image,  
                'category_name': item.product.category.name if item.product.category else None,
                'description': item.product.description,
                'price': str(item.price),
                'quantity': item.quantity,
                'total_price': str(item.get_total_price()),
            })

        data.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": str(order.total_amount),
            "order_status": order.status,
            "shipping_address": order.shipping_address,
            "payment_status": payment.payment_status if payment else None,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items": items_data,
        })

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IfUser | IfAdmin])
def user_profile(request):
    user = request.user
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    allowed_fields = ['username', 'mobile_no', 'address']
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    serializer = UserSerializer(user, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_recommended_products(request, product_id):
    recommended_products = recommend_product(product_id)  
    

    products = Product.objects.filter(id__in=recommended_products)
    
   
    serializer = ProductSerializer(products, many=True)
    
    return Response({'recommended_products': serializer.data})


_model = None
_tfidf = None

@api_view(['POST'])
def predict_price_api(request):
    global _model, _tfidf
    if _model is None or _tfidf is None:
        _model, _tfidf = train_price_prediction_model()

   
    description = request.data.get('description')
    category = request.data.get('category')
    stock_quantity = request.data.get('stock_quantity')

    if not description or not category or not stock_quantity:
        return Response({'error': 'All fields (description, category, stock_quantity) are required'}, status=400)

    
    predicted_price = predict_price(_model, _tfidf, description, category, stock_quantity)

    return Response({'predicted_price': predicted_price}, status=200)





@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IfUser | IfAdmin])

def view_liked_products(request):

    if request.method == 'GET':
        wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
        products = [item.product for item in wishlist_items]
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=200)

    if request.method == 'POST':
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=400)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)
        obj, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if created:
            return Response({"message": "Added to wishlist"}, status=201)
        return Response({"message": "Already in wishlist"}, status=200)

    if request.method == 'DELETE':
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=400)
        deleted, _ = Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response({"message": "Removed from wishlist"}, status=200)
        return Response({"error": "Not in wishlist"}, status=404)




@api_view(['POST'])
@permission_classes([IfUser])
def add_rating(request):
    product_id = request.data.get('product_id')
    rating = request.data.get('rating')
    review = request.data.get('review', '')

    if not product_id or not rating:
        return Response({"error": "Product ID and rating are required"}, status=400)

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return Response({"error": "Rating must be a number"}, status=400)

    if rating not in [1, 2, 3, 4, 5]:
        return Response({"error": "Rating must be between 1 and 5"}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    obj, created = ProductRating.objects.update_or_create(
        user=request.user, product=product,
        defaults={'rating': rating, 'review': review}
    )
    msg = "Rating added" if created else "Rating updated"
    return Response({"message": f"{msg} successfully", "rating": rating}, status=201)


@api_view(['GET'])
def get_product_ratings(request, product_id):
  
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    ratings = ProductRating.objects.filter(product=product).select_related('user').order_by('-created_at')
    data = []
    for r in ratings:
        data.append({
            'id': r.id,
            'user': r.user.username,
            'rating': r.rating,
            'review': r.review,
            'created_at': r.created_at,
        })
    avg = sum(r['rating'] for r in data) / len(data) if data else 0
    return Response({'average': round(avg, 1), 'count': len(data), 'ratings': data}, status=200)




@api_view(['GET'])
@permission_classes([IfUser])
def my_return_requests(request):
   
    from django.utils import timezone as tz
    requests_qs = ReturnRequest.objects.filter(user=request.user).select_related('product', 'order').order_by('-request_date')
    data = []
    for r in requests_qs:
        data.append({
            'id': r.id,
            'product_id': r.product.id,
            'product_name': r.product.name,
            'product_image': r.product.image,
            'order_number': r.order.order_number if r.order else None,
            'reason': r.reason,
            'status': r.status,
            'pickup_date': r.pickup_date,
            'refund_status': r.refund_status,
            'request_date': r.request_date,
        })
    return Response(data, status=200)





@api_view(['POST'])
@permission_classes([IfUser])
def create_return_request(request):
    order_id = request.data['order_id']
    product_id = request.data['product_id']
    
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'delivered':
        return Response({'error': 'Only delivered orders are eligible for returns'}, status=status.HTTP_400_BAD_REQUEST)

    seven_days_ago = timezone.now() - timezone.timedelta(days=7)
    if order.updated_at < seven_days_ago:
        return Response({'error': 'Return window has expired'}, status=status.HTTP_400_BAD_REQUEST)

    
    item = order.items.select_related('product').filter(product__id=product_id).first()
    
    if not item:
        return Response({'error': 'Product not found in the order.'}, status=status.HTTP_400_BAD_REQUEST)
    
    already_requested = ReturnRequest.objects.filter(
        user=request.user, product=item.product, order=order
    ).exclude(status='denied').exists()

    if already_requested:
        return Response({'error': 'Return request already made for this product.'}, status=status.HTTP_400_BAD_REQUEST)


    return_request = ReturnRequest.objects.create(
        user=request.user,
        order=order,
        product=item.product,
        reason=request.data.get('reason', ''),
        status='pending',  
    )
    
    return Response(
        {"message": "Return request created successfully.", "return_request_id": return_request.id},
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IfUser])
def user_view_return_requests(request):
    return_requests = ReturnRequest.objects.filter(user=request.user)
    serializer = ReturnRequestSerializer(return_requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IfUser])
def track_return_status(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id, user=request.user)
        serializer = ReturnRequestSerializer(return_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)
    

@api_view(['PATCH'])
@permission_classes([IfUser ])
def update_pickup_date(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id, user=request.user)
        if return_request.status == 'approved':
            return_request.pickup_date = request.data['pickup_date']
            return_request.save()
            return Response({"message": "Pickup date updated successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "Return request must be approved first."}, status=status.HTTP_400_BAD_REQUEST)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)
    
    
    
@api_view(['PATCH'])
@permission_classes([IfUser ])
def request_refund(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id, user=request.user)
        if return_request.status == 'pickup_in_progress':
            return_request.refund_status = 'pending'
            return_request.save()
            return Response({"message": "Refund request initiated successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "Product pickup must be completed first."}, status=400)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=404)



@api_view(['GET'])
@permission_classes([IfAdmin])  
def admin_view_return_requests(request):
    return_requests = ReturnRequest.objects.all()
    serializer = ReturnRequestSerializer(return_requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['PATCH'])
@permission_classes([IfAdmin])
def approve_return_request(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id)
        if return_request.status == 'pending':
            return_request.status = 'approved' if request.data.get('approve') else 'denied'
            return_request.save()
            return Response({"message": "Return request status updated."}, status=status.HTTP_200_OK)
        return Response({"error": "Return request is already processed."}, status=status.HTTP_400_BAD_REQUEST)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)
    
    
@api_view(['PATCH'])
@permission_classes([IfAdmin])  
def process_pickup(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id)
        if return_request.status == 'approved':
            return_request.status = 'pickup_in_progress'
            return_request.save()
            return Response({"message": "Product pickup in progress."}, status=status.HTTP_200_OK)
        return Response({"error": "Return request must be approved first."}, status=status.HTTP_400_BAD_REQUEST)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)
    
    
    
@api_view(['PATCH'])
@permission_classes([IfAdmin]) 
def process_refund(request, return_request_id):
    try:
        return_request = ReturnRequest.objects.get(id=return_request_id)
        if return_request.status == 'pickup_in_progress':
            return_request.refund_status = 'processed'
            return_request.status = 'completed'
            return_request.save()
            return Response({"message": "Refund processed successfully."}, status=status.HTTP_200_OK)
        if return_request.status == 'completed':
            return Response({"error": "Refund already processed."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Product must be picked up first."}, status=status.HTTP_400_BAD_REQUEST)
    except ReturnRequest.DoesNotExist:
        return Response({"error": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def image_search_view(request):
    from .ml_utils import image_search
    img = request.FILES.get('image')
    if not img:
        return Response({'error': 'No image file provided. Send a file with key "image".'}, status=400)
    try:
        results = image_search(img)  # {exact, similar, suggestion, detected_category}

        product_map = {
            p.id: p for p in Product.objects.filter(
                id__in=[r['id'] for group in [results['exact'], results['similar'], results['suggestion']] for r in group]
            )
        }

        def build_group(entries):
            out = []
            for r in entries:
                p = product_map.get(r['id'])
                if p:
                    d = ProductSerializer(p).data
                    d['similarity_score'] = r['score']
                    out.append(d)
            return out

        return Response({
            'exact':              build_group(results['exact']),
            'similar':            build_group(results['similar']),
            'suggestion':         build_group(results['suggestion']),
            'detected_category':  results.get('detected_category'),
        }, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Image search failed: {str(e)}'}, status=500)
