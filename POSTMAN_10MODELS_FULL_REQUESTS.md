# POSTMAN TEST - 10 MODELS - TIẾNG VIỆT 🚀

**Backend Status:** Running ✓  
**Base URL:** `http://localhost:5000/api`

---

## 🔐 MODEL 1: USER & AUTH (Người dùng & Xác thực)

### 1.1 LOGIN - Đăng nhập lấy Token
- **METHOD**: POST
- **URL**: `http://localhost:5000/api/auth/login`
- **Body (JSON)**:
```json
{
  "email": "admin@barber.com",
  "password": "Admin@123456"
}
```
- **Action**: Copy `accessToken`, vào Postman -> **Environments** -> Tạo biến `TOKEN` và paste vào.

### 1.2 UPLOAD AVATAR (Mới!)
- **METHOD**: PUT
- **URL**: `http://localhost:5000/api/users/profile/avatar`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- **Body (form-data)**: 
  - Key: `avatar` (Chọn type: **File**) -> Chọn ảnh bất kỳ.

---

## 🛍️ MODEL 2: PRODUCT & SERVICE (Dịch vụ)

### 2.1 CREATE PRODUCT (CRUD + UPLOAD)
- **METHOD**: POST
- **URL**: `http://localhost:5000/api/products`
- **Headers**: `Authorization: Bearer {{TOKEN}}`
- **Body (form-data)**:
  - `name`: "Cắt tóc mẫu 1"
  - `price`: 50000
  - `duration`: 30
  - `categoryId`: (Lấy ID từ Category)
  - `image`: (Chọn File ảnh)

---

## 📅 MODEL 3: RESERVATION (Đặt lịch)

### 3.1 ĐẶT LỊCH HẸN
- **METHOD**: POST
- **URL**: `http://localhost:5000/api/reservations`
- **Body (JSON)**:
```json
{
  "barberId": "ID_THỢ_X_Ở_ĐÂY",
  "serviceId": "ID_DỊCH_VỤ_X_Ở_ĐÂY",
  "appointmentDate": "2024-04-10",
  "appointmentTime": "10:00"
}
```

---

## 💳 MODEL 4: PAYMENT (Thanh toán QR)

### 4.1 TẠO THANH TOÁN (QR MBBANK)
- **METHOD**: POST
- **URL**: `http://localhost:5000/api/payments`
- **Body (JSON)**:
```json
{ "reservationId": "ID_RESERVATION_Ở_ĐÂY" }
```
- **Kết quả**: Bạn sẽ nhận được `qrUrl`. Copy link dán vào trình duyệt để test QR.

---

## ⭐ MODEL 5: REVIEW (Đánh giá)

### 5.1 GỬI ĐÁNH GIÁ (Sau khi cắt xong)
- **METHOD**: POST
- **URL**: `http://localhost:5000/api/reviews`
- **Body (JSON)**:
```json
{
  "reservationId": "ID_Ở_TRÊN",
  "rating": 5,
  "comment": "Rất hài lòng!"
}
```

---

## 📬 MODEL 6: MESSAGE (Thông báo/Chat)

### 6.1 XEM TIN NHẮN
- **METHOD**: GET
- **URL**: `http://localhost:5000/api/messages`

---

## 📦 MODEL 7: INVENTORY (Kho hàng)

### 7.1 KIỂM TRA HÀNG SẮP HẾT
- **METHOD**: GET
- **URL**: `http://localhost:5000/api/inventory?lowStock=true`

---

## 📂 MODEL 8: CATEGORY (Danh mục)
- **GET**: `http://localhost:5000/api/categories`

## 🛒 MODEL 9: CART (Giỏ hàng)
- **POST**: `http://localhost:5000/api/carts/items` -> `{"productId": "...", "quantity": 1}`

## 👥 MODEL 10: ROLE (Phân quyền)
- **GET**: `http://localhost:5000/api/roles`

---

### 📝 CHÚ Ý CHO BÁO CÁO:
1. Chụp ảnh màn hình Postman cho từng Model.
2. Đảm bảo Backend đang chạy (`npm run dev`).
3. Database MongoDB đang bật.
