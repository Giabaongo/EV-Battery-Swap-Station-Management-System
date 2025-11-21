# Tài liệu thiết kế API (rút gọn)

- **Base URL:** `https://<host>/api/v1`
- **Xác thực:** JWT Bearer (`Authorization: Bearer <token>`) với `AuthGuard` + `RolesGuard` ở hầu hết module nghiệp vụ. Các endpoint công khai được ghi chú riêng.
- **Quy ước chung:** DTO đã được validate bằng `ValidationPipe` (chỉ nhận field hợp lệ, auto-transform kiểu).

## Auth (`/auth`)
| Method | Đường dẫn | Bảo vệ | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/login` | Public | Đăng nhập, trả `accessToken` + `user`, set cookie `refreshToken`. Body: `LoginDto { email, password }`. |
| POST | `/register` | Public | Tạo tài khoản mới (`RegisterDto`). |
| POST | `/refresh` | Cookie | Đọc `refreshToken` từ cookie, trả access token mới. |
| GET | `/google` | GoogleAuthGuard | Chuyển hướng người dùng đến Google OAuth. |
| GET | `/google/callback` | GoogleAuthGuard | Nhận user Google, phát hành token rồi redirect về frontend (`GOOGLE_FRONTEND_RETURN`). |
| GET | `/verify-email?token=` | Public | Xác minh email. |
| POST | `/resend-verification` | Public | Gửi lại mail xác thực (`{ email }`). |
| POST | `/forget-password` | Public | Gửi mail reset password. |
| POST | `/reset-password` | Public | Đặt lại mật khẩu bằng token (`ResetPasswordDto`). |

## Users (`/users`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth + Roles | Tạo user mới (`CreateUserDto`). |
| GET | `/` | Admin | Liệt kê toàn bộ người dùng. |
| GET | `/me/profile` | Auth | Lấy hồ sơ user hiện tại từ JWT. |
| GET | `/:id` | Auth | Lấy user theo ID. |
| PATCH | `/:id` | Auth | Cập nhật thông tin (`UpdateUserDto`). |
| PATCH | `/change-password` | Auth | Đổi mật khẩu user hiện tại (`ChangePasswordDto`). |
| DELETE | `/:id` | Auth | Xóa user. |

## Vehicles (`/vehicles`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo xe (`CreateVehicleDto`). |
| GET | `/user/:id` | Auth | Danh sách xe theo user. |
| GET | `/vin/:vin` | Auth | Tra cứu xe theo VIN. |
| GET | `/:id` | Auth | Lấy chi tiết xe. |
| PATCH | `/add-vehicle` | Driver/Admin | Lấy VIN trong body, map với user lấy từ JWT. |
| PATCH | `/assign-vehicle` | Admin | Gán xe cho user bất kỳ (`AssignVehicleDto`). |
| PATCH | `/:id` | Auth | Cập nhật xe. |
| DELETE | `/:id` | Admin | Xóa xe. |

## Stations (`/stations`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Admin, Station Staff | Tạo trạm mới (`CreateStationDto`). |
| GET | `/` | Auth | Lọc theo `status` (tùy chọn). |
| GET | `/active` | Auth | Danh sách trạm đang hoạt động. |
| GET | `/search?name=` | Auth | Tìm kiếm theo tên. |
| POST | `/available` | Driver | Tìm trạm khả dụng theo bộ lọc vị trí/thời gian (`findAvailibaleStationsDto`). |
| GET | `/:id` | Auth | Lấy chi tiết trạm. |
| PATCH | `/:id` | Admin, Station Staff | Cập nhật trạm. |
| DELETE | `/:id` | Admin | Xóa trạm. |

## Batteries (`/batteries`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo pin (`CreateBatteryDto`). |
| GET | `/` | Auth | Danh sách pin. |
| GET | `/best` | Auth | Trả pin phù hợp nhất cho `vehicle_id` và `station_id` (body). |
| GET | `/station/:station_id` | Auth | Danh sách pin tại trạm. |
| GET | `/:id` | Auth | Lấy chi tiết pin. |
| DELETE | `/:id` | Auth | Xóa pin. |

## Swapping (`/swapping`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/automatic-swap` | Auth (nếu áp) | Thực hiện quy trình đổi pin tự động (`SwappingDto`). |
| POST | `/initialize-battery` | Auth | Khởi tạo pin lần đầu (`FirstSwapDto`). |

## Swap Transactions (`/swap-transactions`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Ghi nhận giao dịch đổi pin. |
| GET | `/` | Admin | Danh sách giao dịch. |
| GET | `/user/:user_id` | Driver | Lịch sử giao dịch của user. |
| GET | `/station/:station_id` | Admin, Station Staff | Giao dịch tại trạm. |
| GET | `/transaction/:id` | Admin | Chi tiết giao dịch. |
| PATCH | `/:id` | Admin | Cập nhật trạng thái (`UpdateSwapTransactionDto`). |
| DELETE | `/:id` | Admin | Xóa giao dịch. |

## Reservations (`/reservations`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Driver | Đặt slot đổi pin (`CreateReservationDto`). |
| GET | `/user/:id` | Driver | Lịch sử đặt chỗ của người lái. |
| GET | `/station/:id` | Station Staff | Đặt chỗ cho trạm. |
| GET | `/:id` | Auth | Chi tiết đặt chỗ. |
| PATCH | `/:id` | Auth | Đổi trạng thái (body: `user_id`, `status`). |
| DELETE | `/:id` | Auth | Hủy đặt chỗ. |

## Supports (`/supports`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Public | Tạo yêu cầu hỗ trợ (`CreateSupportDto`). |
| GET | `/` | Public | Danh sách yêu cầu. |
| GET | `/statistics` | Public | Số liệu thống kê. |
| GET | `/user/:userId` | Public | Yêu cầu của user. |
| GET | `/station/:stationId` | Public | Yêu cầu theo trạm. |
| GET | `/status/:status` | Public | Lọc theo trạng thái (`SupportStatus`). |
| GET | `/:id` | Public | Chi tiết yêu cầu. |
| PATCH | `/:id` | Public | Cập nhật nội dung. |
| PATCH | `/:id/status` | Public | Đổi trạng thái. |
| PATCH | `/:id/rating` | Public | Chấm điểm xử lý. |
| DELETE | `/:id` | Public | Xóa yêu cầu. |

## Battery Transfer Request (`/battery-transfer-request`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo yêu cầu chuyển pin. |
| GET | `/` | Auth | Liệt kê yêu cầu. |
| GET | `/:id` | Auth | Chi tiết yêu cầu. |
| PATCH | `/:id` | Auth | Cập nhật trạng thái/thông tin. |

## Battery Transfer Ticket (`/battery-transfer-ticket`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo phiếu chuyển pin. |
| GET | `/` | Auth | Danh sách phiếu. |
| GET | `/:id` | Auth | Chi tiết phiếu. |
| PATCH | `/:id` | Auth | Cập nhật phiếu. |
| DELETE | `/:id` | Auth | Xóa phiếu. |

## Battery Service Packages (`/battery-service-packages`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Admin | Tạo gói dịch vụ pin. |
| GET | `/` | Auth | Liệt kê (filter `activeOnly`). |
| GET | `/active` | Auth | Gói đang kích hoạt. |
| GET | `/price-range?minPrice=&maxPrice=` | Auth | Tìm theo giá. |
| GET | `/duration/:days` | Auth | Lọc theo số ngày. |
| GET | `/name/:name` | Auth | Tìm theo tên. |
| GET | `/:id` | Auth | Chi tiết gói. |
| PATCH | `/:id` | Admin | Cập nhật gói. |
| PATCH | `/:id/activate` | Admin | Kích hoạt. |
| PATCH | `/:id/deactivate` | Admin | Ngưng kích hoạt. |
| DELETE | `/:id` | Admin | Xóa gói. |

## Subscriptions (`/subscriptions`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo subscription (`CreateSubscriptionDto`). |
| POST | `/expire-subscriptions` | Admin | Chạy batch cập nhật trạng thái hết hạn. |
| GET | `/` | Admin, Station Staff | Danh sách subscription. |
| GET | `/:id` | Driver/Admin/Station Staff | Chi tiết (validate theo user trong JWT). |
| GET | `/user/:userId` | Auth | Subscription của user. |
| GET | `/user/:userId/active` | Auth | Subscription còn hiệu lực. |
| PATCH | `/:id` | Admin | Cập nhật. |
| PATCH | `/:id/cancel` | Driver/Admin | Hủy subscription. |
| PATCH | `/:id/increment-swap` | Station Staff/Admin | Tăng số lượt swap đã dùng. |
| DELETE | `/:id` | Admin | Xóa subscription. |

## Payments (`/payments`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/create-vnpay-url` | Driver/Admin | Endpoint cũ, tạo URL VNPay cho subscription (ép `payment_type=subscription`). |
| POST | `/create-vnpay-url-advanced` | Driver/Admin | Hỗ trợ nhiều `payment_type` (subscription, deposit, damage...). |
| GET | `/vnpay-return` | Public | VNPay redirect -> trả về frontend tương ứng. |
| GET | `/vnpay-ipn` | Public | Xử lý IPN từ VNPay (xác thực chữ ký). |
| GET | `/:id` | Auth | Lấy payment theo ID. |
| GET | `/txn/:vnpTxnRef` | Auth | Tìm payment theo mã giao dịch VNPay. |
| GET | `/user/:userId` | Driver/Admin | Lịch sử thanh toán của user. |
| GET | `/` | Admin | Danh sách payment. |
| POST | `/mock-payment` | Driver/Admin | Giả lập thành công thanh toán (không redirect). |
| POST | `/cancel-expired` | Admin | Hủy các payment pending quá hạn. |
| POST | `/battery-deposit` | Driver/Admin | Tạo URL thanh toán cho tiền đặt cọc pin (body: `user_id`, `amount`, `vehicle_id?`). |
| POST | `/damage-fee` | Driver/Admin | Thanh toán phí hư hỏng. |
| POST | `/battery-replacement` | Driver/Admin | Thanh toán phí thay pin. |
| POST | `/calculate/subscription-fee` | Driver/Admin | Trả breakdown phí gói + đặt cọc. |
| POST | `/calculate/overcharge-fee` | Driver/Admin | Tính phí vượt quãng đường thực tế. |
| POST | `/calculate/damage-fee` | Driver/Admin | Tính phí hư hỏng theo mức độ. |
| POST | `/calculate/complex-fee` | Driver/Admin | Kết hợp nhiều loại phí. |
| POST | `/calculate-and-create-vnpay-url` | Driver/Admin | Tính phí + tạo URL VNPay trong 1 lần. |
| POST | `/direct-with-fees` | Auth | Tạo payment nội bộ (không qua VNPay) và trả breakdown. |

## Config (`/config`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| POST | `/` | Auth | Tạo cấu hình (`CreateConfigDto`). |
| GET | `/` | Public | Liệt kê (filter theo `type`, `activeOnly`). |
| GET | `/:id` | Public | Xem cấu hình. |
| GET | `/by-name/:name` | Public | Tra cứu theo tên. |
| GET | `/value/:name` | Public | Lấy value đơn, trả `{ name, value }`. |
| PATCH | `/:id` | Auth | Cập nhật cấu hình. |
| PATCH | `/:id/toggle` | Auth | Đảo trạng thái kích hoạt. |
| GET | `/system/all` | Admin | Lấy toàn bộ system config từ cache RAM. |
| GET | `/system/:key` | Public | Đọc nhanh một config (từ cache). |
| DELETE | `/:id` | Auth | Xóa cấu hình. |

## AI (`/ai`)
| Method | Đường dẫn | Quyền | Tóm tắt |
| --- | --- | --- | --- |
| GET | `/analyze-station-upgrades` | Admin | Dùng Gemini AI đánh giá, đề xuất nâng cấp trạm (log + xử lý lỗi). |

---

### Ghi chú triển khai
- Nhiều module đã có tài liệu chuyên sâu (xem thêm trong `backend/docs/*`, ví dụ `PAYMENT_TYPES_GUIDE.md`, `SUBSCRIPTION_API.md`). File này chỉ nhằm cung cấp bức tranh tổng quan nhanh.
- Tất cả endpoint đều dùng prefix `/api/v1` (ví dụ `POST /api/v1/payments/create-vnpay-url`).
- Khi mở rộng, nên cập nhật lại bảng ở trên để đảm bảo frontend và QA nắm được phạm vi API hiện có.
