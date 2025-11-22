# Config table - huong dan

## Cau truc bang `configs`
- `config_id` (serial, PK)
- `type` (enum: deposit | penalty | service_fee | swap_fee | late_fee | damage_fee | system | other)
- `name` (varchar 100, unique)
- `value` (decimal(12,2), nullable) — dung cho so tien/phi
- `string_value` (varchar 255, nullable) — dung cho boolean/so dang chuoi cho system configs
- `description` (varchar 500, nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, updatedAt)
- Index: unique `name`, index `type`

## Cac config bat buoc phai co
### Nhom he thong (type = system, dung `string_value`)
- `Payment_Expiry_Enabled`: "true" | "false" — bat/tat auto-cancel payment het han (PaymentExpiryTask)
- `Payment_Expiry_Minutes`: so phut het han (vi du: "15") — duoc doc tai `PaymentsService.getPaymentExpiryTime()`
- `Payment_Expiry_Check_Interval`: so phut giua cac lan cron kiem tra (vi du: "5") — doc trong `PaymentExpiryTask`

### Nhom dat lich (type = other/late_fee, dung `value`)
- `Reservation Max Time`: gia tri phut cho phep dat lich tu thoi diem hien tai (vi du: 30); doc tai `reservations.service.ts`

### Nhom phi/coc/phat (type = deposit/penalty/service_fee/swap_fee/late_fee/damage_fee, dung `value`)
- `Battery_Deposit_Default` (deposit): 400000 — phi coc pin mac dinh
- `Hourly_Late_Fee` (late_fee): 5000 — phu phi tra tre theo gio
- `Swap_Service_Fee` (service_fee): 2000 — phi moi giao dich swap
- `Battery_Damage_Penalty` (penalty): 50000 — phat hu hong pin
- `Equipment_Loss_Penalty` (penalty): 100000 — phat mat thiet bi
- `Express_Swap_Fee` (swap_fee): 5000 — phi swap nhanh
- `Minor_Damage_Fee` (damage_fee): 10000 — phat hu hong nhe
- `Overcharge_Fee_Tier1` (penalty): 216 — don gia/km vuot <=2000km
- `Overcharge_Fee_Tier2` (penalty): 195 — don gia/km vuot 2001-4000km
- `Overcharge_Fee_Tier3` (penalty): 173 — don gia/km vuot >4000km

## Cach nap du lieu
- File seed co san: `backend/prisma/seed-configs.ts` (cac phi/coc/phat) va `backend/prisma/seed-payment-configs.ts` (cac key Payment_Expiry_*) — file Payment seed dang bi comment, can mo len khi dung.
- Neu tu nhap tay, dam bao `type` dung enum va:
  - Config he thong -> set `string_value`, co the de `value` null.
  - Config so tien -> set `value` (decimal), co the de `string_value` null.
- Config he thong duoc nap vao RAM khi khoi dong qua `SystemConfigService`; thay doi can restart server.

## Noi code dang su dung
- He thong het han thanh toan: `src/modules/payments/payments.service.ts` (getPaymentExpiryTime), `src/modules/payments/tasks/payment-expiry.task.ts` (cron, boolean + interval).
- Dat lich: `src/modules/reservations/reservations.service.ts` (Reservation Max Time).
- Tinh phi phat/tien vuot km/hu hong: `src/modules/payments/services/fee-calculation.service.ts` (cac tier Overcharge + Damage/Loss + Minor Damage).
