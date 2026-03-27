
from django.urls import path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from . import views

schema_view = get_schema_view(
   openapi.Info(
      title="E-Commerce API",
      default_version='v1',
      description="API documentation for E-Commerce project",
      terms_of_service="https://www.google.com/policies/terms/",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
   authentication_classes=[],
)

urlpatterns = [
path('registration/', views.register, name='registration'),
path('verify_otp/', views.verify_otp, name='verify_otp'),
path('login/', views.login, name='user_login'),
path('verify_otp_2f/', views.verify_otp_2f, name='verify_otp_2f'),
path('reset_password/', views.reset_password, name='reset_password'),
path('resend_otp/', views.resend_otp, name='resend_otp'),

path('admin_dashboard/', views.admin_dashboard, name='admin_dashboard'),
path('admin_user_list/', views.admin_user_list, name='admin_user_list'),
path('admin_user_detail/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),

path('public/categories/', views.public_category_list, name='public_category_list'),
path('admin/category/create/', views.category_create, name='category_create'),
path('admin/category/<int:category_id>/', views.category_detail_admin, name='category_detail_admin'),
path('admin/category/<int:category_id>/update/', views.category_update, name='category_update'),
path('admin/category/<int:category_id>/delete/', views.category_delete, name='category_delete'),

path('all_products/', views.find_products, name='find_products'),
path('product_list_create/<int:category_id>/', views.product_list_create, name='product_list_create'),
path('product_modify/<int:product_id>/', views.product_modify, name='product_modify'),
path('product_delete/<int:product_id>/', views.product_delete, name='product_delete'),

path('cart/', views.cart_list, name='cart_list'),
path('cart/add/', views.cart_add, name='cart_add'),
path('cart/<int:cart_id>/update/', views.update_cart_item_quantity, name='update_cart_item_quantity'),
path('cart/<int:cart_id>/delete/', views.delete_product_from_cart, name='delete_product_from_cart'),
path('cart/clear/', views.clear_cart, name='clear_cart'),

path('checkout/', views.checkout, name='checkout'),
path('checkout/cancel/<int:order_id>/', views.cancel_order, name='cancel_order'),
path('my-orders/', views.customer_order_status),

path('admin/order/<int:order_id>/status/', views.admin_update_order_status),
path('admin/my-orders/', views.admin_my_orders),

path('payment/status/<int:order_id>/', views.update_payment_status, name='update_payment_status'),
path('admin/orders/payment-status/', views.admin_all_orders_payment_status, name='admin_all_orders_payment_status'),

path('add_comment/<int:product_id>/', views.add_product_comment),
path('comments/<int:product_id>/', views.all_comments),
path('update_by_user/<int:comment_id>/', views.update_comment_by_user),
path('delete_by_user/<int:comment_id>/', views.delete_comment_by_user),
path('reply_to_comment/<int:product_id>/<int:comment_id>/', views.reply_to_comment),
path('admin_delete_comment/<int:comment_id>/', views.admin_delete_comment),

path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
path('profile/', views.user_profile, name='user_profile'),

path('product/<int:product_id>/recommendations/', views.get_recommended_products, name='get_recommended_products'),
path('predict-price/', views.predict_price_api, name='predict_price'),

# Return & Refund
path('create_return_request/', views.create_return_request, name='create_return_request'),
path('user_view_return_requests/', views.user_view_return_requests, name='user_view_return_requests'),
path('user_view_return_request/<int:return_request_id>/', views.user_view_return_requests, name='user_view_return_request'),
path('track_return_status/<int:return_request_id>/', views.track_return_status, name='track_return_status'),
path('update_pickup_date/<int:return_request_id>/', views.update_pickup_date, name='update_pickup_date'),
path('request_refund/<int:return_request_id>/', views.request_refund, name='request_refund'),
path('admin_view_return_requests/', views.admin_view_return_requests, name='admin_view_return_requests'),
path('admin_view_return_request/<int:return_request_id>/', views.admin_view_return_requests, name='admin_view_return_request'),
path('approve_return_request/<int:return_request_id>/', views.approve_return_request, name='approve_return_request'),
path('process_pickup/<int:return_request_id>/', views.process_pickup, name='process_pickup'),
path('process_refund/<int:return_request_id>/', views.process_refund, name='process_refund'),

path('wishlist/', views.view_liked_products, name='view_liked_products'),
path('product-rating/', views.add_rating, name='add_rating'),
path('product-rating/<int:product_id>/', views.get_product_ratings, name='get_product_ratings'),
path('image-search/', views.image_search_view, name='image_search'),
]
