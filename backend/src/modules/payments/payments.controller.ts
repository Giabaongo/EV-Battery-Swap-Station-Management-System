import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { FeeCalculationService } from './services/fee-calculation.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentDto } from './dto/mock-payment.dto';
import { CreatePaymentWithFeesDto } from './dto/create-payment-with-fees.dto';
import {
  CalculateSubscriptionFeeDto,
  CalculateOverchargeFeeDto,
  CalculateDamageFeeDto,
  CalculateComplexFeeDto,
} from './dto/fee-calculation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateDirectPaymentDto } from './dto/create-direct-payment.dto';
import { DirectRenewalPaymentDto } from './dto/direct-renewal-payment.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly feeCalculationService: FeeCalculationService,
  ) { }

  /**
   * ⭐ OLD ENDPOINT - Keep for backward compatibility
   * Create VNPAY payment URL (subscription only - payment_type will be set to 'subscription')
   * POST /payments/create-vnpay-url
   */
  @Post('create-vnpay-url')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create VNPAY payment URL (subscription only - payment_type will be set to "subscription")' })
  @ApiResponse({ status: 201, description: 'The VNPAY payment URL has been successfully created.' })
  async createVnpayUrl(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Force payment_type to 'subscription' for backward compatibility
    createPaymentDto.payment_type = 'subscription' as any;

    return this.paymentsService.createPaymentUrl(createPaymentDto, ipAddr);
  }

  /**
   * ⭐ NEW ENDPOINT - Support multiple payment types
   * Create VNPAY payment URL with flexible payment types
   * POST /payments/create-vnpay-url-advanced
   * 
   * Supported payment_type:
   * - subscription (default)
   * - subscription_with_deposit (first time + deposit)
   * - battery_deposit (only deposit)
   * - battery_replacement (replace battery)
   * - damage_fee (pay damage)
   * - other (misc)
   */
  @Post('create-vnpay-url-advanced')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create VNPAY payment URL with flexible payment types' })
  @ApiResponse({ status: 201, description: 'The VNPAY payment URL has been successfully created.' })
  async createVnpayUrlAdvanced(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return this.paymentsService.createPaymentUrl(createPaymentDto, ipAddr);
  }

  /**
   * VNPAY return URL (redirect from VNPAY)
   * GET /payments/vnpay-return?vnp_Amount=...&vnp_BankCode=...
   */
  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPAY return URL (redirect from VNPAY)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with payment result.' })
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.paymentsService.handleVnpayReturn(query);

      // Redirect to frontend with result
      if (result.status === 'success') {
        const subscriptionId = result.subscription_id || '';
        return res.redirect(
          `${process.env.VNPAY_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/success?subscription_id=${subscriptionId}`,
        );
      } else {
        return res.redirect(
          `${process.env.VNPAY_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/failed?code=${result.vnp_response_code}`,
        );
      }
    } catch (error) {
      return res.redirect(
        `${process.env.VNPAY_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/error?message=${error.message}`,
      );
    }
  }

  /**
   * VNPAY IPN (Instant Payment Notification)
   * GET /payments/vnpay-ipn?vnp_Amount=...&vnp_BankCode=...
   */
  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPAY IPN (Instant Payment Notification)' })
  @ApiResponse({ status: 200, description: 'IPN processed successfully.' })
  async vnpayIPN(@Query() query: any) {
    return this.paymentsService.handleVnpayIPN(query);
  }

  // ==================== MOMO PAYMENT ENDPOINTS ====================

  /**
   * ⭐ MoMo ENDPOINT - Create MoMo payment URL (basic)
   * POST /payments/create-momo-url
   * 
   * Create MoMo payment URL for subscription payment
   * Similar to create-vnpay-url but uses MoMo gateway
   * 
   * Response includes:
   * - payUrl: Browser payment URL
   * - deeplink: Mobile app deep link (for mobile integration)
   * - qrCodeUrl: QR code URL (for scanning)
   */
  @Post('create-momo-url')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create MoMo payment URL (basic subscription payment)' })
  @ApiResponse({ status: 201, description: 'The MoMo payment URL has been successfully created.' })
  async createMoMoUrl(
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    // Force payment_type to 'subscription' for basic endpoint
    createPaymentDto.payment_type = 'subscription' as any;

    return this.paymentsService.createMoMoPaymentUrl(createPaymentDto);
  }

  /**
   * ⭐ MoMo ENDPOINT - Create MoMo payment URL with flexible payment types
   * POST /payments/create-momo-url-advanced
   * 
   * Supported payment_type:
   * - subscription (default)
   * - subscription_with_deposit (first time + deposit)
   * - battery_deposit (only deposit)
   * - battery_replacement (replace battery)
   * - damage_fee (pay damage)
   * - other (misc)
   */
  @Post('create-momo-url-advanced')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create MoMo payment URL with flexible payment types' })
  @ApiResponse({ status: 201, description: 'The MoMo payment URL has been successfully created.' })
  async createMoMoUrlAdvanced(
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createMoMoPaymentUrl(createPaymentDto);
  }

  /**
   * ⭐ MoMo ENDPOINT - Integrated Fee Calculation + MoMo Payment URL
   * POST /payments/calculate-and-create-momo-url
   * 
   * Combines fee calculation with MoMo URL creation in one endpoint
   * Same as calculate-and-create-vnpay-url but uses MoMo gateway
   * 
   * Response includes:
   * - paymentUrl: Ready-to-use MoMo payment URL
   * - deeplink: MoMo app deep link
   * - qrCodeUrl: QR code for MoMo scanning
   * - feeBreakdown: Detailed fee calculation breakdown
   * - payment_id & orderId: For tracking and reconciliation
   */
  @Post('calculate-and-create-momo-url')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Calculate fees and create MoMo payment URL' })
  @ApiResponse({ status: 201, description: 'The MoMo payment URL with calculated fees has been successfully created.' })
  async createMoMoPaymentUrlWithFees(
    @Body() createPaymentWithFeesDto: CreatePaymentWithFeesDto,
  ) {
    return this.paymentsService.createMoMoPaymentUrlWithFees(
      createPaymentWithFeesDto,
    );
  }

  /**
   * MoMo return URL (redirect from MoMo)
   * GET /payments/momo-return?partnerCode=...&orderId=...&resultCode=...
   */
  @Get('momo-return')
  @ApiOperation({ summary: 'MoMo return URL (redirect from MoMo)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with payment result.' })
  async momoReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.paymentsService.handleMoMoReturn(query);

      // Check if result exists
      if (!result) {
        return res.redirect(
          `${process.env.MOMO_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/error?message=Payment not found`,
        );
      }

      // Redirect to frontend with result
      if (result.status === 'success') {
        const subscriptionId = result.subscription_id || '';
        return res.redirect(
          `${process.env.MOMO_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/success?subscription_id=${subscriptionId}`,
        );
      } else {
        // Get resultCode from query params instead of result object
        const resultCode = query.resultCode || 'unknown';
        return res.redirect(
          `${process.env.MOMO_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/failed?code=${resultCode}`,
        );
      }
    } catch (error) {
      return res.redirect(
        `${process.env.MOMO_FRONTEND_URL || 'http://localhost:5173/driver'}/payment/error?message=${error.message}`,
      );
    }
  }

  /**
   * MoMo IPN (Instant Payment Notification)
   * POST /payments/momo-ipn
   * 
   * Note: MoMo IPN uses POST method (different from VNPAY which uses GET)
   */
  @Post('momo-ipn')
  @ApiOperation({ summary: 'MoMo IPN (Instant Payment Notification)' })
  @ApiResponse({ status: 200, description: 'IPN processed successfully.' })
  async momoIPN(@Body() body: any) {
    return this.paymentsService.handleMoMoIPN(body);
  }

  /**
   * ⭐ MoMo ENDPOINT - Query transaction status from MoMo
   * GET /payments/momo-query/:orderId
   * 
   * Query the current status of a MoMo transaction
   * Useful for checking payment status without IPN callback
   */
  @Get('momo-query/:orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Query MoMo transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved successfully.' })
  async queryMoMoStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.queryMoMoTransactionStatus(orderId);
  }

  /**
   * ⭐ Mock MoMo Payment (for testing without real MoMo credentials)
   * POST /payments/mock-momo-payment
   * 
   * Simulates MoMo payment success/failure without calling real MoMo API
   * Use this for testing the complete payment flow locally
   */
  @Post('mock-momo-payment')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Mock MoMo payment for testing (simulates payment without MoMo API)' })
  @ApiResponse({ status: 201, description: 'The MoMo payment has been successfully mocked.' })
  async mockMoMoPayment(
    @Body() body: { orderId: string; success: boolean },
  ) {
    return this.paymentsService.mockMoMoPayment(body.orderId, body.success);
  }

  /**
   * Manual MoMo callback to force payment success and trigger package creation (fallback like VNPAY manual)
   * POST /payments/momo-callback/manual
   */
  @Post('momo-callback/manual')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Manually mark MoMo payment success and trigger post-payment actions' })
  @ApiResponse({ status: 200, description: 'Payment marked successful and post-actions executed.' })
  async manualMoMoCallback(@Body() body: { orderId: string; transId?: string }) {
    return this.paymentsService.manualMoMoCallback(body.orderId, body.transId);
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'The payment with the specified ID.' })
  @UseGuards(AuthGuard, RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  /**
   * Get payment by transaction reference
   * GET /payments/txn/:vnpTxnRef
   */
  @Get('txn/:vnpTxnRef')
  @ApiOperation({ summary: 'Get payment by transaction reference' })
  @ApiResponse({ status: 200, description: 'The payment with the specified transaction reference.' })
  @UseGuards(AuthGuard, RolesGuard)
  findByTxnRef(@Param('vnpTxnRef') vnpTxnRef: string) {
    return this.paymentsService.findByTxnRef(vnpTxnRef);
  }

  /**
   * Get user's payment history
   * GET /payments/user/:userId
   */
  @Get('user/:userId')
  @ApiOperation({ summary: "Get user's payment history" })
  @ApiResponse({ status: 200, description: "List of payments for the specified user." })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentsService.findByUser(userId);
  }

  /**
   * Get all payments (admin)
   * GET /payments
   */
  @Get()
  @ApiOperation({ summary: 'Get all payments (admin)' })
  @ApiResponse({ status: 200, description: 'List of all payments.' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.paymentsService.findAll();
  }

  /**
   * Mock payment for testing (simulate VNPAY without redirect)
   * POST /payments/mock-payment
   */
  @Post('mock-payment')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Mock payment for testing (simulate VNPAY without redirect)' })
  @ApiResponse({ status: 201, description: 'The payment has been successfully mocked.' })
  async mockPayment(@Body() mockPaymentDto: MockPaymentDto) {
    return this.paymentsService.mockPayment(mockPaymentDto);
  }

  /**
   * ⭐ NEW ENDPOINT - Cancel expired pending payments
   * POST /payments/cancel-expired
   * 
   * Manually trigger cancellation of payments that have expired
   */
  @Post('cancel-expired')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cancel expired pending payments' })
  @ApiResponse({ status: 200, description: 'Number of expired payments cancelled.' })
  async cancelExpiredPayments() {
    const count = await this.paymentsService.cancelExpiredPayments();
    return {
      success: true,
      message: `Cancelled ${count} expired payment(s)`,
      count,
    };
  }

  /**
   * ⭐ NEW ENDPOINT - Create payment for battery deposit only
   * POST /payments/battery-deposit
   * 
   * No subscription created, just save deposit
   */
  @Post('battery-deposit')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create payment for battery deposit only' })
  @ApiResponse({ status: 201, description: 'The battery deposit payment has been successfully created.' })
  async createBatteryDepositPayment(
    @Body() body: { user_id: number; amount: number; vehicle_id?: number },
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Create payment DTO with battery_deposit type
    const paymentDto: CreatePaymentDto = {
      user_id: body.user_id,
      vehicle_id: body.vehicle_id,
      payment_type: 'battery_deposit' as any,
    };

    return this.paymentsService.createBatteryDepositPaymentUrl(paymentDto, body.amount, ipAddr);
  }

  /**
   * ⭐ NEW ENDPOINT - Create payment for damage fee
   * POST /payments/damage-fee
   * 
   * Pay for damage without subscription
   */
  @Post('damage-fee')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create payment for damage fee' })
  @ApiResponse({ status: 201, description: 'The damage fee payment has been successfully created.' })
  async createDamageFeePayment(
    @Body() body: { user_id: number; amount: number; vehicle_id?: number; description?: string },
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Create payment DTO with damage_fee type
    const paymentDto: CreatePaymentDto = {
      user_id: body.user_id,
      vehicle_id: body.vehicle_id,
      payment_type: 'damage_fee' as any,
      orderDescription: body.description || 'Thanh toán phí hư hỏng',
    };

    return this.paymentsService.createCustomPaymentUrl(paymentDto, body.amount, ipAddr);
  }

  /**
   * ⭐ NEW ENDPOINT - Create payment for battery replacement
   * POST /payments/battery-replacement
   */
  @Post('battery-replacement')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create payment for battery replacement' })
  @ApiResponse({ status: 201, description: 'The battery replacement payment has been successfully created.' })
  async createBatteryReplacementPayment(
    @Body() body: { user_id: number; amount: number; vehicle_id?: number; description?: string },
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Create payment DTO with battery_replacement type
    const paymentDto: CreatePaymentDto = {
      user_id: body.user_id,
      vehicle_id: body.vehicle_id,
      payment_type: 'battery_replacement' as any,
      orderDescription: body.description || 'Thanh toán thay thế pin',
    };

    return this.paymentsService.createCustomPaymentUrl(paymentDto, body.amount, ipAddr);
  }

  /**
   * ⭐ FEE CALCULATION ENDPOINTS - Tính phí
   */

  /**
   * Calculate subscription + deposit fee (if not paid yet)
   * - Nếu chưa đặt cọc: Tính phí gói + phí cọc (400,000 VNĐ)
   * - Nếu đã đặt cọc: Chỉ tính phí gói
   * POST /payments/calculate/subscription-fee
   */
  @Post('calculate/subscription-fee')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Calculate subscription and deposit fee' })
  @ApiResponse({ status: 200, description: 'The subscription and deposit fee has been successfully calculated.' })
  @Roles('driver', 'admin')
  async calculateSubscriptionFee(@Body() dto: CalculateSubscriptionFeeDto) {
    const fee = await this.feeCalculationService.calculateSubscriptionWithDeposit(
      dto.packageId,
      dto.subscriptionId,
    );
    return {
      ...fee,
      breakdown_text: this.feeCalculationService.getBreakdownText(fee),
    };
  }

  /**
   * Calculate overcharge fee (km vượt quá)
   * POST /payments/calculate/overcharge-fee
   */
  @Post('calculate/overcharge-fee')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Calculate overcharge fee' })
  @ApiResponse({ status: 200, description: 'The overcharge fee has been successfully calculated.' })
  @Roles('driver', 'admin')
  async calculateOverchargeFee(@Body() dto: CalculateOverchargeFeeDto) {
    const fee = await this.feeCalculationService.calculateOverchargeFee(
      dto.subscriptionId,
      dto.actualDistanceTraveled,
    );
    return {
      ...fee,
      breakdown_text: this.feeCalculationService.getBreakdownText(fee),
    };
  }

  /**
   * Calculate damage fee
   * POST /payments/calculate/damage-fee
   */
  @Post('calculate/damage-fee')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Calculate damage fee' })
  @ApiResponse({ status: 200, description: 'The damage fee has been successfully calculated.' })
  async calculateDamageFee(@Body() dto: CalculateDamageFeeDto) {
    const fee = await this.feeCalculationService.calculateDamageFee(dto.damageSeverity);
    return {
      ...fee,
      breakdown_text: this.feeCalculationService.getBreakdownText(fee),
    };
  }

  /**
   * Calculate complex fee (multiple fee types at once)
   * POST /payments/calculate/complex-fee
   */
  @Post('calculate/complex-fee')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Calculate complex fee (multiple fee types at once)' })
  @ApiResponse({ status: 200, description: 'The complex fee has been successfully calculated.' })
  async calculateComplexFee(@Body() dto: CalculateComplexFeeDto) {
    const fee = await this.feeCalculationService.calculateComplexFee(dto);
    return {
      ...fee,
      breakdown_text: this.feeCalculationService.getBreakdownText(fee),
    };
  }

  /**
   * ⭐ NEW ENDPOINT - Integrated Fee Calculation + VNPay Payment URL
   * Combines fee calculation with VNPAY URL creation in one endpoint
   * 
   * Usage Examples:
   * 1. Subscription with deposit:
   *    { "user_id": 1, "package_id": 1, "vehicle_id": 1, "payment_type": "subscription_with_deposit" }
   * 
   * 2. Damage fee:
   *    { "user_id": 1, "package_id": 1, "vehicle_id": 1, "payment_type": "damage_fee", "damage_type": "medium" }
   * 
   * Response includes:
   * - paymentUrl: Ready-to-use VNPAY payment URL
   * - feeBreakdown: Detailed fee calculation breakdown
   * - payment_id & vnp_txn_ref: For tracking and reconciliation
   * 
   * POST /payments/calculate-and-create-vnpay-url
   */
  @Post('calculate-and-create-vnpay-url')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Calculate fees and create VNPAY payment URL' })
  @ApiResponse({ status: 201, description: 'The VNPAY payment URL with calculated fees has been successfully created.' })
  async createPaymentUrlWithFees(
    @Body() createPaymentWithFeesDto: CreatePaymentWithFeesDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    return this.paymentsService.createPaymentUrlWithFees(
      createPaymentWithFeesDto,
      ipAddr,
    );
  }

  /**
 * ⭐ NEW ENDPOINT - Create direct payment with fees (no VNPAY)
 * POST /payments/direct-with-fees
 * 
 * Same as /calculate-and-create-vnpay-url but:
 * - Does NOT redirect to VNPAY
 * - Creates payment with success status immediately
 * - Creates subscription immediately (if applicable)
 * - Calculates and displays full fee breakdown
 * 
 * Use for:
 * - Demo without VNPAY
 * - Testing payment flows
 * - When VNPAY is unavailable
 */
  // @Post('direct-with-fees')
  // @UseGuards(AuthGuard)
  // async createDirectPaymentWithFees(
  //   @Body() createPaymentWithFeesDto: CreateDirectPaymentDto,
  // ) {
  //   return this.paymentsService.createDirectPaymentWithFees(createPaymentWithFeesDto);
  // }

  /**
   * Create subscription renewal payment with penalty fee (via VNPAY)
   * POST /payments/subscription-renewal
   */
  @Post('subscription-renewal')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Create payment for subscription renewal (via VNPAY)' })
  @ApiResponse({ status: 201, description: 'Renewal payment URL created' })
  async createSubscriptionRenewalPayment(
    @Body() body: { subscription_id: number },
    @Req() req: Request,
  ) {
    if (!body.subscription_id) {
      throw new BadRequestException('subscription_id is required');
    }

    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    return this.paymentsService.createSubscriptionRenewalPayment(
      body.subscription_id,
      ipAddr,
    );
  }

  /**
   * ⭐ NEW ENDPOINT - Create direct renewal payment (without VNPAY)
   * POST /payments/direct-renewal
   * 
   * Renew expired subscription directly without VNPAY gateway:
   * - Calculates penalty fee automatically if overcharge exists
   * - Creates payment with success status immediately
   * - Creates new subscription immediately
   * - Marks old subscription as cancelled
   * - Returns detailed fee breakdown
   * 
   * Use cases:
   * - When VNPAY is down/unavailable
   * - Manual payment at station
   * - Testing/demo purposes
   * - Staff-assisted renewals
   * 
   * Request body:
   * {
   *   "subscription_id": 1,
   *   "payment_method": "cash", // optional: cash, bank_transfer, credit_card
   *   "order_info": "Gia hạn gói trực tiếp", // optional
   *   "transaction_id": "CUSTOM_TXN_123" // optional (auto-generated if not provided)
   * }
   */
  @Post('direct-renewal')
  @ApiOperation({ summary: 'Renew subscription directly without VNPAY' })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription renewed successfully with direct payment',
    schema: {
      example: {
        success: true,
        payment: {
          payment_id: 123,
          amount: 250000,
          method: 'cash',
          status: 'success',
          transaction_id: 'DIRECT_RENEWAL_20250121123456'
        },
        oldSubscription: {
          subscription_id: 1,
          end_date: '2025-01-15T00:00:00.000Z',
          distance_traveled: 550,
          base_distance: 500
        },
        newSubscription: {
          subscription_id: 124,
          start_date: '2025-01-21T00:00:00.000Z',
          end_date: '2025-02-20T00:00:00.000Z',
          status: 'active'
        },
        feeBreakdown: {
          baseAmount: 200000,
          penaltyFee: 50000,
          totalAmount: 250000,
          breakdown_text: 'Gói: 200.000 VND, Phí phạt: 50.000 VND, Tổng: 250.000 VND'
        },
        message: 'Subscription renewed successfully with penalty fee: 50.000 VND'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Only expired subscriptions can be renewed' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async createDirectRenewalPayment(
    @Body() directRenewalDto: DirectRenewalPaymentDto,
  ) {
    return this.paymentsService.createDirectRenewalPayment(directRenewalDto);
  }
}


