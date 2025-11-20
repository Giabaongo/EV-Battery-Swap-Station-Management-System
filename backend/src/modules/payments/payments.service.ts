import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentDto } from './dto/mock-payment.dto';
import { CreatePaymentWithFeesDto, PaymentWithFeesResponse } from './dto/create-payment-with-fees.dto';
import { vnpayConfig } from './config/vnpay.config';
import {
  validateVNPayParams,
  generateSecureHash,
  logVNPayParams,
  sortObject,
} from './utils/vnpay.utils';
import * as crypto from 'crypto';
import * as qs from 'qs';
import moment from 'moment';
import { PaymentMethod, PaymentStatus, PaymentType, SubscriptionStatus } from '@prisma/client';
import { FeeCalculationService } from './services/fee-calculation.service';
import { BatteryServicePackagesService } from '../battery-service-packages/battery-service-packages.service';
import { CreateDirectPaymentDto } from './dto/create-direct-payment.dto';
import { DirectRenewalPaymentDto } from './dto/direct-renewal-payment.dto';
import { CreatePenaltyPaymentDto } from './dto/penalty-payment.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SystemConfigService } from '../config/system-config.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: DatabaseService,
    @Inject(FeeCalculationService)
    private feeCalculationService: FeeCalculationService,
    private systemConfigService: SystemConfigService,
  ) { }

  /**
   * Calculate payment expiry time from database config (loaded at startup)
   */
  private getPaymentExpiryTime(): Date {
    const expiryMinutes = this.systemConfigService.getNumber(
      'Payment_Expiry_Minutes',
      15, // Default fallback
    );
    return moment().add(expiryMinutes, 'minutes').toDate();
  }

  /**
   * Auto-cancel expired pending payments
   */
  async cancelExpiredPayments(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.payment.updateMany({
      where: {
        status: PaymentStatus.pending,
        expires_at: {
          lt: now, // Less than now = expired
        },
      },
      data: {
        status: PaymentStatus.cancelled,
      },
    });

    if (result.count > 0) {
      console.log(`🕐 Auto-cancelled ${result.count} expired payment(s)`);
    }

    return result.count;
  }


  /**
   * Create VNPAY payment URL for subscription
   */
  async createPaymentUrl(createPaymentDto: CreatePaymentDto, ipAddr: string) {
    // 1. Get package information (if package_id exists)
    let servicePackage: any = null;
    let amount: number;

    if (createPaymentDto.package_id) {
      servicePackage = await this.prisma.batteryServicePackage.findUnique({
        where: { package_id: createPaymentDto.package_id },
      });

      if (!servicePackage) {
        throw new NotFoundException('Package not found');
      }

      if (!servicePackage.active) {
        throw new BadRequestException('Package is not active');
      }

      amount = Math.floor(servicePackage.base_price.toNumber() * 100);
    } else if (createPaymentDto.payment_type !== 'subscription' && createPaymentDto.payment_type !== 'subscription_with_deposit') {
      // Nếu không có package_id và không phải subscription, cần lấy amount từ đâu đó
      amount = 0; // TODO: Xác định amount dựa trên payment_type
    } else {
      throw new BadRequestException('package_id is required for subscription payment');
    }

    // 2. Create payment record with pending status
    const vnpTxnRef = moment().format('DDHHmmss');
    const expiresAt = this.getPaymentExpiryTime(); // Sync call now

    const payment = await this.prisma.payment.create({
      data: {
        user_id: createPaymentDto.user_id,
        package_id: createPaymentDto.package_id,
        vehicle_id: createPaymentDto.vehicle_id,
        amount: servicePackage?.base_price || 0,
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: createPaymentDto.payment_type as any,
        vnp_txn_ref: vnpTxnRef,
        expires_at: expiresAt,
        order_info:
          createPaymentDto.orderDescription ||
          (servicePackage ? `Thanh toan goi ${servicePackage.name}` : `Thanh toan ${createPaymentDto.payment_type}`),
      },
    });

    // 3. Build VNPAY payment URL
    const createDate = moment().format('YYYYMMDDHHmmss');

    // Build params - values will be encoded by sortObject()
    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: createPaymentDto.language || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: payment.order_info,
      vnp_OrderType: 'other',
      vnp_Amount: amount, // Already multiplied by 100 at line 44
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort and encode params (VNPAY style)
    vnpParams = sortObject(vnpParams);

    // Create signature from encoded query string
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature to params
    vnpParams['vnp_SecureHash'] = signed;

    // Log for debugging
    console.log('========== VNPAY Payment URL Generation ==========');
    console.log('TMN_CODE:', vnpayConfig.vnp_TmnCode);
    console.log('Secret (first 15 chars):', vnpayConfig.vnp_HashSecret.substring(0, 15) + '...');
    console.log('Sign data:', signData);
    console.log('Signature:', signed);

    // Build payment URL
    const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnpParams, { encode: false });

    console.log('Final payment URL:', paymentUrl);
    console.log('==================================================');

    return {
      paymentUrl,
      payment_id: payment.payment_id,
      vnp_txn_ref: vnpTxnRef,
      debug_params: {
        ...sortObject(vnpParams),
        vnp_SecureHash: signed,
      }, // For debugging
    };
  }

  /**
   * Handle VNPAY return callback
   */
  async handleVnpayReturn(vnpParams: any) {
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort and encode params (VNPAY style)
    const sortedParams = sortObject(vnpParams);

    // Verify signature
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      throw new BadRequestException('Invalid signature');
    }

    // Get payment record
    const payment = await this.prisma.payment.findUnique({
      where: { vnp_txn_ref: vnpParams['vnp_TxnRef'] },
      include: {
        package: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check response code
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionStatus = vnpParams['vnp_TransactionStatus'];

    let paymentStatus: PaymentStatus;
    if (responseCode === '00' && transactionStatus === '00') {
      paymentStatus = PaymentStatus.success;
    } else {
      paymentStatus = PaymentStatus.failed;
    }

    // Update payment record
    const updatedPayment = await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        status: paymentStatus,
        transaction_id: vnpParams['vnp_TransactionNo'],
        vnp_response_code: responseCode,
        vnp_bank_code: vnpParams['vnp_BankCode'],
        vnp_card_type: vnpParams['vnp_CardType'],
        payment_time: moment(
          vnpParams['vnp_PayDate'],
          'YYYYMMDDHHmmss',
        ).toDate(),
      },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // If payment successful, handle based on payment_type
    if (paymentStatus === PaymentStatus.success) {
      await this.handleSuccessfulPayment(payment);
    }

    return updatedPayment;
  }

  /**
   * Handle successful payment based on payment_type
   */
  private async handleSuccessfulPayment(payment: any) {
    const paymentType = payment.payment_type;

    switch (paymentType) {
      case 'subscription':
        // Thanh toán gói đăng ký thường
        await this.createSubscriptionFromPayment(payment);
        break;

      case 'subscription_with_deposit':
        // Thanh toán gói + tiền đặt cọc pin
        // Tách số tiền: gói đăng ký + phí đặt cọc pin
        await this.createSubscriptionWithDeposit(payment);
        break;

      case 'subscription_renewal':  // NEW CASE
        await this.handleSubscriptionRenewalPayment(payment);
        break;

      case 'battery_deposit':
        // Chỉ thanh toán tiền đặt cọc pin - không tạo subscription
        console.log(`Battery deposit payment processed for user ${payment.user_id}`);
        // Có thể lưu thông tin deposit vào user hoặc bảng khác
        break;

      case 'battery_replacement':
        // Thanh toán thay thế pin
        console.log(`Battery replacement payment processed for user ${payment.user_id}`);
        // Xử lý logic thay thế pin
        break;

      case 'damage_fee':
        // Thanh toán phí hư hỏng
        console.log(`Damage fee payment processed for user ${payment.user_id}`);
        // Xử lý logic phí hư hỏng
        break;

      case 'other':
      default:
        console.log(`Other payment type processed for user ${payment.user_id}`);
        break;
    }
  }

  /**
   * Create subscription from standard subscription payment
   */
  private async createSubscriptionFromPayment(payment: any) {
    if (!payment.package) return;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + payment.package.duration_days);

    const subscription = await this.prisma.subscription.create({
      data: {
        user_id: payment.user_id,
        package_id: payment.package_id || 0,
        vehicle_id: payment.vehicle_id, // Assign vehicle_id from payment
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        swap_used: 0,
      },
    });

    // Link payment to subscription
    await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: { subscription_id: subscription.subscription_id },
    });

    return subscription;
  }

  /**
   * Create subscription with deposit payment
   * Tách tiền thanh toán: phí gói + phí đặt cọc pin
   * Đánh dấu deposit_paid = true
   */
  private async createSubscriptionWithDeposit(payment: any) {
    if (!payment.package) return;

    // Ở đây bạn có thể tách tiền thành 2 phần:
    // - Phần 1: Tiền gói đăng ký (package.base_price)
    // - Phần 2: Tiền đặt cọc pin (được lấy từ ConfigService)

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + payment.package.duration_days);

    const subscription = await this.prisma.subscription.create({
      data: {
        user_id: payment.user_id,
        package_id: payment.package_id || 0,
        vehicle_id: payment.vehicle_id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        swap_used: 0,
        deposit_paid: true, // Đã thanh toán cọc
      },
    });

    // Link payment to subscription
    await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: { subscription_id: subscription.subscription_id },
    });

    return subscription;
  }

  /**
   * Create payment URL for battery deposit (no package required)
   */
  async createBatteryDepositPaymentUrl(createPaymentDto: CreatePaymentDto, amount: number, ipAddr: string) {
    // 1. Create payment record with pending status
    const vnpTxnRef = moment().format('DDHHmmss');

    const payment = await this.prisma.payment.create({
      data: {
        user_id: createPaymentDto.user_id,
        vehicle_id: createPaymentDto.vehicle_id,
        amount: amount,
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: 'battery_deposit' as any,
        vnp_txn_ref: vnpTxnRef,
        order_info: createPaymentDto.orderDescription || 'Nạp tiền cọc pin',
      },
    });

    // 2. Build VNPAY payment URL
    return this._buildVnpayUrl(payment, vnpTxnRef, amount, ipAddr);
  }

  /**
   * Create payment URL for custom amount (damage fee, battery replacement, etc.)
   */
  async createCustomPaymentUrl(createPaymentDto: CreatePaymentDto, amount: number, ipAddr: string) {
    // 1. Create payment record with pending status
    const vnpTxnRef = moment().format('DDHHmmss');

    const payment = await this.prisma.payment.create({
      data: {
        user_id: createPaymentDto.user_id,
        vehicle_id: createPaymentDto.vehicle_id,
        amount: amount,
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: createPaymentDto.payment_type as any,
        vnp_txn_ref: vnpTxnRef,
        order_info: createPaymentDto.orderDescription || `Thanh toán ${createPaymentDto.payment_type}`,
      },
    });

    // 2. Build VNPAY payment URL
    return this._buildVnpayUrl(payment, vnpTxnRef, amount, ipAddr);
  }

  /**
   * Helper method to build VNPAY URL
   */
  private _buildVnpayUrl(payment: any, vnpTxnRef: string, amount: number, ipAddr: string) {
    const createDate = moment().format('YYYYMMDDHHmmss');
    const amountCents = Math.floor(amount * 100);

    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: payment.order_info,
      vnp_OrderType: 'other',
      vnp_Amount: amountCents,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;

    const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnpParams, { encode: false });

    return {
      paymentUrl,
      payment_id: payment.payment_id,
      vnp_txn_ref: vnpTxnRef,
    };
  }


  async handleVnpayIPN(vnpParams: any) {
    try {
      await this.handleVnpayReturn(vnpParams);

      return {
        RspCode: '00',
        Message: 'Confirm Success',
      };
    } catch (error) {
      return {
        RspCode: '99',
        Message: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get payment by ID
   */
  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { payment_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        package: true,
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Get user's payment history
   */
  async findByUser(userId: number) {
    return this.prisma.payment.findMany({
      where: { user_id: userId },
      include: {
        package: true,
        subscription: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get all payments (admin)
   */
  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        package: true,
        subscription: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Query payment by transaction reference
   */
  async findByTxnRef(vnpTxnRef: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { vnp_txn_ref: vnpTxnRef },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        package: true,
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with TxnRef ${vnpTxnRef} not found`,
      );
    }

    return payment;
  }

  /**
  /**
   * Mock payment for testing (simulate VNPAY flow without redirect)
   */
  async mockPayment(mockPaymentDto: MockPaymentDto) {
    console.log('🔍 mockPayment called with:', {
      user_id: mockPaymentDto.user_id,
      package_id: mockPaymentDto.package_id,
      payment_type: mockPaymentDto.payment_type,
      vehicle_id: mockPaymentDto.vehicle_id,
    });

    // 1. Get package information
    const servicePackage = await this.prisma.batteryServicePackage.findUnique({
      where: { package_id: mockPaymentDto.package_id },
    });

    if (!servicePackage) {
      throw new NotFoundException('Package not found');
    }

    if (!servicePackage.active) {
      throw new BadRequestException('Package is not active');
    }

    console.log('✅ Package found:', servicePackage.name);

    // 2. Check if user has existing subscription for this vehicle (to determine deposit status)
    let existingSubscription: any = null;
    if (mockPaymentDto.vehicle_id) {
      // First, validate that vehicle exists and belongs to user
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { vehicle_id: mockPaymentDto.vehicle_id },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${mockPaymentDto.vehicle_id} not found`);
      }

      if (vehicle.user_id !== mockPaymentDto.user_id) {
        throw new BadRequestException(`Vehicle does not belong to this user`);
      }

      existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          user_id: mockPaymentDto.user_id,
          vehicle_id: mockPaymentDto.vehicle_id,
          status: SubscriptionStatus.active,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    // 3. Calculate fee based on fee type (same logic as createPaymentUrlWithFees)
    let feeAmount = 0;
    let feeBreakdownText = '';
    let feeDetails: any = {
      baseAmount: servicePackage.base_price.toNumber(),
      totalAmount: 0,
    };

    // Call appropriate fee calculation method
    switch (mockPaymentDto.payment_type) {
      case 'subscription_with_deposit':
        // Check deposit status from existing subscription
        const depositResult = await this.feeCalculationService.calculateSubscriptionWithDeposit(
          mockPaymentDto.package_id,
          existingSubscription?.subscription_id, // Pass subscription_id to check deposit status
        );
        feeAmount = depositResult.deposit_fee;

        // Update breakdown text based on whether deposit is included
        if (depositResult.deposit_fee > 0) {
          feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND, Cọc: ${depositResult.deposit_fee.toLocaleString('vi-VN')} VND, Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
        } else {
          feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND (Đã đặt cọc trước đó), Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
        }
        feeDetails.depositFee = depositResult.deposit_fee;
        feeDetails.depositAlreadyPaid = existingSubscription?.deposit_paid || false;
        break;

      case 'battery_replacement':
        // Nếu có distance_traveled, tính overcharge fee
        if (mockPaymentDto.distance_traveled) {
          // Cần subscription_id - nếu không có, skip overcharge
          // Trong trường hợp này, ta sẽ không tính overcharge vì không có subscription context
          feeAmount = 0;
          feeBreakdownText = `Thanh toán thay pin: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
        }
        break;

      case 'damage_fee':
        if (mockPaymentDto.damage_type) {
          // Map damage_type từ DTO sang service (low->minor, medium->moderate, high->severe)
          const damageTypeMapping = {
            'low': 'minor',
            'medium': 'moderate',
            'high': 'severe',
          };
          const mappedDamageType = damageTypeMapping[mockPaymentDto.damage_type] as 'minor' | 'moderate' | 'severe';

          const damageResult = await this.feeCalculationService.calculateDamageFee(mappedDamageType);
          feeAmount = damageResult.damage_fee;
          feeBreakdownText = `Phí hư hỏng: ${damageResult.damage_fee.toLocaleString('vi-VN')} VND`;
          feeDetails.damageFee = damageResult.damage_fee;
        }
        break;

      case 'subscription':
      case 'other':
      default:
        // Không tính phí, chỉ dùng giá gói
        feeAmount = 0;
        feeBreakdownText = `Tổng tiền: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
        break;
    }

    // 4. Calculate total amount
    const totalAmount = servicePackage.base_price.toNumber() + feeAmount;
    feeDetails.totalAmount = totalAmount;
    feeDetails.breakdown_text = feeBreakdownText;

    console.log('💰 Fee calculation:', {
      baseAmount: feeDetails.baseAmount,
      feeAmount,
      totalAmount,
      breakdown: feeBreakdownText,
    });

    // 5. Create payment record with calculated total amount
    const vnpTxnRef = moment().format('DDHHmmss');
    const expiresAt = this.getPaymentExpiryTime();
    const responseCode = mockPaymentDto.vnp_response_code || '00'; // Default success

    const payment = await this.prisma.payment.create({
      data: {
        user_id: mockPaymentDto.user_id,
        package_id: mockPaymentDto.package_id,
        vehicle_id: mockPaymentDto.vehicle_id,
        amount: totalAmount, // Total amount including fee
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: mockPaymentDto.payment_type as any,
        vnp_txn_ref: vnpTxnRef,
        expires_at: expiresAt,
        order_info: `Mock payment for ${servicePackage.name}${feeAmount > 0 ? ' + phí' : ''}`,
      },
    });

    console.log('✅ Payment record created:', {
      payment_id: payment.payment_id,
      vnp_txn_ref: vnpTxnRef,
      amount: totalAmount,
      expires_at: expiresAt,
    });

    // 6. Simulate VNPAY response
    const mockVnpParams = {
      vnp_Amount: (totalAmount * 100).toString(), // Use total amount
      vnp_BankCode: mockPaymentDto.vnp_bank_code || 'NCB',
      vnp_BankTranNo: `MOCK${moment().format('YYYYMMDDHHmmss')}`,
      vnp_CardType: mockPaymentDto.vnp_card_type || 'ATM',
      vnp_OrderInfo: payment.order_info || '',
      vnp_PayDate: moment().format('YYYYMMDDHHmmss'),
      vnp_ResponseCode: responseCode,
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_TransactionNo: `${Date.now()}`,
      vnp_TransactionStatus: responseCode === '00' ? '00' : '01',
      vnp_TxnRef: vnpTxnRef,
    };

    // 7. Determine payment status
    let paymentStatus: PaymentStatus;
    if (responseCode === '00') {
      paymentStatus = PaymentStatus.success;
    } else if (responseCode === '24') {
      paymentStatus = PaymentStatus.cancelled;
    } else {
      paymentStatus = PaymentStatus.failed;
    }

    // 8. Update payment
    const updatedPayment = await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        status: paymentStatus,
        transaction_id: mockVnpParams.vnp_TransactionNo,
        vnp_response_code: responseCode,
        vnp_bank_code: mockVnpParams.vnp_BankCode,
        vnp_card_type: mockVnpParams.vnp_CardType,
        payment_time: moment(
          mockVnpParams.vnp_PayDate,
          'YYYYMMDDHHmmss',
        ).toDate(),
      },
      include: {
        package: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // 9. If success, create subscription (only for subscription payment types)
    let subscription: any = null;
    const isSubscriptionPayment = ['subscription', 'subscription_with_deposit'].includes(mockPaymentDto.payment_type || '');

    if (paymentStatus === PaymentStatus.success && isSubscriptionPayment && servicePackage) {
      // Validate vehicle_id for subscription payments
      if (!mockPaymentDto.vehicle_id) {
        throw new BadRequestException('vehicle_id is required for subscription payments');
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + servicePackage.duration_days);

      // Determine if deposit was paid in this payment
      const depositPaidInThisPayment = mockPaymentDto.payment_type === 'subscription_with_deposit' && feeAmount > 0;

      subscription = await this.prisma.subscription.create({
        data: {
          user_id: mockPaymentDto.user_id,
          package_id: mockPaymentDto.package_id,
          vehicle_id: mockPaymentDto.vehicle_id,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          swap_used: 0,
          deposit_paid: depositPaidInThisPayment || existingSubscription?.deposit_paid || false,
        },
        include: {
          package: true,
          vehicle: true,
        },
      });

      console.log('✅ Subscription created:', {
        subscription_id: subscription.subscription_id,
        deposit_paid: subscription.deposit_paid,
      });

      // Link payment to subscription
      if (subscription) {
        await this.prisma.payment.update({
          where: { payment_id: payment.payment_id },
          data: { subscription_id: subscription.subscription_id },
        });
      }
    }

    return {
      success: paymentStatus === PaymentStatus.success,
      payment: updatedPayment,
      subscription,
      feeBreakdown: feeDetails,
      mock_response: mockVnpParams,
      message:
        paymentStatus === PaymentStatus.success
          ? 'Payment successful' + (subscription ? ', subscription created' : '')
          : paymentStatus === PaymentStatus.cancelled
            ? 'Payment cancelled by user'
            : 'Payment failed',
    };
  }

  /**
   * Create VNPAY payment URL with integrated fee calculation
   *
   * Flow:
   * 1. Get package base price
   * 2. Calculate fee amount based on fee type and parameters
   * 3. Create payment record with total amount (base + fee)
   * 4. Generate VNPAY URL with calculated total amount
   * 5. Return payment URL, payment ID, and fee breakdown
   */
  async createPaymentUrlWithFees(
    createPaymentWithFeesDto: CreatePaymentWithFeesDto,
    ipAddr: string,
  ): Promise<PaymentWithFeesResponse> {
    console.log('🔍 createPaymentUrlWithFees called with:', {
      user_id: createPaymentWithFeesDto.user_id,
      package_id: createPaymentWithFeesDto.package_id,
      payment_type: createPaymentWithFeesDto.payment_type,
      vehicle_id: createPaymentWithFeesDto.vehicle_id,
    });

    // 1. Get package information
    const servicePackage = await this.prisma.batteryServicePackage.findUnique({
      where: { package_id: createPaymentWithFeesDto.package_id },
    });

    if (!servicePackage) {
      throw new NotFoundException('Package not found');
    }

    if (!servicePackage.active) {
      throw new BadRequestException('Package is not active');
    }

    console.log('✅ Package found:', servicePackage.name);

    // 2. Check if user has existing subscription for this vehicle (to determine deposit status)
    let existingSubscription: any = null;
    if (createPaymentWithFeesDto.vehicle_id) {
      // First, validate that vehicle exists and belongs to user
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { vehicle_id: createPaymentWithFeesDto.vehicle_id },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${createPaymentWithFeesDto.vehicle_id} not found`);
      }

      if (vehicle.user_id !== createPaymentWithFeesDto.user_id) {
        throw new BadRequestException(`Vehicle does not belong to this user`);
      }

      existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          user_id: createPaymentWithFeesDto.user_id,
          vehicle_id: createPaymentWithFeesDto.vehicle_id,
          status: SubscriptionStatus.active,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    // 3. Calculate fee based on fee type
    let feeAmount = 0;
    let feeBreakdownText = '';
    let feeDetails: any = {
      baseAmount: servicePackage.base_price.toNumber(),
      totalAmount: 0,
    };

    // Call appropriate fee calculation method
    switch (createPaymentWithFeesDto.payment_type) {
      case 'subscription_with_deposit':
        // Check deposit status from existing subscription
        const depositResult = await this.feeCalculationService.calculateSubscriptionWithDeposit(
          createPaymentWithFeesDto.package_id,
          existingSubscription?.subscription_id, // Pass subscription_id to check deposit status
        );
        feeAmount = depositResult.deposit_fee;

        // Update breakdown text based on whether deposit is included
        if (depositResult.deposit_fee > 0) {
          feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND, Cọc: ${depositResult.deposit_fee.toLocaleString('vi-VN')} VND, Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
        } else {
          feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND (Đã đặt cọc trước đó), Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
        }
        feeDetails.depositFee = depositResult.deposit_fee;
        feeDetails.depositAlreadyPaid = existingSubscription?.deposit_paid || false;
        break;

      case 'battery_replacement':
        // Nếu có distance_traveled, tính overcharge fee
        if (createPaymentWithFeesDto.distance_traveled) {
          // Cần subscription_id - nếu không có, skip overcharge
          // Trong trường hợp này, ta sẽ không tính overcharge vì không có subscription context
          feeAmount = 0;
          feeBreakdownText = `Thanh toán thay pin: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
        }
        break;

      case 'damage_fee':
        if (createPaymentWithFeesDto.damage_type) {
          // Map damage_type từ DTO sang service (low->minor, medium->moderate, high->severe)
          const damageTypeMapping = {
            'low': 'minor',
            'medium': 'moderate',
            'high': 'severe',
          };
          const mappedDamageType = damageTypeMapping[createPaymentWithFeesDto.damage_type] as 'minor' | 'moderate' | 'severe';

          const damageResult = await this.feeCalculationService.calculateDamageFee(mappedDamageType);
          feeAmount = damageResult.damage_fee;
          feeBreakdownText = `Phí hư hỏng: ${damageResult.damage_fee.toLocaleString('vi-VN')} VND`;
          feeDetails.damageFee = damageResult.damage_fee;
        }
        break;

      case 'subscription':
      case 'other':
      default:
        // Không tính phí, chỉ dùng giá gói
        feeAmount = 0;
        feeBreakdownText = `Tổng tiền: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
        break;
    }

    // 3. Calculate total amount
    const totalAmount = servicePackage.base_price.toNumber() + feeAmount;
    feeDetails.totalAmount = totalAmount;
    feeDetails.breakdown_text = feeBreakdownText;

    // 4. Create payment record with calculated total amount
    const vnpTxnRef = moment().format('DDHHmmss');
    const expiresAt = this.getPaymentExpiryTime();

    const payment = await this.prisma.payment.create({
      data: {
        user_id: createPaymentWithFeesDto.user_id,
        package_id: createPaymentWithFeesDto.package_id,
        vehicle_id: createPaymentWithFeesDto.vehicle_id,
        amount: totalAmount, // Total amount including fee
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: createPaymentWithFeesDto.payment_type as any,
        vnp_txn_ref: vnpTxnRef,
        expires_at: expiresAt,
        order_info:
          createPaymentWithFeesDto.order_info ||
          `Thanh toan ${servicePackage.name}${feeAmount > 0 ? ' + phí' : ''}`,
      },
    });

    console.log('✅ Payment record created:', {
      payment_id: payment.payment_id,
      vnp_txn_ref: vnpTxnRef,
      amount: totalAmount,
      expires_at: expiresAt,
    });

    // 5. Build VNPAY payment URL with total amount
    const createDate = moment().format('YYYYMMDDHHmmss');
    const vnpAmount = Math.floor(totalAmount * 100); // Convert to VND cents

    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: createPaymentWithFeesDto.language || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: payment.order_info,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort and encode params (VNPAY style)
    vnpParams = sortObject(vnpParams);

    // Create signature from encoded query string
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature to params
    vnpParams['vnp_SecureHash'] = signed;

    // Log for debugging
    console.log('========== VNPAY Payment URL with Fees ==========');
    console.log('Base Amount:', feeDetails.baseAmount);
    console.log('Fee Amount:', feeAmount);
    console.log('Total Amount:', totalAmount);
    console.log('Payment Type:', createPaymentWithFeesDto.payment_type);
    console.log('Fee Breakdown:', feeBreakdownText);
    console.log('VNPay Amount (cents):', vnpAmount);

    // Build payment URL
    const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnpParams, { encode: false });

    return {
      payment_id: payment.payment_id,
      paymentUrl,
      vnp_txn_ref: vnpTxnRef,
      feeBreakdown: {
        baseAmount: feeDetails.baseAmount,
        depositFee: feeDetails.depositFee,
        overchargeFee: feeDetails.overchargeFee,
        damageFee: feeDetails.damageFee,
        totalAmount: feeDetails.totalAmount,
        breakdown_text: feeDetails.breakdown_text,
      },
      paymentInfo: {
        user_id: payment.user_id,
        package_id: payment.package_id ?? 0,
        vehicle_id: payment.vehicle_id ?? 0,
        payment_type: payment.payment_type,
        status: payment.status,
        created_at: payment.created_at.toISOString(),
      },
    };
  }

  /**
   * Create direct payment with fees calculation (without VNPAY)
   * This method:
   * 1. Calculates fees based on payment_type
   * 2. Creates payment record with success status immediately
   * 3. Creates subscription immediately (if applicable)
   * 4. Returns detailed fee breakdown
   *
   * Use for: Demo, testing, or when VNPAY is unavailable
   */
  // async createDirectPaymentWithFees(
  //   createPaymentWithFeesDto: CreateDirectPaymentDto,
  // ): Promise<{
  //   success: boolean;
  //   payment: any;
  //   subscription?: any;
  //   feeBreakdown: any;
  //   message: string;
  // }> {
  //   try {
  //     // 1. Get package information
  //     const servicePackage = await this.prisma.batteryServicePackage.findUnique({
  //       where: { package_id: createPaymentWithFeesDto.package_id },
  //     });

  //     if (!servicePackage) {
  //       throw new NotFoundException('Package not found');
  //     }

  //     if (!servicePackage.active) {
  //       throw new BadRequestException('Package is not active');
  //     }

  //     const existingSubscription = await this.subscriptionsService.findOneByVehicleId(createPaymentWithFeesDto.vehicle_id);
  //     if (existingSubscription && existingSubscription.status === SubscriptionStatus.active) {
  //       throw new BadRequestException('This vehicle is already have a subscription, choose other vehicle or cancle current subscription')
  //     }

  //     // 2. Calculate fee based on fee type (same logic as createPaymentUrlWithFees)
  //     let feeAmount = 0;
  //     let feeBreakdownText = '';
  //     let feeDetails: any = {
  //       baseAmount: servicePackage.base_price.toNumber(),
  //       totalAmount: 0,
  //     };

  //     // Call appropriate fee calculation method
  //     switch (createPaymentWithFeesDto.payment_type) {
  //       case 'subscription_with_deposit':
  //         const depositResult = await this.feeCalculationService.calculateSubscriptionWithDeposit(
  //           createPaymentWithFeesDto.package_id,
  //           existingSubscription?.subscription_id, // Pass subscription_id to check deposit status
  //         );
  //         feeAmount = depositResult.deposit_fee;

  //         // Update breakdown text based on whether deposit is included
  //         if (depositResult.deposit_fee > 0) {
  //           feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND, Cọc: ${depositResult.deposit_fee.toLocaleString('vi-VN')} VND, Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
  //         } else {
  //           feeBreakdownText = `Gói: ${depositResult.breakdown.package_price.toLocaleString('vi-VN')} VND (Đã đặt cọc trước đó), Tổng: ${depositResult.total_fee.toLocaleString('vi-VN')} VND`;
  //         }
  //         feeDetails.depositFee = depositResult.deposit_fee;
  //         feeDetails.depositAlreadyPaid = existingSubscription?.deposit_paid || false;
  //         break;

  //       case 'battery_replacement':
  //         if (createPaymentWithFeesDto.distance_traveled) {
  //           feeAmount = 0;
  //           feeBreakdownText = `Thanh toán thay pin: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
  //         }
  //         break;

  //       case 'subscription':
  //       case 'other':
  //       default:
  //         feeAmount = 0;
  //         feeBreakdownText = `Tổng tiền: ${servicePackage.base_price.toNumber().toLocaleString('vi-VN')} VND`;
  //         break;
  //     }

  //     // 3. Calculate total amount
  //     const totalAmount = servicePackage.base_price.toNumber() + feeAmount;
  //     feeDetails.totalAmount = totalAmount;
  //     feeDetails.breakdown_text = feeBreakdownText;

  //     // 4. Create payment record with SUCCESS status (direct payment confirmed)
  //     const payment = await this.prisma.payment.create({
  //       data: {
  //         user_id: createPaymentWithFeesDto.user_id,
  //         package_id: createPaymentWithFeesDto.package_id,
  //         vehicle_id: createPaymentWithFeesDto.vehicle_id,
  //         amount: totalAmount, // Total amount including fee
  //         method: PaymentMethod.cash, // Direct payment method
  //         status: PaymentStatus.success, // Immediate success
  //         payment_type: createPaymentWithFeesDto.payment_type as any,
  //         payment_time: new Date(),
  //         transaction_id: `DIRECT${moment().format('YYYYMMDDHHmmss')}`,
  //         order_info:
  //           createPaymentWithFeesDto.order_info ||
  //           `Direct payment for ${servicePackage.name}${feeAmount > 0 ? ' + fees' : ''}`,
  //       },
  //       include: {
  //         package: true,
  //       },
  //     });

  //     // 5. Create subscription immediately (if payment_type requires it)
  //     let subscription: any = null;

  //     if (
  //       createPaymentWithFeesDto.payment_type === 'subscription' ||
  //       createPaymentWithFeesDto.payment_type === 'subscription_with_deposit'
  //     ) {
  //       const startDate = new Date();
  //       const endDate = new Date(startDate);
  //       endDate.setDate(endDate.getDate() + servicePackage.duration_days);

  //       // Set deposit_paid = true if payment type includes deposit
  //       const depositPaid = createPaymentWithFeesDto.payment_type === 'subscription_with_deposit';

  //       subscription = await this.prisma.subscription.create({
  //         data: {
  //           user_id: createPaymentWithFeesDto.user_id,
  //           package_id: createPaymentWithFeesDto.package_id,
  //           vehicle_id: createPaymentWithFeesDto.vehicle_id,
  //           start_date: startDate,
  //           end_date: endDate,
  //           status: 'active',
  //           swap_used: 0,
  //           deposit_paid: depositPaid, // Set based on payment type
  //         },
  //         include: {
  //           package: true,
  //           vehicle: true,
  //         },
  //       });

  //       // Link payment to subscription
  //       await this.prisma.payment.update({
  //         where: { payment_id: payment.payment_id },
  //         data: { subscription_id: subscription.subscription_id },
  //       });
  //     }

  //     // 6. Return detailed response
  //     return {
  //       success: true,
  //       payment: {
  //         ...payment,
  //         subscription_id: subscription?.subscription_id,
  //       },
  //       subscription,
  //       feeBreakdown: {
  //         baseAmount: feeDetails.baseAmount,
  //         depositFee: feeDetails.depositFee,
  //         overchargeFee: feeDetails.overchargeFee,
  //         damageFee: feeDetails.damageFee,
  //         totalAmount: feeDetails.totalAmount,
  //         breakdown_text: feeDetails.breakdown_text,
  //       },
  //       message: subscription
  //         ? 'Direct payment with fees processed successfully and subscription created'
  //         : 'Direct payment with fees processed successfully',
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  /**
   * Create payment for subscription renewal (includes penalty fee)
   * POST /payments/subscription-renewal
   */
  async createSubscriptionRenewalPayment(
    subscriptionId: number,
    ipAddr: string,
  ): Promise<PaymentWithFeesResponse> {
    // 1. Get old subscription
    const oldSubscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: subscriptionId },
      include: { package: true },
    });

    if (!oldSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (oldSubscription.status !== SubscriptionStatus.expired) {
      throw new BadRequestException('Only expired subscriptions can be renewed');
    }

    const vehicleId = oldSubscription.vehicle_id;
    const userId = oldSubscription.user_id;

    // 2. Calculate penalty fee
    const overChargeFee = await this.feeCalculationService.calculateOverchargeFee(
      oldSubscription.subscription_id,
    );

    let penaltyFee = overChargeFee.overcharge_fee;
    const baseDistance = oldSubscription.package?.base_distance || 0;

    // 3. Calculate total amount
    const basePrice = oldSubscription.package?.base_price.toNumber() || 0;
    const totalAmount = basePrice + penaltyFee;

    // 4. Create payment record
    const vnpTxnRef = moment().format('DDHHmmss');
    const expiresAt = this.getPaymentExpiryTime();

    const payment = await this.prisma.payment.create({
      data: {
        user_id: userId,
        package_id: oldSubscription.package_id,
        vehicle_id: vehicleId,
        amount: totalAmount,
        method: PaymentMethod.vnpay,
        status: PaymentStatus.pending,
        payment_type: PaymentType.subscription,
        vnp_txn_ref: vnpTxnRef,
        expires_at: expiresAt,
        order_info: `Gia han goi ${oldSubscription.package.name}${penaltyFee > 0 ? ' + phat' : ''}`,
      },
    });

    // 5. Build VNPAY URL
    const createDate = moment().format('YYYYMMDDHHmmss');
    const vnpAmount = Math.floor(totalAmount * 100);

    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: payment.order_info,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    vnpParams = sortObject(vnpParams);
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;
    const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnpParams, { encode: false });

    return {
      payment_id: payment.payment_id,
      paymentUrl,
      vnp_txn_ref: vnpTxnRef,
      feeBreakdown: {
        baseAmount: basePrice,
        depositFee: 0,
        overchargeFee: 0,
        damageFee: penaltyFee, // Penalty fee shown as damage fee
        totalAmount: totalAmount,
        breakdown_text: `Goi: ${basePrice.toLocaleString('vi-VN')} VND, Phat: ${penaltyFee.toLocaleString('vi-VN')} VND, Tong: ${totalAmount.toLocaleString('vi-VN')} VND`,
      },
      paymentInfo: {
        user_id: payment.user_id,
        package_id: payment.package_id ?? 0,
        vehicle_id: payment.vehicle_id ?? 0,
        payment_type: payment.payment_type,
        status: payment.status,
        created_at: payment.created_at.toISOString(),
      },
    };
  }

  /**
   * Handle subscription renewal payment success
   * Called from handleVnpayReturn()
   */
  private async handleSubscriptionRenewalPayment(payment: any) {
    if (!payment.package) return;

    // Get old subscription
    const oldSubscription = await this.prisma.subscription.findFirst({
      where: {
        user_id: payment.user_id,
        package_id: payment.package_id,
        status: SubscriptionStatus.expired,
      },
      orderBy: { end_date: 'desc' },
    });

    if (!oldSubscription) {
      console.warn('Original expired subscription not found for renewal');
      return;
    }

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + payment.package.duration_days);

    const newSubscription = await this.prisma.subscription.create({
      data: {
        user_id: payment.user_id,
        package_id: payment.package_id,
        vehicle_id: payment.vehicle_id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        swap_used: 0,
        distance_traveled: 0,
        deposit_paid: oldSubscription.deposit_paid,
      },
    });

    this.logger.log(`New subscription created with ID: ${newSubscription.subscription_id}`);

    // Link payment to new subscription
    await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: { subscription_id: newSubscription.subscription_id },
    });

  }

  /**
   * Create direct renewal payment (without VNPAY)
   * This method:
   * 1. Gets expired subscription
   * 2. Calculates penalty fee if any
   * 3. Creates payment with success status immediately
   * 4. Creates new subscription immediately
   * 5. Returns detailed breakdown
   */
  async createDirectRenewalPayment(
    directRenewalDto: DirectRenewalPaymentDto,
  ): Promise<{
    success: boolean;
    payment: any;
    oldSubscription: any;
    newSubscription: any;
    feeBreakdown: any;
    message: string;
  }> {
    // 1. Get old subscription
    const oldSubscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: directRenewalDto.subscription_id },
      include: { package: true, vehicle: true },
    });

    if (!oldSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (oldSubscription.status !== SubscriptionStatus.expired) {
      throw new BadRequestException('Only expired subscriptions can be renewed');
    }

    // 2. Calculate penalty fee
    const overChargeFee = await this.feeCalculationService.calculateOverchargeFee(
      oldSubscription.subscription_id,
    );

    const penaltyFee = overChargeFee.overcharge_fee;
    const basePrice = oldSubscription.package?.base_price.toNumber() || 0;
    const totalAmount = basePrice + penaltyFee;

    this.logger.log(`💰 Renewal fee calculation: Base=${basePrice}, Penalty=${penaltyFee}, Total=${totalAmount}`);

    // 3. Create payment record with SUCCESS status (direct payment confirmed)
    const payment = await this.prisma.payment.create({
      data: {
        user_id: oldSubscription.user_id,
        package_id: oldSubscription.package_id,
        vehicle_id: oldSubscription.vehicle_id,
        amount: totalAmount,
        method: directRenewalDto.payment_method || PaymentMethod.cash,
        status: PaymentStatus.success, // Immediate success
        payment_type: PaymentType.subscription,
        payment_time: new Date(),
        transaction_id: directRenewalDto.transaction_id || `DIRECT_RENEWAL_${moment().format('YYYYMMDDHHmmss')}`,
        order_info:
          directRenewalDto.order_info ||
          `Direct renewal for ${oldSubscription.package.name}${penaltyFee > 0 ? ' + penalty fee' : ''}`,
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

    this.logger.log(`✅ Direct renewal payment created: ${payment.payment_id}`);

    // 4. Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + oldSubscription.package.duration_days);

    const newSubscription = await this.prisma.subscription.create({
      data: {
        user_id: oldSubscription.user_id,
        package_id: oldSubscription.package_id,
        vehicle_id: oldSubscription.vehicle_id,
        start_date: startDate,
        end_date: endDate,
        status: SubscriptionStatus.active,
        swap_used: 0,
        distance_traveled: 0,
        deposit_paid: oldSubscription.deposit_paid, // Keep deposit status
      },
      include: {
        package: true,
        vehicle: true,
      },
    });

    this.logger.log(`✅ New subscription created: ${newSubscription.subscription_id}`);

    // 5. Link payment to new subscription
    await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: { subscription_id: newSubscription.subscription_id },
    });

    // 6. Mark old subscription as cancelled
    await this.prisma.subscription.update({
      where: { subscription_id: oldSubscription.subscription_id },
      data: { status: SubscriptionStatus.cancelled },
    });

    this.logger.log(`✅ Old subscription marked as cancelled: ${oldSubscription.subscription_id}`);

    // 7. Return detailed response
    return {
      success: true,
      payment,
      oldSubscription: {
        subscription_id: oldSubscription.subscription_id,
        end_date: oldSubscription.end_date,
        distance_traveled: oldSubscription.distance_traveled,
        base_distance: oldSubscription.package?.base_distance || 0,
      },
      newSubscription,
      feeBreakdown: {
        baseAmount: basePrice,
        penaltyFee: penaltyFee,
        totalAmount: totalAmount,
        breakdown_text: `Gói: ${basePrice.toLocaleString('vi-VN')} VND${penaltyFee > 0 ? `, Phí phạt: ${penaltyFee.toLocaleString('vi-VN')} VND` : ''}, Tổng: ${totalAmount.toLocaleString('vi-VN')} VND`,
      },
      message: `Subscription renewed successfully${penaltyFee > 0 ? ` with penalty fee: ${penaltyFee.toLocaleString('vi-VN')} VND` : ''}`,
    };
  }

  /**
   * Create direct penalty payment (without subscription renewal)
   * User chỉ muốn thanh toán phí phạt, không gia hạn gói
   *
   * Flow:
   * 1. Get subscription (status = expired or pending_penalty_payment)
   * 2. Calculate penalty fee (overcharge fee)
   * 3. Create payment with success status
   * 4. Update subscription status to 'expired' (payment cleared)
   * 5. DO NOT create new subscription
   */
  async createDirectPenaltyPayment(
    penaltyDto: CreatePenaltyPaymentDto,
  ): Promise<{
    success: boolean;
    payment: any;
    subscription: any;
    penaltyAmount: number;
    message: string;
  }> {
    // 1. Get subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: penaltyDto.subscription_id },
      include: { package: true, vehicle: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Allow payment for both 'expired' and 'pending_penalty_payment' status
    if (subscription.status !== SubscriptionStatus.pending_penalty_payment) {
      throw new BadRequestException('Only expired or pending_penalty_payment subscriptions can pay penalty');
    }

    // 2. Calculate penalty fee
    const overChargeFee = await this.feeCalculationService.calculateOverchargeFee(
      subscription.subscription_id,
    );

    const penaltyAmount = overChargeFee.overcharge_fee;

    // if (penaltyAmount === 0) {
    //   throw new BadRequestException('No penalty fee to pay (distance not exceeded)');
    // }

    this.logger.log(`💰 Penalty fee calculation: ${penaltyAmount} VND for subscription ${subscription.subscription_id}`);

    // 3. Create payment record with SUCCESS status
    const payment = await this.prisma.payment.create({
      data: {
        user_id: subscription.user_id,
        package_id: subscription.package_id,
        vehicle_id: subscription.vehicle_id,
        amount: penaltyAmount,
        method: penaltyDto.payment_method || PaymentMethod.cash,
        status: PaymentStatus.success,
        payment_type: PaymentType.damage_fee, // Use damage_fee type for penalty
        payment_time: new Date(),
        transaction_id: penaltyDto.transaction_id || `PENALTY_${moment().format('YYYYMMDDHHmmss')}`,
        order_info:
          penaltyDto.order_info ||
          `Penalty fee for subscription ${subscription.subscription_id} - ${subscription.package.name}`,
        subscription_id: subscription.subscription_id, // Link to subscription
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

    this.logger.log(`✅ Penalty payment created: ${payment.payment_id} - Amount: ${penaltyAmount}`);

    // 4. Update subscription status back to 'expired' (penalty paid, but subscription still expired)
    const updatedSubscription = await this.prisma.subscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        status: SubscriptionStatus.expired, // Change from pending_penalty_payment to expired
      },
      include: {
        package: true,
        vehicle: true,
      },
    });

    this.logger.log(`✅ Subscription status updated to 'expired': ${subscription.subscription_id}`);

    return {
      success: true,
      payment,
      subscription: updatedSubscription,
      penaltyAmount,
      message: `Penalty fee paid successfully: ${penaltyAmount.toLocaleString('vi-VN')} VND. Subscription remains expired.`,
    };
  }
}


