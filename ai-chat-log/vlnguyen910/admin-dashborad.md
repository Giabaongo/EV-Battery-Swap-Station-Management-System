NguyenVo-FPT: @workspace thêm thống kê về số lần hủy theo gói trong tháng

Workspace: Collecting workspace informationTôi sẽ thêm thống kê về số lần hủy subscription theo gói trong tháng vào admin-statistics.service.ts:

````typescript
// ...existing code...

  /**
   * Get subscription cancellation stats for current month
   */
  async getCurrentMonthCancellations() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const cancelledSubscriptions = await this.databaseService.subscription.findMany({
      where: {
        status: 'cancelled',
        updated_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            base_price: true,
          },
        },
      },
    });

    const byPackage = cancelledSubscriptions.reduce((acc, sub) => {
      const packageId = sub.package?.package_id || 0;
      const packageName = sub.package?.name || 'Unknown';
      const basePrice = Number(sub.package?.base_price || 0);
      
      if (!acc[packageId]) {
        acc[packageId] = {
          package_id: packageId,
          package_name: packageName,
          base_price: basePrice,
          cancellation_count: 0,
          lost_revenue: 0,
        };
      }
      
      acc[packageId].cancellation_count++;
      acc[packageId].lost_revenue += basePrice;
      
      return acc;
    }, {} as Record<number, any>);

    // Sort by cancellation count descending
    const sortedByPackage = Object.values(byPackage)
      .sort((a: any, b: any) => b.cancellation_count - a.cancellation_count);

    // Calculate total lost revenue
    const totalLostRevenue = cancelledSubscriptions.reduce((sum, sub) => {
      return sum + Number(sub.package?.base_price || 0);
    }, 0);

    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      total_cancellations: cancelledSubscriptions.length,
      total_lost_revenue: totalLostRevenue,
      by_package: sortedByPackage,
      top_cancelled_package: sortedByPackage[0] || null,
    };
  }

// ...existing code...
````

## 🎯 Những thay đổi:

### 1. **Enhanced Package Details:**
- Thêm `package_id` để định danh rõ ràng
- Thêm `base_price` để tính toán doanh thu bị mất

### 2. **Detailed Statistics per Package:**
````typescript
{
  package_id: 1,
  package_name: "Monthly Subscription",
  base_price: 99000,
  cancellation_count: 5,      // Số lần hủy
  lost_revenue: 495000         // Doanh thu bị mất
}
````

### 3. **Additional Metrics:**
- `total_lost_revenue`: Tổng doanh thu bị mất do hủy subscription
- `top_cancelled_package`: Gói bị hủy nhiều nhất trong tháng
- `by_package`: Danh sách sắp xếp theo số lượng hủy giảm dần

### 4. **Response Example:**
````json
{
  "month": 1,
  "year": 2025,
  "total_cancellations": 15,
  "total_lost_revenue": 1485000,
  "by_package": [
    {
      "package_id": 2,
      "package_name": "Monthly Subscription",
      "base_price": 99000,
      "cancellation_count": 8,
      "lost_revenue": 792000
    },
    {
      "package_id": 1,
      "package_name": "Pay-Per-Swap",
      "base_price": 15000,
      "cancellation_count": 7,
      "lost_revenue": 105000
    }
  ],
  "top_cancelled_package": {
    "package_id": 2,
    "package_name": "Monthly Subscription",
    "base_price": 99000,
    "cancellation_count": 8,
    "lost_revenue": 792000
  }
}
````

Thống kê này giúp admin:
- 📊 Xác định gói nào bị hủy nhiều nhất
- 💰 Tính toán doanh thu bị mất
- 📈 Phân tích xu hướng hủy subscription
- 🎯 Đưa ra quyết định cải thiện gói dịch vụ