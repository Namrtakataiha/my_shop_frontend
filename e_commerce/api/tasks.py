from celery import shared_task
from django.core.cache import cache
from .models import Product, ProductComment
from .serializers import ProductSerializer, ProductCommentSerializer
import logging
from  .models import *

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3, 'countdown': 5})
def notify_product_created(self, product_id, action="created"):
    try:
        product = Product.objects.get(id=product_id)

        if action == "created":
            logger.info(f"Admin added new product: {product.name}")

        if action == "updated":
            logger.info(f"Product updated: {product.name}")

        # Notify all users
        users = User.objects.filter(role="user")

        for user in users:
            logger.info(
                f"Notification to {user.email}: "
                f"{product.name} available for ₹{product.price}. Buy now!"
            )

        return f"Notification sent for product {product_id}"

    except Product.DoesNotExist:
        return "Product not found"
    
@shared_task
def notify_order_status_updated(order_id, status_value):

    from .models import Order

    try:
        order = Order.objects.get(id=order_id)

        logger.info(
            f"User {order.user.email}: Your order {order.order_number} "
            f"status updated to {status_value}"
        )

        for item in order.items.select_related("product"):
            admin = item.product.created_by

            logger.info(
                f"Admin {admin.email}: Order {order.order_number} "
                f"status updated to {status_value}"
            )

    except Order.DoesNotExist:
        logger.error("Order not found")
    
    
@shared_task
def notify_order_placed(order_id):

    from .models import Order

    try:
        order = Order.objects.get(id=order_id)

        # find all admins related to ordered products
        for item in order.items.select_related("product"):

            admin = item.product.created_by

            logger.info(
                f"Admin {admin.email} notification: "
                f"You received a new order for {item.product.name}"
            )

    except Order.DoesNotExist:
        logger.error("Order not found")
        
@shared_task
def notify_payment_success(order_id):

    from .models import Order

    try:
        order = Order.objects.get(id=order_id)

        logger.info(
            f"User {order.user.email}: Payment successful for order {order.order_number}"
        )

        for item in order.items.select_related("product"):
            admin = item.product.created_by

            logger.info(
                f"Admin {admin.email}: Payment received for order {order.order_number}"
            )

    except Order.DoesNotExist:
        logger.error("Order not found")
        

@shared_task
def notify_comment_added(comment_id):
    comment = ProductComment.objects.get(id=comment_id)
    logger.info(
        f"New comment by {comment.user} on product {comment.product.id}"
    )


@shared_task
def warmup_product_cache(product_id):
    try:
        product = Product.objects.get(id=product_id)
        serializer = ProductSerializer(product)
        cache.set(
            f"product_{product_id}",
            serializer.data,
            timeout=300
        )
    except Product.DoesNotExist:
        pass


@shared_task
def warmup_product_comments_cache(product_id):
    comments = ProductComment.objects.filter(
        product_id=product_id,
        parent=None
    ).order_by("-created_at")

    serializer = ProductCommentSerializer(comments, many=True)

    cache.set(
        f"product_comments_{product_id}",
        serializer.data,
        timeout=300
    )


@shared_task
def notify_reply_added(parent_comment_id, reply_id):
    try:
        parent = ProductComment.objects.get(id=parent_comment_id)
        reply = ProductComment.objects.get(id=reply_id)

        logger.info(
            f"User {reply.user} replied to comment {parent.id}"
        )
    except ProductComment.DoesNotExist:
        pass


@shared_task
def notify_return_approved(return_request_id):
    """Notify customer that return was approved + pickup date set."""
    try:
        rr = ReturnRequest.objects.select_related('user', 'product').get(id=return_request_id)
        pickup = rr.pickup_date.strftime('%d %b %Y, %I:%M %p') if rr.pickup_date else 'TBD'
        logger.info(
            f"[RETURN APPROVED] Customer {rr.user.email}: "
            f"Your return request for '{rr.product.name}' has been approved. "
            f"Pickup scheduled: {pickup}"
        )
        # Notify seller too
        seller = rr.product.created_by
        if seller:
            logger.info(
                f"[RETURN APPROVED] Seller {seller.email}: "
                f"Return approved for '{rr.product.name}' by {rr.user.username}. "
                f"Pickup: {pickup}"
            )
    except Exception as e:
        logger.error(f"notify_return_approved error: {e}")


@shared_task
def notify_return_completed(return_request_id):
    """Notify both parties that return is completed and refund is processed."""
    try:
        rr = ReturnRequest.objects.select_related('user', 'product').get(id=return_request_id)
        logger.info(
            f"[RETURN COMPLETED] Customer {rr.user.email}: "
            f"Your product '{rr.product.name}' has been successfully returned. "
            f"Refund has been processed to your original payment method."
        )
        seller = rr.product.created_by
        if seller:
            logger.info(
                f"[RETURN COMPLETED] Seller {seller.email}: "
                f"Product '{rr.product.name}' returned by {rr.user.username}. "
                f"Refund of ₹{rr.product.price} processed."
            )
    except Exception as e:
        logger.error(f"notify_return_completed error: {e}")
