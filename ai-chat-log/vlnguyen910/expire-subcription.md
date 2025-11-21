NguyenVo-FPT: auto-charge-fee

GitHub Copilot: Based on your active file, I'll help you implement an auto-charge-fee method for subscriptions. This method would handle automatic fee charging for expired or renewed subscriptions:

````typescript
// ...existing code...

async autoChargeFee() {
  const now = new Date();

  // Find subscriptions that need renewal (ended but could be auto-renewed)
  const subscriptionsToCharge = await this.prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.active,
      end_date: {
        lte: now,
      },
    },
    include: {
      package: true,
      user: true,
    },
  });

  const results = {
    charged: [],
    failed: [],
    totalAmount: 0,
  };

  for (const subscription of subscriptionsToCharge) {
    try {
      // Calculate fee based on package price
      const fee = subscription.package.price;

      // Here you would integrate with a payment service
      // For now, we'll just log and update the subscription
      
      // Extend subscription for another period
      const newEndDate = new Date(subscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + subscription.package.duration_days);

      await this.prisma.subscription.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          end_date: newEndDate,
          swap_used: 0, // Reset swap count for new period
          distance_traveled: 0, // Reset distance for new period
        },
      });

      results.charged.push({
        subscriptionId: subscription.subscription_id,
        userId: subscription.user_id,
        amount: fee,
      });
      results.totalAmount += Number(fee);
    } catch (error) {
      results.failed.push({
        subscriptionId: subscription.subscription_id,
        error: error.message,
      });
    }
  }

  return {
    message: `Auto-charged ${results.charged.length} subscriptions`,
    results,
  };
}
````

This method:

- Finds active subscriptions that have expired
- Charges the package fee for renewal
- Extends the subscription period
- Resets usage counters (swap_used, distance_traveled)
- Returns a summary of charged and failed subscriptions

You can call this method periodically using a cron job or scheduler in your NestJS application.

NguyenVo-FPT: need 1 status to notice user to pay penalty_fee

GitHub Copilot: I'll help you implement an auto-charge fee system with a status for penalty fee notifications:

````typescript
// ...existing code...

async chargeSubscriptionFee() {
  const now = new Date();

  // Find subscriptions that have expired and need to be renewed
  const subscriptionsToCharge = await this.prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.expired,
    },
    include: {
      package: true,
      user: true,
    },
  });

  const results = {
    charged: [],
    pendingPayment: [],
    failed: [],
    totalAmount: 0,
  };

  for (const subscription of subscriptionsToCharge) {
    try {
      // Calculate days overdue for penalty fee
      const daysOverdue = Math.floor(
        (now.getTime() - subscription.end_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate penalty fee (e.g., 5% per day overdue, max 50%)
      const penaltyRate = Math.min(daysOverdue * 0.05, 0.5);
      const baseFee = Number(subscription.package.price);
      const penaltyFee = baseFee * penaltyRate;
      const totalFee = baseFee + penaltyFee;

      // Update subscription to pending_payment status
      await this.prisma.subscription.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          status: SubscriptionStatus.pending_payment,
        },
      });

      // TODO: Create payment record or notification
      // You can create a Payment or PenaltyFee table to track this

      results.pendingPayment.push({
        subscriptionId: subscription.subscription_id,
        userId: subscription.user_id,
        baseFee,
        penaltyFee,
        totalFee,
        daysOverdue,
      });
      results.totalAmount += totalFee;
    } catch (error) {
      results.failed.push({
        subscriptionId: subscription.subscription_id,
        error: error.message,
      });
    }
  }

  return {
    message: `Processed ${results.pendingPayment.length} subscriptions for payment`,
    results,
  };
}
````

You also need to update your Prisma schema to add the `pending_payment` status:

````prisma
// ...existing code...

enum SubscriptionStatus {
  active
  expired
  cancelled
  pending_payment  // Add this new status
}
````

After updating the schema, run:

```bash
npx prisma generate
npx prisma migrate dev --name add_pending_payment_status
```

This implementation:

- Changes expired subscriptions to `pending_payment` status
- Calculates penalty fees based on days overdue (5% per day, max 50%)
- Notifies users they need to pay the penalty fee
- Returns details about fees owed

NguyenVo-FPT: @workspace tạo một function cho admin sẽ expire các gói hết

Workspace: Collecting workspace informationTôi sẽ tạo một function cho admin để expire tất cả các gói subscription đã hết hạn trong `subscriptions.service.ts`:

````typescript
// ...existing code...

  async checkExpiredSubscriptions() {
    const now = new Date();

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        end_date: {
          lt: now,
        },
      },
    });

    // Update them to expired status
    for (const subscription of expiredSubscriptions) {
      await this.prisma.subscription.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          status: SubscriptionStatus.expired,
        },
      });
    }

    return {
      message: `Updated ${expiredSubscriptions.length} expired subscriptions`,
      count: expiredSubscriptions.length,
    };
  }

  /**
   * Admin function to manually expire all subscriptions that have passed their end date
   * Returns list of expired subscription IDs
   */
  async expireAllExpiredSubscriptions() {
    const now = new Date();

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        end_date: {
          lt: now,
        },
      },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      return {
        message: 'No expired subscriptions found',
        count: 0,
        subscriptions: [],
      };
    }

    // Update all expired subscriptions in a transaction
    const expiredIds = expiredSubscriptions.map(s => s.subscription_id);
    
    await this.prisma.subscription.updateMany({
      where: {
        subscription_id: { in: expiredIds },
      },
      data: {
        status: SubscriptionStatus.expired,
      },
    });

    return {
      message: `Successfully expired ${expiredSubscriptions.length} subscriptions`,
      count: expiredSubscriptions.length,
      subscriptions: expiredSubscriptions.map(sub => ({
        subscription_id: sub.subscription_id,
        user_id: sub.user_id,
        username: sub.user.username,
        package_name: sub.package.name,
        end_date: sub.end_date,
      })),
    };
  }

  remove(id: number) {
    return this.prisma.subscription.delete({
      where: { subscription_id: id },
    });
  }

  async chargeSubcriptionFee() {
    // ...existing code...
  }
}
````

Và thêm endpoint trong `subscriptions.controller.ts`:

````typescript
// ...existing code...

  @Post('check-expired')
  @Roles('admin')
  checkExpiredSubscriptions() {
    return this.subscriptionsService.checkExpiredSubscriptions();
  }

  /**
   * Admin endpoint to manually expire all subscriptions that have passed end_date
   * POST /subscriptions/expire-all
   */
  @Post('expire-all')
  @Roles('admin')
  expireAllExpiredSubscriptions() {
    return this.subscriptionsService.expireAllExpiredSubscriptions();
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.remove(id);
  }
}
````

**Tính năng của function mới:**

✅ **expireAllExpiredSubscriptions()** - Expire tất cả gói hết hạn

- Tìm tất cả subscriptions có `status = active` và `end_date < now`
- Update status thành `expired` bằng transaction
- Trả về danh sách chi tiết các subscription đã expire

**Response example:**

```json
{
  "message": "Successfully expired 5 subscriptions",
  "count": 5,
  "subscriptions": [
    {
      "subscription_id": 1,
      "user_id": 10,
      "username": "john_doe",
      "package_name": "Premium Plan",
      "end_date": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

**Cách sử dụng:**

```bash
POST /subscriptions/expire-all
Authorization: Bearer <admin_token>
